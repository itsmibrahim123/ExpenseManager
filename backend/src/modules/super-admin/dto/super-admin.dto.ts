import { IsEmail, IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';
import { PlanTier } from '../../tenant/entities/tenant.entity';

export class TenantOnboardingDto {
  @IsString()
  @IsNotEmpty()
  storeName: string;

  @IsString()
  @IsNotEmpty()
  slug: string;

  @IsString()
  @IsNotEmpty()
  ownerName: string;

  @IsEmail()
  @IsNotEmpty()
  ownerEmail: string;

  @IsString()
  @IsNotEmpty()
  ownerPassword: string;

  @IsString()
  @IsOptional()
  contactPhone?: string;

  @IsString()
  @IsOptional()
  currencyCode?: string;

  @IsOptional()
  planTier?: PlanTier;

  @IsNumber()
  @IsOptional()
  trialDays?: number;
}

export class UpdateTenantStatusDto {
  @IsString()
  @IsNotEmpty()
  status: string;
}

export class UpdateSubscriptionDto {
  @IsOptional()
  planTier?: PlanTier;

  @IsOptional()
  expiresAt?: Date;

  @IsNumber()
  @IsOptional()
  extendDays?: number;
}
