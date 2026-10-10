import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DataSource, Repository, Between } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Invoice } from './entities/invoice.entity';
import { InvoiceItem } from './entities/invoice-item.entity';
import { Product } from '../products/entities/product.entity';
import { StockMovement } from '../stock/entities/stock-movement.entity';
import { Customer } from '../customers/entities/customer.entity';
import { Account } from '../accounts/entities/account.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { TenantSettings } from '../tenant/entities/tenant-settings.entity';
import { TenantContext } from '../../common/context/tenant-context';
import { CreateInvoiceDto } from './dto/invoice.dto';

@Injectable()
export class InvoicesService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Invoice)
    private readonly invoiceRepo: Repository<Invoice>,
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
    @InjectRepository(TenantSettings)
    private readonly settingsRepo: Repository<TenantSettings>,
  ) {}

  private getTenantId(): string {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) {
      throw new BadRequestException('Tenant context is required');
    }
    return tenantId;
  }

  async createInvoice(dto: CreateInvoiceDto) {
    const tenantId = this.getTenantId();
    const settings = await this.settingsRepo.findOne({ where: { tenantId } });
    const allowNegativeStock = settings?.allowNegativeStock || false;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const now = new Date();
      const timeStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
      const randomSuffix = Math.floor(100 + Math.random() * 900);
      const invoiceNum = `INV-${timeStr}-${randomSuffix}`;

      let subtotal = 0;
      let taxTotal = 0;
      const itemsToSave: any[] = [];

      for (const itemReq of dto.items) {
        const product = await queryRunner.manager.findOne(Product, {
          where: { id: itemReq.productId, tenantId },
        });

        if (!product) {
          throw new NotFoundException(`Product not found with id: ${itemReq.productId}`);
        }

        if (product.currentStock < itemReq.quantity && !allowNegativeStock) {
          throw new BadRequestException(
            `Insufficient stock for product '${product.name}'. Available: ${product.currentStock}, Requested: ${itemReq.quantity}`,
          );
        }

        const unitPrice =
          itemReq.unitPrice !== undefined ? Number(itemReq.unitPrice) : Number(product.sellingPrice);
        const itemSubtotal = unitPrice * itemReq.quantity;
        const taxRate = itemReq.taxRate !== undefined ? Number(itemReq.taxRate) : 0;
        const itemTax = (itemSubtotal * taxRate) / 100;
        const discountAmount =
          itemReq.discountAmount !== undefined ? Number(itemReq.discountAmount) : 0;
        const lineTotal = itemSubtotal + itemTax - discountAmount;

        subtotal += itemSubtotal;
        taxTotal += itemTax;

        // Deduct stock
        const newStock = product.currentStock - itemReq.quantity;
        product.currentStock = newStock;
        await queryRunner.manager.save(product);

        // Record stock movement
        const movement = queryRunner.manager.create(StockMovement, {
          tenantId,
          productId: product.id,
          movementType: 'SALE_DEDUCT',
          quantityChanged: -itemReq.quantity,
          balanceAfter: newStock,
          referenceId: invoiceNum,
          notes: `POS Checkout Deduction for Invoice ${invoiceNum}`,
        });
        await queryRunner.manager.save(movement);

        itemsToSave.push({
          tenantId,
          productId: product.id,
          productName: product.name,
          unitPrice,
          quantity: itemReq.quantity,
          taxRate,
          discountAmount,
          lineTotal,
        });
      }

      const globalDiscount = dto.discountTotal !== undefined ? Number(dto.discountTotal) : 0;
      const grandTotal = Math.max(0, subtotal + taxTotal - globalDiscount);
      const paidAmount = dto.paidAmount !== undefined ? Number(dto.paidAmount) : grandTotal;
      const balanceDue = Math.max(0, grandTotal - paidAmount);

      let paymentStatus = 'PAID';
      if (paidAmount === 0 && grandTotal > 0) {
        paymentStatus = 'UNPAID';
      } else if (balanceDue > 0) {
        paymentStatus = 'PARTIALLY_PAID';
      }

      const invoice = queryRunner.manager.create(Invoice, {
        tenantId,
        invoiceNumber: invoiceNum,
        customerId: dto.customerId || null,
        userId: dto.userId,
        invoiceDate: new Date(),
        subtotal,
        taxTotal,
        discountTotal: globalDiscount,
        grandTotal,
        paidAmount,
        balanceDue,
        paymentStatus,
        paymentMethod: dto.paymentMethod || 'CASH',
        accountId: dto.accountId || null,
      });

      const savedInvoice = await queryRunner.manager.save(invoice);

      for (const itemData of itemsToSave) {
        const item = queryRunner.manager.create(InvoiceItem, {
          ...itemData,
          invoiceId: savedInvoice.id,
        });
        await queryRunner.manager.save(item);
      }

      // Customer credit update if balance due
      if (dto.customerId && balanceDue > 0) {
        const customer = await queryRunner.manager.findOne(Customer, {
          where: { id: dto.customerId, tenantId },
        });
        if (customer) {
          customer.currentCreditBalance =
            Number(customer.currentCreditBalance || 0) + balanceDue;
          await queryRunner.manager.save(customer);
        }
      }

      // Ledger Entry: Income Transaction for paidAmount
      if (paidAmount > 0) {
        let targetAccountId = dto.accountId;
        if (!targetAccountId) {
          const defaultAccount = await queryRunner.manager.findOne(Account, {
            where: { tenantId, archived: false },
          });
          if (defaultAccount) {
            targetAccountId = defaultAccount.id;
          }
        }

        if (targetAccountId) {
          const account = await queryRunner.manager.findOne(Account, {
            where: { id: targetAccountId, tenantId },
          });
          if (account) {
            const incomeTx = queryRunner.manager.create(Transaction, {
              tenantId,
              userId: dto.userId,
              accountId: account.id,
              categoryId: dto.categoryId || 1,
              type: 'INCOME',
              amount: paidAmount,
              currencyCode: account.currencyCode || 'PKR',
              transactionDate: new Date(),
              status: 'COMPLETED',
              description: `POS Invoice Income (${dto.paymentMethod}): ${invoiceNum}`,
              referenceNumber: invoiceNum,
              recurringInstance: false,
            });
            await queryRunner.manager.save(incomeTx);

            account.currentBalance = Number(account.currentBalance || 0) + paidAmount;
            await queryRunner.manager.save(account);
          }
        }
      }

      await queryRunner.commitTransaction();

      return this.getInvoiceById(savedInvoice.id);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async getAllInvoices(status?: string, startDate?: Date, endDate?: Date): Promise<any[]> {
    const tenantId = this.getTenantId();
    const qb = this.invoiceRepo.createQueryBuilder('inv')
      .leftJoinAndSelect('inv.customer', 'c')
      .leftJoinAndSelect('inv.items', 'items')
      .where('inv.tenantId = :tenantId', { tenantId });

    if (startDate && endDate) {
      qb.andWhere('inv.invoiceDate BETWEEN :start AND :end', {
        start: startDate,
        end: endDate,
      });
    }

    if (status) {
      qb.andWhere('inv.paymentStatus = :status', { status });
    }

    qb.orderBy('inv.invoiceDate', 'DESC');
    const invoices = await qb.getMany();
    return invoices.map((inv) => this.mapToDTO(inv));
  }

  async getInvoiceById(id: number): Promise<any> {
    const tenantId = this.getTenantId();
    const invoice = await this.invoiceRepo.findOne({
      where: { id, tenantId },
      relations: ['customer', 'items'],
    });
    if (!invoice) {
      throw new NotFoundException(`Invoice not found with id: ${id}`);
    }
    return this.mapToDTO(invoice);
  }

  async getInvoiceByNumber(invoiceNumber: string): Promise<any> {
    const tenantId = this.getTenantId();
    const invoice = await this.invoiceRepo.findOne({
      where: { invoiceNumber, tenantId },
      relations: ['customer', 'items'],
    });
    if (!invoice) {
      throw new NotFoundException(`Invoice not found with number: ${invoiceNumber}`);
    }
    return this.mapToDTO(invoice);
  }

  private mapToDTO(invoice: Invoice) {
    return {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      customerId: invoice.customerId,
      customerName: invoice.customer?.name || 'Walk-in Customer',
      customerPhone: invoice.customer?.phone || null,
      userId: invoice.userId,
      invoiceDate: invoice.invoiceDate,
      subtotal: Number(invoice.subtotal),
      taxTotal: Number(invoice.taxTotal),
      discountTotal: Number(invoice.discountTotal),
      grandTotal: Number(invoice.grandTotal),
      paidAmount: Number(invoice.paidAmount),
      balanceDue: Number(invoice.balanceDue),
      paymentStatus: invoice.paymentStatus,
      paymentMethod: invoice.paymentMethod,
      accountId: invoice.accountId,
      createdAt: invoice.createdAt,
      items: (invoice.items || []).map((item) => ({
        id: item.id,
        invoiceId: item.invoiceId,
        productId: item.productId,
        productName: item.productName,
        unitPrice: Number(item.unitPrice),
        quantity: item.quantity,
        taxRate: Number(item.taxRate),
        discountAmount: Number(item.discountAmount),
        lineTotal: Number(item.lineTotal),
      })),
    };
  }
}
