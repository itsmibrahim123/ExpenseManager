import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Transaction } from './entities/transaction.entity';
import { Account } from '../accounts/entities/account.entity';
import { TenantContext } from '../../common/context/tenant-context';
import { CreateTransactionDto, TransferRequestDto } from './dto/transaction.dto';

@Injectable()
export class TransactionsService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,
    @InjectRepository(Account)
    private readonly accountRepo: Repository<Account>,
  ) {}

  private getTenantId(): string {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) {
      throw new BadRequestException('Tenant context is required');
    }
    return tenantId;
  }

  async getTransactions(userId?: number, accountId?: number): Promise<Transaction[]> {
    const tenantId = this.getTenantId();
    const qb = this.transactionRepo.createQueryBuilder('t')
      .leftJoinAndSelect('t.account', 'a')
      .leftJoinAndSelect('t.category', 'c')
      .where('t.tenantId = :tenantId', { tenantId });

    if (userId) {
      qb.andWhere('t.userId = :userId', { userId });
    }
    if (accountId) {
      qb.andWhere('t.accountId = :accountId', { accountId });
    }

    qb.orderBy('t.transactionDate', 'DESC').addOrderBy('t.createdAt', 'DESC');
    return qb.getMany();
  }

  async getTransactionById(id: number): Promise<Transaction> {
    const tenantId = this.getTenantId();
    const tx = await this.transactionRepo.findOne({
      where: { id, tenantId },
      relations: ['account', 'category'],
    });
    if (!tx) {
      throw new NotFoundException(`Transaction not found with id: ${id}`);
    }
    return tx;
  }

  async createTransaction(dto: CreateTransactionDto, allowNegative: boolean = false): Promise<Transaction> {
    const tenantId = this.getTenantId();

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const account = await queryRunner.manager.findOne(Account, {
        where: { id: dto.accountId, tenantId },
      });
      if (!account) {
        throw new NotFoundException(`Account not found with id: ${dto.accountId}`);
      }

      const amount = Number(dto.amount);
      const isExpense = dto.type.toUpperCase() === 'EXPENSE';

      if (isExpense && !allowNegative && Number(account.currentBalance) < amount) {
        throw new BadRequestException(
          `Insufficient funds in account '${account.name}'. Current: ${account.currentBalance}, Requested: ${amount}`,
        );
      }

      if (isExpense) {
        account.currentBalance = Number(account.currentBalance) - amount;
      } else {
        account.currentBalance = Number(account.currentBalance) + amount;
      }
      await queryRunner.manager.save(account);

      const transaction = queryRunner.manager.create(Transaction, {
        tenantId,
        userId: dto.userId,
        accountId: dto.accountId,
        categoryId: dto.categoryId,
        type: dto.type.toUpperCase(),
        amount,
        currencyCode: dto.currencyCode || account.currencyCode || 'PKR',
        transactionDate: dto.transactionDate ? new Date(dto.transactionDate) : new Date(),
        status: dto.status || 'COMPLETED',
        referenceNumber: dto.referenceNumber,
        description: dto.description,
      });

      const savedTx = await queryRunner.manager.save(transaction);
      await queryRunner.commitTransaction();

      return this.getTransactionById(savedTx.id);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async transferFunds(dto: TransferRequestDto, allowNegative: boolean = false) {
    const tenantId = this.getTenantId();

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const fromAccount = await queryRunner.manager.findOne(Account, {
        where: { id: dto.fromAccountId, tenantId },
      });
      const toAccount = await queryRunner.manager.findOne(Account, {
        where: { id: dto.toAccountId, tenantId },
      });

      if (!fromAccount || !toAccount) {
        throw new NotFoundException('Source or destination account not found.');
      }

      const amount = Number(dto.amount);
      if (!allowNegative && Number(fromAccount.currentBalance) < amount) {
        throw new BadRequestException(
          `Insufficient balance in source account. Current: ${fromAccount.currentBalance}, Transfer: ${amount}`,
        );
      }

      fromAccount.currentBalance = Number(fromAccount.currentBalance) - amount;
      toAccount.currentBalance = Number(toAccount.currentBalance) + amount;
      await queryRunner.manager.save(fromAccount);
      await queryRunner.manager.save(toAccount);

      const desc = dto.description || `Transfer from ${fromAccount.name} to ${toAccount.name}`;

      const debitTx = queryRunner.manager.create(Transaction, {
        tenantId,
        userId: dto.userId,
        accountId: fromAccount.id,
        categoryId: dto.categoryId || 1,
        type: 'TRANSFER',
        amount: -amount,
        currencyCode: fromAccount.currencyCode,
        transactionDate: new Date(),
        status: 'COMPLETED',
        description: desc,
      });
      const savedDebit = await queryRunner.manager.save(debitTx);

      const creditTx = queryRunner.manager.create(Transaction, {
        tenantId,
        userId: dto.userId,
        accountId: toAccount.id,
        categoryId: dto.categoryId || 1,
        type: 'TRANSFER',
        amount,
        currencyCode: toAccount.currencyCode,
        transactionDate: new Date(),
        status: 'COMPLETED',
        description: desc,
        linkedTransactionId: savedDebit.id,
      });
      const savedCredit = await queryRunner.manager.save(creditTx);

      savedDebit.linkedTransactionId = savedCredit.id;
      await queryRunner.manager.save(savedDebit);

      await queryRunner.commitTransaction();

      return {
        fromTransaction: savedDebit,
        toTransaction: savedCredit,
        transferAmount: amount,
      };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async updateStatus(id: number, status: string): Promise<Transaction> {
    const tx = await this.getTransactionById(id);
    tx.status = status;
    await this.transactionRepo.save(tx);
    return this.getTransactionById(id);
  }
}
