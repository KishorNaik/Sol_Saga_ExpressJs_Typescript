import { IsDefined, IsNumber } from "class-validator";

// #region Request Dto
export class CRequestDto {

  @IsDefined({ message: 'value1 is required' })
  @IsNumber({}, { message: 'value1 must be a number' })
	public value1: number;

  @IsDefined({ message: 'value2 is required' })
  @IsNumber({}, { message: 'value2 must be a number' })
	public value2: number;
}
// #endregion Request Dto

// #region Response Dto
export class CResponseDto {
	public result: number;
}
// #endregion Response Dto
