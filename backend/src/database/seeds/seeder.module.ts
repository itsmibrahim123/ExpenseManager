import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeederService } from './seeder.service';
import { Tenant } from '../../modules/tenant/entities/tenant.entity';
import { TenantSettings } from '../../modules/tenant/entities/tenant-settings.entity';
import { User } from '../../modules/users/entities/user.entity';
import { Account } from '../../modules/accounts/entities/account.entity';
import { Category } from '../../modules/categories/entities/category.entity';
import { Customer } from '../../modules/customers/entities/customer.entity';
import { Product } from '../../modules/products/entities/product.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Tenant,
      TenantSettings,
      User,
      Account,
      Category,
      Customer,
      Product,
    ]),
  ],
  providers: [SeederService],
  exports: [SeederService],
})
export class SeederModule {}
