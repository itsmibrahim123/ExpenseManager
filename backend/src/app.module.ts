import {
  Module,
  NestModule,
  MiddlewareConsumer,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';

import { DatabaseModule } from './database/database.module';
import { SeederModule } from './database/seeds/seeder.module';
import { TenantSecurityMiddleware } from './common/middleware/tenant-security.middleware';
import { TenantSubscriptionInterceptor } from './common/interceptors/tenant-subscription.interceptor';

import { TenantModule } from './modules/tenant/tenant.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { SuperAdminModule } from './modules/super-admin/super-admin.module';
import { ProductsModule } from './modules/products/products.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { CustomersModule } from './modules/customers/customers.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { RegisterModule } from './modules/register/register.module';
import { AccountsModule } from './modules/accounts/accounts.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { SupportingModule } from './modules/budgets/supporting.module';

import { AppController } from './app.controller';

@Module({
  controllers: [AppController],
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    SeederModule,
    TenantModule,
    UsersModule,
    AuthModule,
    SuperAdminModule,
    ProductsModule,
    CategoriesModule,
    CustomersModule,
    InvoicesModule,
    RegisterModule,
    AccountsModule,
    TransactionsModule,
    DashboardModule,
    SupportingModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: TenantSubscriptionInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantSecurityMiddleware).forRoutes('*');
  }
}
