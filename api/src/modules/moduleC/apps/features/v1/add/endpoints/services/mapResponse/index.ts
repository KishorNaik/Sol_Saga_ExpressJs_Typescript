import {
	IServiceHandlerAsync,
	IServiceHandlerVoidAsync,
	Result,
	ResultError,
	ResultFactory,
	sealed,
	Service,
	StatusCodes,
	tryCatchResultAsync,
	VOID_RESULT,
	VoidResult,
} from '@kishornaik/utils';
import { ArithmeticContext } from '../..';
import { CResponseDto } from '../../../contracts';

export interface ICMapResponseService
	extends IServiceHandlerAsync<ArithmeticContext, CResponseDto> {}

@sealed
@Service()
export class CMapResponseService implements ICMapResponseService {
	public handleAsync(params: ArithmeticContext): Promise<Result<CResponseDto, ResultError>> {
		return tryCatchResultAsync(async () => {
			// Guards
			if (!params) return ResultFactory.error(StatusCodes.BAD_REQUEST, 'params is required');

			// Map Response
			const response: CResponseDto = {
				result: params.ResultC,
			};

			return ResultFactory.success(response);
		});
	}
}
