import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invoice } from './entities/invoice.entity';
import { InvoiceItem } from './entities/invoice-item.entity';
import { InvoicePayment } from './entities/invoice-payment.entity';
import { Product } from '../products/entities/product.entity';
import { ProductSerial } from '../products/entities/product-serial.entity';
import { StockMovement } from '../stock/entities/stock-movement.entity';
import { Customer } from '../customers/entities/customer.entity';
import { Account } from '../accounts/entities/account.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { TenantSettings } from '../tenant/entities/tenant-settings.entity';
import { InvoicesService } from './invoices.service';
import { InvoicesController } from './invoices.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Invoice,
      InvoiceItem,
      InvoicePayment,
      Product,
      ProductSerial,
      StockMovement,
      Customer,
      Account,
      Transaction,
      TenantSettings,
    ]),
  ],
  providers: [InvoicesService],
  controllers: [InvoicesController],
  exports: [InvoicesService, TypeOrmModule],
})
export class InvoicesModule {}
