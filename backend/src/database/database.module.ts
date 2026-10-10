import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { Tenant } from '../modules/tenant/entities/tenant.entity';
import { TenantSettings } from '../modules/tenant/entities/tenant-settings.entity';
import { User } from '../modules/users/entities/user.entity';
import { Product } from '../modules/products/entities/product.entity';
import { Category } from '../modules/categories/entities/category.entity';
import { StockMovement } from '../modules/stock/entities/stock-movement.entity';
import { Customer } from '../modules/customers/entities/customer.entity';
import { Invoice } from '../modules/invoices/entities/invoice.entity';
import { InvoiceItem } from '../modules/invoices/entities/invoice-item.entity';
import { DailyRegisterSession } from '../modules/register/entities/daily-register-session.entity';
import { Account } from '../modules/accounts/entities/account.entity';
import { Transaction } from '../modules/transactions/entities/transaction.entity';
import { Budget } from '../modules/budgets/entities/budget.entity';
import { Merchant } from '../modules/merchants/entities/merchant.entity';
import { PaymentMethod } from '../modules/payment-methods/entities/payment-method.entity';
import { Tag } from '../modules/tags/entities/tag.entity';

export const ALL_ENTITIES = [
  Tenant,
  TenantSettings,
  User,
  Product,
  Category,
  StockMovement,
  Customer,
  Invoice,
  InvoiceItem,
  DailyRegisterSession,
  Account,
  Transaction,
  Budget,
  Merchant,
  PaymentMethod,
  Tag,
];

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get<string>('DB_USERNAME', process.env.USER || 'itsmibrahim'),
        password: config.get<string>('DB_PASSWORD', ''),
        database: config.get<string>('DB_NAME', 'expensemngr_nest'),
        entities: ALL_ENTITIES,
        synchronize: true, // Auto-create schema in development
        logging: false,
      }),
    }),
  ],
})
export class DatabaseModule {}
