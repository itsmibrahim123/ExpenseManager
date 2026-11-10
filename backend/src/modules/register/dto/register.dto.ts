import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { RegisterMovementType } from '../entities/register-movement.entity';

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

export class CreateRegisterMovementDto {
  @IsNumber()
  @IsNotEmpty()
  sessionId: number;

  @IsEnum(RegisterMovementType)
  @IsNotEmpty()
  movementType: RegisterMovementType;

  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsNumber()
  @IsOptional()
  userId?: number;
}
