import {
	IServiceHandlerVoidAsync,
	JsonString,
	ReplyMessageBullMq,
	RequestReplyMessageBullMq,
	RequestReplyProducerBullMq,
	Result,
	ResultError,
	ResultFactory,
	SagaOrchestratorBuilder,
	sealed,
	Service,
	StatusCodes,
	tryCatchResultAsync,
	VOID_RESULT,
	VoidResult,
} from '@kishornaik/utils';
import { ArithmeticContext } from '../..';
import { randomUUID } from 'crypto';

export interface IModuleAServiceParameters {
	values: {
		value1: number;
		value2: number;
	};
	saga: {
		orchestrator: SagaOrchestratorBuilder<ArithmeticContext>;
	};
	queue: {
		action: {
			name: string;
			producer: RequestReplyProducerBullMq;
		};
		compensate: {
			name: string;
			producer: RequestReplyProducerBullMq;
		};
	};
}

export interface IModuleAService extends IServiceHandlerVoidAsync<IModuleAServiceParameters> {}

@sealed
@Service()
export class ModuleAService implements IModuleAService {
	public handleAsync(
		params: IModuleAServiceParameters
	): Promise<Result<VoidResult, ResultError>> {
		return tryCatchResultAsync(async () => {
			// Guards
			if (!params) return ResultFactory.error(StatusCodes.BAD_REQUEST, 'params is required');

			if (!params.values)
				return ResultFactory.error(StatusCodes.BAD_REQUEST, 'parameter value is required');

			if (!params.saga)
				return ResultFactory.error(StatusCodes.BAD_REQUEST, 'saga is required');

			if (!params.saga.orchestrator)
				return ResultFactory.error(
					StatusCodes.BAD_REQUEST,
					'saga orchestrator is required'
				);

			if (!params.queue)
				return ResultFactory.error(StatusCodes.BAD_REQUEST, 'queue is required');

			if (!params.queue.action)
				return ResultFactory.error(StatusCodes.BAD_REQUEST, 'queue action is required');

			if (!params.queue.compensate)
				return ResultFactory.error(StatusCodes.BAD_REQUEST, 'queue compensate is required');

			const { values, saga, queue } = params;

			// Module A Saga Step Implementation
			saga.orchestrator.step<number>({
				// Module A Result
				label: `saga-module-a`,
				action: async (ctx) => {
					return tryCatchResultAsync(async () => {

            //@Testing
            //throw new Error('test');
            //return ResultFactory.error(
            //     StatusCodes.INTERNAL_SERVER_ERROR,
            //     `Failed to send message to queue: ${queue.action.name}`
            //   );

						// Values
						const valueObject = {
							value1: values.value1,
							value2: values.value2,
						};
						const valueJson = JSON.stringify(valueObject) as JsonString;

						// trigger action queue
						const message: RequestReplyMessageBullMq<JsonString> = {
							correlationId: randomUUID(),
							data: valueJson,
						};

						const queueResult: ReplyMessageBullMq<JsonString> =
							await queue.action.producer.sendAsync<JsonString, JsonString>(
								`JOB:${queue.action.name}`,
								message
							);

						if (!queueResult.success)
							return ResultFactory.error(
								StatusCodes.INTERNAL_SERVER_ERROR,
								`Failed to send message to queue: ${queue.action.name}`
							);

						if (!queueResult.data)
							return ResultFactory.error(
								StatusCodes.INTERNAL_SERVER_ERROR,
								`Failed to send message to queue: ${queue.action.name}`
							);

						// Get Result from the Queue
						const resultObject = JSON.parse(queueResult.data) as {
							result: number;
						};

						const aResult = resultObject.result;

						// Set A Result in the Saga Context
						ctx.isSuccess = true;
						ctx.context.ResultA = aResult;

						return ResultFactory.success(aResult);
					});
				}, // Action
				compensate: async (ctx) => {
					// trigger action queue
					const message: RequestReplyMessageBullMq<string> = {
						correlationId: randomUUID(),
						data: String(0),
					};

					const queueResult: ReplyMessageBullMq<string> =
						await queue.compensate.producer.sendAsync<string, string>(
							`JOB:${queue.compensate.name}`,
							message
						);

					if (!queueResult.success)
						throw new Error(
							`Failed to send message to queue: ${queue.compensate.name}`
						);

					if (!queueResult.data)
						throw new Error(
							`Failed to send message to queue: ${queue.compensate.name}`
						);

					ctx.isSuccess = false;
					ctx.context.ResultA = 0;
				}, // Compensate
			});

			return ResultFactory.success(VOID_RESULT);
		});
	}
}
