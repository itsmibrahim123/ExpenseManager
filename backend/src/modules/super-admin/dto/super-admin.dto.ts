import { IsEmail, IsNotEmpty, IsOptional, IsString, IsNumber, MinLength, IsEnum } from 'class-validator';
import { PlanTier } from '../../tenant/entities/tenant.entity';
import { UserRole } from '../../users/entities/user.entity';

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

export interface PlatformGovernanceMetricsDto {
  totalTenants: number;
  activeTenants: number;
  suspendedTenants: number;
  trialTenants: number;
  totalUsers: number;
  usersByRole: {
    superAdmin: number;
    storeAdmin: number;
    inventoryManager: number;
    cashier: number;
  };
  expiringSubscriptionsCount: number; // Subscriptions ending in <= 7 days
}

export class CreatePlatformUserDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password: string;

  @IsEnum(UserRole)
  @IsNotEmpty()
  role: UserRole;

  @IsOptional()
  @IsString()
  tenantId?: string | null;
}

export class UpdateUserAccessDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  tenantId?: string | null;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;
}

export class ResetUserPasswordDto {
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  newPassword?: string;
}
