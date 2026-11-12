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
import { InvoicePayment } from '../modules/invoices/entities/invoice-payment.entity';
import { ProductSerial } from '../modules/products/entities/product-serial.entity';
import { DailyRegisterSession } from '../modules/register/entities/daily-register-session.entity';
import { RegisterMovement } from '../modules/register/entities/register-movement.entity';
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
  ProductSerial,
  Category,
  StockMovement,
  Customer,
  Invoice,
  InvoiceItem,
  InvoicePayment,
  DailyRegisterSession,
  RegisterMovement,
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
      useFactory: (config: ConfigService) => {
        const databaseUrl = config.get<string>('DATABASE_URL');
        const isProduction = config.get<string>('NODE_ENV') === 'production';
        const useSsl = config.get<string>('DATABASE_SSL') === 'true' || isProduction;

        const baseConfig = databaseUrl
          ? { url: databaseUrl }
          : {
              host: config.get<string>('DATABASE_HOST') || config.get<string>('DB_HOST', 'localhost'),
              port: config.get<number>('DATABASE_PORT') || config.get<number>('DB_PORT', 5432),
              username: config.get<string>('DATABASE_USER') || config.get<string>('DB_USERNAME', process.env.USER || 'postgres'),
              password: config.get<string>('DATABASE_PASSWORD') || config.get<string>('DB_PASSWORD', ''),
              database: config.get<string>('DATABASE_NAME') || config.get<string>('DB_NAME', 'expensemngr_nest'),
            };

        const typeormSync = config.get<string>('TYPEORM_SYNC');
        const synchronize = typeormSync !== undefined ? typeormSync === 'true' : !isProduction;

        return {
          type: 'postgres',
          ...baseConfig,
          entities: ALL_ENTITIES,
          autoLoadEntities: true,
          synchronize,
          ssl: useSsl ? { rejectUnauthorized: false } : false,
          logging: config.get<string>('DB_LOGGING') === 'true',
        };
      },
    }),
  ],
})
export class DatabaseModule {}
