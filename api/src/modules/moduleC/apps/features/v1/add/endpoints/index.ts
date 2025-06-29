import { Response } from 'express';
import {
	Body,
	HttpCode,
	JsonController,
	OnUndefined,
	Post,
	Res,
	UseBefore,
} from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import { ValidationMiddleware } from '@/middlewares/security/validations';
import {
	RequestData,
	sealed,
	StatusCodes,
	DataResponse as ApiDataResponse,
	requestHandler,
	RequestHandler,
	DataResponseFactory,
	PipelineWorkflowException,
	PipelineWorkflow,
	Container,
	RequestReplyProducerBullMq,
	bullMqRedisConnection,
	SagaOrchestratorBuilder,
	VoidResult,
} from '@kishornaik/utils';
import { mediator } from '@/shared/utils/helpers/medaitR';
import { logger } from '@/shared/utils/helpers/loggers';
import { CRequestDto, CResponseDto } from '../contracts';
import { ModuleAService } from './services/moduleA';
import { ModuleBService } from './services/moduleB';
import { RunSagaService } from './services/runSaga';
import { CMapResponseService } from './services/mapResponse';

// Set up queues
const aActionQueueName = `moduleA-action-queue`;
const producerAAction = new RequestReplyProducerBullMq(bullMqRedisConnection);
producerAAction.setQueues(aActionQueueName).setQueueEvents();

const aCompensateQueueName = 'moduleA-compensate-queue';
const producerACompensate = new RequestReplyProducerBullMq(bullMqRedisConnection);
producerACompensate.setQueues(aCompensateQueueName).setQueueEvents();

const bActionQueueName = `moduleB-action-queue`;
const producerBAction = new RequestReplyProducerBullMq(bullMqRedisConnection);
producerBAction.setQueues(bActionQueueName).setQueueEvents();

const bCompensateQueueName = 'moduleB-compensate-queue';
const producerBCompensate = new RequestReplyProducerBullMq(bullMqRedisConnection);
producerBCompensate.setQueues(bCompensateQueueName).setQueueEvents();

// #region Endpoint
@JsonController(`/api/v1/c`)
@OpenAPI({ tags: [`c`] })
export class CEndpoint {
	@Post()
	@OpenAPI({
		summary: `C Module Demo`,
		tags: [`c`],
		description: `C module Demo`,
	})
	@HttpCode(StatusCodes.OK)
	@OnUndefined(StatusCodes.BAD_REQUEST)
	@UseBefore(ValidationMiddleware(CRequestDto))
	public async postAsync(@Body() request: CRequestDto, @Res() res: Response) {
		const response = await mediator.send(new CCommand(request));
		return res.status(StatusCodes.OK).json(response);
	}
}
//#endregion

// #region Command
@sealed
class CCommand extends RequestData<ApiDataResponse<CResponseDto>> {
	private readonly _request: CRequestDto;

	constructor(request: CRequestDto) {
		super();
		this._request = request;
	}

	public get request(): CRequestDto {
		return this._request;
	}
}

// #endregion

// #region Saga Context
export class ArithmeticContext {
	public ResultA: number;
	public ResultB: number;
	public ResultC: number;
}
// #endregion

//#region Command Handler
@sealed
@requestHandler(CCommand)
class CCommandHandler implements RequestHandler<CCommand, ApiDataResponse<CResponseDto>> {
	private pipeline = new PipelineWorkflow(logger);
	private arithmeticContext = new ArithmeticContext();
	private saga = new SagaOrchestratorBuilder<ArithmeticContext>(
		`saga-arithmetic-demo`,
		this.arithmeticContext,
		logger
	);

	private readonly _moduleAService: ModuleAService;
	private readonly _moduleBService: ModuleBService;
	private readonly _runSagaService: RunSagaService;
	private readonly _mapResponseService: CMapResponseService;

	public constructor() {
		this._moduleAService = Container.get(ModuleAService);
		this._moduleBService = Container.get(ModuleBService);
		this._runSagaService = Container.get(RunSagaService);
		this._mapResponseService = Container.get(CMapResponseService);
	}

	public async handle(value: CCommand): Promise<ApiDataResponse<CResponseDto>> {
		try {
			// Guards
			if (!value)
				return DataResponseFactory.error(StatusCodes.BAD_REQUEST, `value is required`);

			if (!value.request)
				return DataResponseFactory.error(StatusCodes.BAD_REQUEST, `request is required`);

			const { request } = value;

			// Module A Pipeline
			await this.pipeline.step<VoidResult>(`pipeline-module-a`, async () => {
				const result = await this._moduleAService.handleAsync({
					values: {
						value1: request.value1,
						value2: request.value2,
					},
					saga: {
						orchestrator: this.saga,
					},
					queue: {
						action: {
							name: aActionQueueName,
							producer: producerAAction,
						},
						compensate: {
							name: aCompensateQueueName,
							producer: producerACompensate,
						},
					},
				});

				return result;
			});

			// Module B Pipeline
			await this.pipeline.step<VoidResult>(`pipeline-module-b`, async () => {
				const result = await this._moduleBService.handleAsync({
					value: 5,
					saga: {
						orchestrator: this.saga,
					},
					queue: {
						action: {
							name: bActionQueueName,
							producer: producerBAction,
						},
						compensate: {
							name: bCompensateQueueName,
							producer: producerBCompensate,
						},
					},
				});

				return result;
			});

			// Run Saga
			await this.pipeline.step(`pipeline-run-saga`, async () => {
				const result = await this._runSagaService.handleAsync({
					saga: {
						orchestrator: this.saga,
					},
				});
				return result;
			});

			// Map Response
			await this.pipeline.step(`pipeline-map-response`, async () => {
				// Get Saga Context
				const sagaContext = this.pipeline.getResult<ArithmeticContext>(`pipeline-run-saga`);
				const result = await this._mapResponseService.handleAsync(sagaContext);
				return result;
			});

			// Return
			const response = this.pipeline.getResult<CResponseDto>(`pipeline-map-response`);
			return DataResponseFactory.success(StatusCodes.OK, response, `success-saga`);
		} catch (ex) {
			return DataResponseFactory.pipelineError(ex);
		}
	}
}

//#endregion
