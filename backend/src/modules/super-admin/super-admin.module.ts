import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SuperAdminService } from './super-admin.service';
import { SuperAdminController } from './super-admin.controller';
import { Tenant } from '../tenant/entities/tenant.entity';
import { TenantSettings } from '../tenant/entities/tenant-settings.entity';
import { User } from '../users/entities/user.entity';
import { Invoice } from '../invoices/entities/invoice.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Tenant, TenantSettings, User, Invoice]),
  ],
  providers: [SuperAdminService],
  controllers: [SuperAdminController],
  exports: [SuperAdminService],
})
export class SuperAdminModule {}
