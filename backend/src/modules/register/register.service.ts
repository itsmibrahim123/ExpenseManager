import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { DailyRegisterSession } from './entities/daily-register-session.entity';
import { Invoice } from '../invoices/entities/invoice.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { TenantContext } from '../../common/context/tenant-context';
import { OpenRegisterDto, CloseRegisterDto } from './dto/register.dto';

@Injectable()
export class RegisterService {
  constructor(
    @InjectRepository(DailyRegisterSession)
    private readonly sessionRepo: Repository<DailyRegisterSession>,
    @InjectRepository(Invoice)
    private readonly invoiceRepo: Repository<Invoice>,
    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,
  ) {}

  private getTenantId(): string {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) {
      throw new BadRequestException('Tenant context is required');
    }
    return tenantId;
  }

  async openSession(dto: OpenRegisterDto) {
    const tenantId = this.getTenantId();
    const existing = await this.sessionRepo.findOne({
      where: { userId: dto.userId, status: 'OPEN', tenantId },
      order: { openedAt: 'DESC' },
    });

    if (existing) {
      throw new BadRequestException(
        `An active register session is already open for user ID: ${dto.userId}`,
      );
    }

    const session = this.sessionRepo.create({
      tenantId,
      userId: dto.userId,
      openedAt: new Date(),
      openingCashBalance: dto.openingCashBalance,
      status: 'OPEN',
      notes: dto.notes,
    });

    const saved = await this.sessionRepo.save(session);
    return this.mapToDTO(saved);
  }

  async closeSession(sessionId: number, dto: CloseRegisterDto) {
    const tenantId = this.getTenantId();
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId, tenantId },
    });

    if (!session) {
      throw new NotFoundException(`Register session not found: ${sessionId}`);
    }

    if (session.status === 'CLOSED') {
      throw new BadRequestException('Register session is already closed.');
    }

    const startTime = session.openedAt;
    const endTime = new Date();

    // Fetch cash sales
    const invoices = await this.invoiceRepo.find({
      where: {
        tenantId,
        invoiceDate: Between(startTime, endTime),
      },
    });

    const cashSales = invoices
      .filter((inv) => (inv.paymentMethod || '').toUpperCase() === 'CASH')
      .reduce((sum, inv) => sum + (Number(inv.paidAmount) || 0), 0);

    // Fetch cash expenses
    const transactions = await this.transactionRepo.find({
      where: {
        tenantId,
        userId: session.userId,
        type: 'EXPENSE',
        transactionDate: Between(startTime, endTime),
      },
    });

    const cashExpenses = transactions.reduce(
      (sum, tx) => sum + (Number(tx.amount) || 0),
      0,
    );

    const opening = Number(session.openingCashBalance) || 0;
    const expectedCash = opening + cashSales - cashExpenses;
    const actualCash = Number(dto.actualCashBalance) || 0;
    const variance = actualCash - expectedCash;

    session.closedAt = endTime;
    session.expectedCashBalance = expectedCash;
    session.actualCashBalance = actualCash;
    session.cashDifference = variance;
    session.status = 'CLOSED';
    if (dto.notes) {
      session.notes = (session.notes ? session.notes + ' | ' : '') + dto.notes;
    }

    const saved = await this.sessionRepo.save(session);
    return this.mapToDTO(saved);
  }

  async getActiveSession(userId: number) {
    const tenantId = this.getTenantId();
    const session = await this.sessionRepo.findOne({
      where: { userId, status: 'OPEN', tenantId },
      order: { openedAt: 'DESC' },
    });

    return session ? this.mapToDTO(session) : null;
  }

  async getDailySummary(dateQuery?: Date, userId?: number) {
    const tenantId = this.getTenantId();
    const targetDate = dateQuery ? new Date(dateQuery) : new Date();

    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const sessionQb = this.sessionRepo.createQueryBuilder('s')
      .where('s.tenantId = :tenantId', { tenantId })
      .andWhere('s.openedAt BETWEEN :start AND :end', {
        start: startOfDay,
        end: endOfDay,
      });

    if (userId) {
      sessionQb.andWhere('s.userId = :userId', { userId });
    }

    sessionQb.orderBy('s.openedAt', 'DESC');
    const session = await sessionQb.getOne();

    const invoices = await this.invoiceRepo.find({
      where: {
        tenantId,
        invoiceDate: Between(startOfDay, endOfDay),
      },
    });

    let totalSales = 0;
    let cashSales = 0;
    let cardSales = 0;
    let transferSales = 0;
    let creditSales = 0;
    const salesByPaymentMethod: Record<string, number> = {};

    for (const inv of invoices) {
      const amt = Number(inv.paidAmount) || 0;
      totalSales += amt;
      const method = (inv.paymentMethod || 'CASH').toUpperCase();
      salesByPaymentMethod[method] = (salesByPaymentMethod[method] || 0) + amt;

      switch (method) {
        case 'CASH':
          cashSales += amt;
          break;
        case 'CARD':
          cardSales += amt;
          break;
        case 'TRANSFER':
          transferSales += amt;
          break;
        case 'CUSTOMER_CREDIT':
          creditSales += amt;
          break;
        default:
          cashSales += amt;
          break;
      }
    }

    const txWhere: any = {
      tenantId,
      type: 'EXPENSE',
      transactionDate: Between(startOfDay, endOfDay),
    };
    if (userId) txWhere.userId = userId;

    const expenses = await this.transactionRepo.find({ where: txWhere });
    const totalExpenses = expenses.reduce(
      (sum, tx) => sum + (Number(tx.amount) || 0),
      0,
    );
    const cashExpenses = totalExpenses; // Cash by default

    const openingFloat = session ? Number(session.openingCashBalance) || 0 : 0;
    const netCashInflow = cashSales - cashExpenses;
    const expectedCashInDrawer = openingFloat + netCashInflow;
    const actualCashInDrawer = session?.actualCashBalance
      ? Number(session.actualCashBalance)
      : expectedCashInDrawer;
    const cashVariance = session?.cashDifference
      ? Number(session.cashDifference)
      : 0;

    return {
      date: startOfDay,
      sessionId: session?.id || null,
      sessionStatus: session?.status || 'NO_SESSION',
      sessionOpenedAt: session?.openedAt || null,
      sessionClosedAt: session?.closedAt || null,
      openingCashFloat: openingFloat,
      totalSales,
      cashSales,
      cardSales,
      transferSales,
      creditSales,
      salesByPaymentMethod,
      totalInvoicesCount: invoices.length,
      totalExpenses,
      cashExpenses,
      netCashInflow,
      expectedCashInDrawer,
      actualCashInDrawer,
      cashVariance,
    };
  }

  private mapToDTO(session: DailyRegisterSession) {
    return {
      id: session.id,
      userId: session.userId,
      openedAt: session.openedAt,
      closedAt: session.closedAt,
      openingCashBalance: Number(session.openingCashBalance),
      expectedCashBalance:
        session.expectedCashBalance !== null
          ? Number(session.expectedCashBalance)
          : null,
      actualCashBalance:
        session.actualCashBalance !== null
          ? Number(session.actualCashBalance)
          : null,
      cashDifference:
        session.cashDifference !== null
          ? Number(session.cashDifference)
          : null,
      status: session.status,
      notes: session.notes,
    };
  }
}
