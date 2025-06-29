import {
	IServiceHandlerAsync,
	Result,
	ResultError,
	ResultFactory,
	SagaOrchestratorBuilder,
	sealed,
	Service,
	StatusCodes,
	tryCatchResultAsync,
} from '@kishornaik/utils';
import { ArithmeticContext } from '../..';

export interface IRunSagaServiceParameters {
	saga: {
		orchestrator: SagaOrchestratorBuilder<ArithmeticContext>;
	};
}

export interface IRunSagaService
	extends IServiceHandlerAsync<IRunSagaServiceParameters, ArithmeticContext> {}

@sealed
@Service()
export class RunSagaService implements IRunSagaService {
	public handleAsync(
		params: IRunSagaServiceParameters
	): Promise<Result<ArithmeticContext, ResultError>> {
		return tryCatchResultAsync(async () => {
			// Guards
			if (!params) return ResultFactory.error(StatusCodes.BAD_REQUEST, 'params is required');

			if (!params.saga)
				return ResultFactory.error(StatusCodes.BAD_REQUEST, 'saga is required');

			if (!params.saga.orchestrator)
				return ResultFactory.error(
					StatusCodes.BAD_REQUEST,
					'saga orchestrator is required'
				);

			const { saga } = params;

			// Run Saga Orchestrator
			await saga.orchestrator.runAsync();

			// Get Final Saga Context
			const sagaContext = saga.orchestrator.getContext();

      // Additional of Result A + Result B
      sagaContext.context.ResultC = sagaContext.context.ResultA + sagaContext.context.ResultB;

			return ResultFactory.success(sagaContext.context);
		});
	}
}
