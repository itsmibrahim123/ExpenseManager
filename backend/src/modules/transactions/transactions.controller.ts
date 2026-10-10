import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto, TransferRequestDto } from './dto/transaction.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantSecurityGuard } from '../../common/guards/tenant-security.guard';

@Controller(['transactions', 'api/transactions'])
@UseGuards(JwtAuthGuard, TenantSecurityGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  async getTransactions(
    @Query('userId') userId?: string,
    @Query('accountId') accountId?: string,
  ) {
    const uid = userId ? parseInt(userId, 10) : undefined;
    const accId = accountId ? parseInt(accountId, 10) : undefined;
    return this.transactionsService.getTransactions(uid, accId);
  }

  @Get(':id')
  async getTransactionById(@Param('id', ParseIntPipe) id: number) {
    return this.transactionsService.getTransactionById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createTransaction(
    @Body() dto: CreateTransactionDto,
    @Query('allowNegative') allowNegative?: string,
  ) {
    const isAllow = allowNegative === 'true' || allowNegative === '1';
    return this.transactionsService.createTransaction(dto, isAllow);
  }

  @Post('transfer')
  @HttpCode(HttpStatus.CREATED)
  async transferFunds(
    @Body() dto: TransferRequestDto,
    @Query('allowNegative') allowNegative?: string,
  ) {
    const isAllow = allowNegative === 'true' || allowNegative === '1';
    return this.transactionsService.transferFunds(dto, isAllow);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Query('status') status: string,
  ) {
    return this.transactionsService.updateStatus(id, status);
  }
}
