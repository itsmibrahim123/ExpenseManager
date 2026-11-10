import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { PlanTier } from '../../tenant/entities/tenant.entity';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @IsNotEmpty()
  storeName: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsOptional()
  contactPhone?: string;

  @IsString()
  @IsOptional()
  currencyCode?: string;

  @IsString()
  @IsOptional()
  preferredCurrency?: string;

  @IsOptional()
  planTier?: PlanTier;
}
