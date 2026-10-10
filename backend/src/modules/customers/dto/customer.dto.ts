import { IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';

export class CustomerDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  taxId?: string;

  @IsNumber()
  @IsOptional()
  currentCreditBalance?: number;
}
