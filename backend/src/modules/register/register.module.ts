import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DailyRegisterSession } from './entities/daily-register-session.entity';
import { Invoice } from '../invoices/entities/invoice.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { RegisterService } from './register.service';
import { RegisterController } from './register.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DailyRegisterSession,
      Invoice,
      Transaction,
    ]),
  ],
  providers: [RegisterService],
  controllers: [RegisterController],
  exports: [RegisterService, TypeOrmModule],
})
export class RegisterModule {}
