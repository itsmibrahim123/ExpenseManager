import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { DailyRegisterSession } from './entities/daily-register-session.entity';
import { RegisterMovement, RegisterMovementType } from './entities/register-movement.entity';
import { Invoice, InvoiceType } from '../invoices/entities/invoice.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { TenantContext } from '../../common/context/tenant-context';
import { OpenRegisterDto, CloseRegisterDto, CreateRegisterMovementDto } from './dto/register.dto';

@Injectable()
export class RegisterService {
  constructor(
    @InjectRepository(DailyRegisterSession)
    private readonly sessionRepo: Repository<DailyRegisterSession>,
    @InjectRepository(RegisterMovement)
    private readonly movementRepo: Repository<RegisterMovement>,
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

  async addMovement(dto: CreateRegisterMovementDto, userId: number) {
    const tenantId = this.getTenantId();
    const session = await this.sessionRepo.findOne({
      where: { id: dto.sessionId, tenantId },
    });

    if (!session) {
      throw new NotFoundException(`Register session #${dto.sessionId} not found`);
    }

    if (session.status !== 'OPEN') {
      throw new BadRequestException('Cannot add cash movements to a closed session');
    }

    if (dto.amount <= 0) {
      throw new BadRequestException('Amount must be greater than zero');
    }

    const movement = this.movementRepo.create({
      tenantId,
      sessionId: session.id,
      movementType: dto.movementType,
      amount: dto.amount,
      reason: dto.reason || '',
      userId: dto.userId || userId,
    });

    return this.movementRepo.save(movement);
  }

  async getMovements(sessionId: number): Promise<RegisterMovement[]> {
    const tenantId = this.getTenantId();
    return this.movementRepo.find({
      where: { sessionId, tenantId },
      order: { createdAt: 'DESC' },
    });
  }

  async closeSession(sessionId: number, dto: CloseRegisterDto) {
    const tenantId = this.getTenantId();
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId, tenantId },
      relations: ['movements'],
    });

    if (!session) {
      throw new NotFoundException(`Register session not found: ${sessionId}`);
    }

    if (session.status === 'CLOSED') {
      throw new BadRequestException('Register session is already closed.');
    }

    const startTime = session.openedAt;
    const endTime = new Date();

    // Fetch cash sales and returns in interval
    const invoices = await this.invoiceRepo.find({
      where: {
        tenantId,
        invoiceDate: Between(startTime, endTime),
      },
    });

    const cashSales = invoices
      .filter(
        (inv) =>
          (inv.paymentMethod || '').toUpperCase() === 'CASH' &&
          inv.invoiceType !== InvoiceType.RETURN,
      )
      .reduce((sum, inv) => sum + (Number(inv.paidAmount) || 0), 0);

    const cashRefunds = invoices
      .filter(
        (inv) =>
          (inv.paymentMethod || '').toUpperCase() === 'CASH' &&
          inv.invoiceType === InvoiceType.RETURN,
      )
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

    // Drawer Movements for this session
    const movements = await this.movementRepo.find({
      where: { sessionId: session.id, tenantId },
    });

    let payIns = 0;
    let payOuts = 0;
    let cashDrops = 0;

    for (const m of movements) {
      const amt = Number(m.amount) || 0;
      if (m.movementType === RegisterMovementType.PAY_IN) payIns += amt;
      else if (m.movementType === RegisterMovementType.PAY_OUT) payOuts += amt;
      else if (m.movementType === RegisterMovementType.CASH_DROP) cashDrops += amt;
    }

    const opening = Number(session.openingCashBalance) || 0;
    const expectedCash =
      opening + cashSales - cashRefunds - cashExpenses + payIns - payOuts - cashDrops;
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

  async getActiveSession(userId?: number) {
    const tenantId = this.getTenantId();
    const where: any = { status: 'OPEN', tenantId };
    if (userId && !isNaN(userId)) {
      where.userId = userId;
    }
    const session = await this.sessionRepo.findOne({
      where,
      relations: ['movements'],
      order: { openedAt: 'DESC' },
    });

    return session ? this.mapToDTO(session) : null;
  }

  async getHistory(startDate?: Date, endDate?: Date, userId?: number): Promise<any[]> {
    const tenantId = this.getTenantId();
    const qb = this.sessionRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.movements', 'm')
      .where('s.tenantId = :tenantId', { tenantId });

    if (startDate && endDate) {
      qb.andWhere('s.openedAt BETWEEN :start AND :end', {
        start: startDate,
        end: endDate,
      });
    }

    if (userId) {
      qb.andWhere('s.userId = :userId', { userId });
    }

    qb.orderBy('s.openedAt', 'DESC');
    const sessions = await qb.getMany();
    return sessions.map((s) => this.mapToDTO(s));
  }

  async getDailySummary(dateQuery?: Date, userId?: number) {
    const tenantId = this.getTenantId();
    const targetDate = dateQuery ? new Date(dateQuery) : new Date();

    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const sessionQb = this.sessionRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.movements', 'm')
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
      relations: ['items'],
    });

    let grossSales = 0;
    let returnsTotal = 0;
    let cashSales = 0;
    let cardSales = 0;
    let transferSales = 0;
    let creditSales = 0;
    const salesByPaymentMethod: Record<string, number> = {};
    const itemSalesCount: Record<string, { name: string; quantity: number; revenue: number }> = {};

    for (const inv of invoices) {
      const amt = Number(inv.paidAmount) || 0;
      const method = (inv.paymentMethod || 'CASH').toUpperCase();

      if (inv.invoiceType === InvoiceType.RETURN) {
        returnsTotal += amt;
      } else {
        grossSales += amt;
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

        // Aggregate items
        for (const itm of inv.items || []) {
          const key = itm.productId ? String(itm.productId) : itm.productName;
          if (!itemSalesCount[key]) {
            itemSalesCount[key] = {
              name: itm.productName,
              quantity: 0,
              revenue: 0,
            };
          }
          itemSalesCount[key].quantity += itm.quantity;
          itemSalesCount[key].revenue += Number(itm.lineTotal) || 0;
        }
      }
    }

    const netSales = grossSales - returnsTotal;

    const txWhere: any = {
      tenantId,
      type: 'EXPENSE',
      transactionDate: Between(startOfDay, endOfDay),
    };
    if (userId) txWhere.userId = userId;

    const expenses = await this.transactionRepo.find({ where: txWhere });
    const totalExpenses = expenses.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
    const cashExpenses = totalExpenses;

    // Mid-day Drawer Movements
    let payIns = 0;
    let payOuts = 0;
    let cashDrops = 0;

    if (session && session.movements) {
      for (const m of session.movements) {
        const amt = Number(m.amount) || 0;
        if (m.movementType === RegisterMovementType.PAY_IN) payIns += amt;
        else if (m.movementType === RegisterMovementType.PAY_OUT) payOuts += amt;
        else if (m.movementType === RegisterMovementType.CASH_DROP) cashDrops += amt;
      }
    }

    const openingFloat = session ? Number(session.openingCashBalance) || 0 : 0;
    const netCashInflow = cashSales - returnsTotal - cashExpenses + payIns - payOuts - cashDrops;
    const expectedCashInDrawer = openingFloat + netCashInflow;
    const actualCashInDrawer = session?.actualCashBalance
      ? Number(session.actualCashBalance)
      : expectedCashInDrawer;
    const cashVariance = session?.cashDifference ? Number(session.cashDifference) : 0;

    const topSellingItems = Object.values(itemSalesCount)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // Approximate Gross Profit = Net Sales - (Rough 65% COGS or specific item margins)
    const grossProfit = Math.max(0, netSales - totalExpenses);

    return {
      date: startOfDay,
      sessionId: session?.id || null,
      sessionStatus: session?.status || 'NO_SESSION',
      sessionOpenedAt: session?.openedAt || null,
      sessionClosedAt: session?.closedAt || null,
      openingCashFloat: openingFloat,
      grossSales,
      returnsTotal,
      netSales,
      grossProfit,
      totalSales: netSales,
      cashSales,
      cardSales,
      transferSales,
      creditSales,
      payIns,
      payOuts,
      cashDrops,
      salesByPaymentMethod,
      totalInvoicesCount: invoices.length,
      totalExpenses,
      cashExpenses,
      netCashInflow,
      expectedCashInDrawer,
      actualCashInDrawer,
      cashVariance,
      topSellingItems,
      movements: session?.movements || [],
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
      movements: (session.movements || []).map((m) => ({
        id: m.id,
        sessionId: m.sessionId,
        movementType: m.movementType,
        amount: Number(m.amount),
        reason: m.reason,
        userId: m.userId,
        createdAt: m.createdAt,
      })),
    };
  }
}
