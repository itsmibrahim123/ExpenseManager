import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class OpenRegisterDto {
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @IsNumber()
  @IsNotEmpty()
  openingCashBalance: number;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class CloseRegisterDto {
  @IsNumber()
  @IsNotEmpty()
  actualCashBalance: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
