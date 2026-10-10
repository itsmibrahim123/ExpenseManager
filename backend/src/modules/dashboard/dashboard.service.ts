import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from '../transactions/entities/transaction.entity';
import { Account } from '../accounts/entities/account.entity';
import { Category } from '../categories/entities/category.entity';
import { TenantContext } from '../../common/context/tenant-context';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,
    @InjectRepository(Account)
    private readonly accountRepo: Repository<Account>,
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
  ) {}

  private getTenantId(): string {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) {
      throw new BadRequestException('Tenant context is required');
    }
    return tenantId;
  }

  async getSummary(userId?: number) {
    const tenantId = this.getTenantId();
    const qb = this.transactionRepo.createQueryBuilder('t')
      .where('t.tenantId = :tenantId', { tenantId });

    if (userId) {
      qb.andWhere('t.userId = :userId', { userId });
    }

    const transactions = await qb.getMany();

    let totalIncome = 0;
    let totalExpense = 0;

    for (const t of transactions) {
      const amt = Number(t.amount) || 0;
      if (t.type === 'INCOME') totalIncome += amt;
      else if (t.type === 'EXPENSE') totalExpense += amt;
    }

    const netSavings = totalIncome - totalExpense;

    const accounts = await this.accountRepo.find({
      where: { tenantId, archived: false },
    });
    const totalBalance = accounts.reduce(
      (sum, a) => sum + (Number(a.currentBalance) || 0),
      0,
    );

    return {
      totalIncome,
      totalExpense,
      netSavings,
      totalBalance,
      currency: accounts[0]?.currencyCode || 'PKR',
    };
  }

  async getCategoryBreakdown(userId?: number, type: string = 'EXPENSE') {
    const tenantId = this.getTenantId();
    const qb = this.transactionRepo.createQueryBuilder('t')
      .leftJoinAndSelect('t.category', 'c')
      .where('t.tenantId = :tenantId', { tenantId })
      .andWhere('t.type = :type', { type });

    if (userId) {
      qb.andWhere('t.userId = :userId', { userId });
    }

    const transactions = await qb.getMany();
    const breakdown: Record<string, { total: number; color?: string; name: string }> = {};

    for (const t of transactions) {
      const catName = t.category?.name || 'Uncategorized';
      if (!breakdown[catName]) {
        breakdown[catName] = {
          total: 0,
          color: t.category?.color || '#2196f3',
          name: catName,
        };
      }
      breakdown[catName].total += Number(t.amount) || 0;
    }

    return Object.values(breakdown);
  }

  async getAccountSummary(userId?: number) {
    const tenantId = this.getTenantId();
    const accounts = await this.accountRepo.find({
      where: { tenantId, archived: false },
    });
    return accounts.map((a) => ({
      id: a.id,
      name: a.name,
      type: a.type,
      currentBalance: Number(a.currentBalance),
      currencyCode: a.currencyCode,
    }));
  }

  async getSpendingTrends(userId?: number) {
    const tenantId = this.getTenantId();
    const qb = this.transactionRepo.createQueryBuilder('t')
      .where('t.tenantId = :tenantId', { tenantId });

    if (userId) {
      qb.andWhere('t.userId = :userId', { userId });
    }

    const transactions = await qb.getMany();
    const monthly: Record<string, { month: string; income: number; expense: number }> = {};

    for (const t of transactions) {
      const d = new Date(t.transactionDate || t.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!monthly[key]) {
        monthly[key] = { month: key, income: 0, expense: 0 };
      }
      const amt = Number(t.amount) || 0;
      if (t.type === 'INCOME') monthly[key].income += amt;
      else if (t.type === 'EXPENSE') monthly[key].expense += amt;
    }

    return Object.values(monthly).sort((a, b) => a.month.localeCompare(b.month));
  }

  async getIncomeExpenseComparison(userId?: number) {
    return this.getSpendingTrends(userId);
  }

  async getTopCategories(userId?: number, type: string = 'EXPENSE') {
    const breakdown = await this.getCategoryBreakdown(userId, type);
    return breakdown.sort((a, b) => b.total - a.total).slice(0, 5);
  }

  async getBudgetProgress(userId?: number) {
    return [];
  }
}
