import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Invoice, InvoiceType } from './entities/invoice.entity';
import { InvoiceItem } from './entities/invoice-item.entity';
import { InvoicePayment } from './entities/invoice-payment.entity';
import { Product } from '../products/entities/product.entity';
import { ProductSerial, SerialStatus } from '../products/entities/product-serial.entity';
import { StockMovement } from '../stock/entities/stock-movement.entity';
import { Customer } from '../customers/entities/customer.entity';
import { Account } from '../accounts/entities/account.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { TenantSettings } from '../tenant/entities/tenant-settings.entity';
import { TenantContext } from '../../common/context/tenant-context';
import { CreateInvoiceDto, RecordPaymentDto } from './dto/invoice.dto';

const PDFDocument = require('pdfkit');

@Injectable()
export class InvoicesService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Invoice)
    private readonly invoiceRepo: Repository<Invoice>,
    @InjectRepository(InvoicePayment)
    private readonly paymentRepo: Repository<InvoicePayment>,
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
    @InjectRepository(TenantSettings)
    private readonly settingsRepo: Repository<TenantSettings>,
    @InjectRepository(ProductSerial)
    private readonly serialRepo: Repository<ProductSerial>,
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

    const invoiceType = dto.invoiceType || InvoiceType.SALE;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const now = new Date();
      const timeStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
      const randomSuffix = Math.floor(100 + Math.random() * 900);

      let prefix = 'INV';
      if (invoiceType === InvoiceType.RETURN) prefix = 'RET';
      else if (invoiceType === InvoiceType.PURCHASE) prefix = 'PUR';

      const invoiceNum = `${prefix}-${timeStr}-${randomSuffix}`;

      let subtotal = 0;
      let taxTotal = 0;
      const itemsToSave: any[] = [];
      const serialUpdates: { serials: string[]; itemIdx: number; productId: number }[] = [];

      for (let i = 0; i < dto.items.length; i++) {
        const itemReq = dto.items[i];
        const product = await queryRunner.manager.findOne(Product, {
          where: { id: itemReq.productId, tenantId },
        });

        if (!product) {
          throw new NotFoundException(`Product not found with id: ${itemReq.productId}`);
        }

        const unitPrice =
          itemReq.unitPrice !== undefined
            ? Number(itemReq.unitPrice)
            : invoiceType === InvoiceType.PURCHASE
            ? Number(product.costPrice)
            : Number(product.sellingPrice);

        const itemSubtotal = unitPrice * itemReq.quantity;
        const taxRate = itemReq.taxRate !== undefined ? Number(itemReq.taxRate) : 0;
        const itemTax = (itemSubtotal * taxRate) / 100;
        const discountAmount =
          itemReq.discountAmount !== undefined ? Number(itemReq.discountAmount) : 0;
        const lineTotal = itemSubtotal + itemTax - discountAmount;

        subtotal += itemSubtotal;
        taxTotal += itemTax;

        // Inventory Stock Adjustments based on InvoiceType
        if (invoiceType === InvoiceType.SALE) {
          if (product.currentStock < itemReq.quantity && !allowNegativeStock) {
            throw new BadRequestException(
              `Insufficient stock for product '${product.name}'. Available: ${product.currentStock}, Requested: ${itemReq.quantity}`,
            );
          }

          const newStock = product.currentStock - itemReq.quantity;
          product.currentStock = newStock;
          await queryRunner.manager.save(product);

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
        } else if (invoiceType === InvoiceType.RETURN) {
          // Restore stock on Return
          const newStock = product.currentStock + itemReq.quantity;
          product.currentStock = newStock;
          await queryRunner.manager.save(product);

          const movement = queryRunner.manager.create(StockMovement, {
            tenantId,
            productId: product.id,
            movementType: 'RETURN_RESTOCK',
            quantityChanged: itemReq.quantity,
            balanceAfter: newStock,
            referenceId: invoiceNum,
            notes: `Customer Return Restock for ${invoiceNum}${dto.parentInvoiceId ? ` (Original: ${dto.parentInvoiceId})` : ''}`,
          });
          await queryRunner.manager.save(movement);
        } else if (invoiceType === InvoiceType.PURCHASE) {
          // Add stock on Purchase
          const newStock = product.currentStock + itemReq.quantity;
          product.currentStock = newStock;
          await queryRunner.manager.save(product);

          const movement = queryRunner.manager.create(StockMovement, {
            tenantId,
            productId: product.id,
            movementType: 'PURCHASE_RESTOCK',
            quantityChanged: itemReq.quantity,
            balanceAfter: newStock,
            referenceId: invoiceNum,
            notes: `Inventory Purchase Restock for Invoice ${invoiceNum}`,
          });
          await queryRunner.manager.save(movement);
        }

        if (itemReq.serialNumbers && itemReq.serialNumbers.length > 0) {
          serialUpdates.push({
            serials: itemReq.serialNumbers,
            itemIdx: i,
            productId: product.id,
          });
        }

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
        invoiceType,
        parentInvoiceId: dto.parentInvoiceId || null,
        supplierId: dto.supplierId || null,
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

      // Save Invoice Items
      const savedItems: InvoiceItem[] = [];
      for (const itemData of itemsToSave) {
        const item = queryRunner.manager.create(InvoiceItem, {
          ...itemData,
          invoiceId: savedInvoice.id,
        });
        const savedItem = await queryRunner.manager.save(item);
        savedItems.push(savedItem);
      }

      // Handle Serials
      for (const su of serialUpdates) {
        const correspondingItem = savedItems[su.itemIdx];
        for (const sn of su.serials) {
          let serial = await queryRunner.manager.findOne(ProductSerial, {
            where: { tenantId, productId: su.productId, serialNumber: sn },
          });

          if (invoiceType === InvoiceType.SALE) {
            if (!serial) {
              serial = queryRunner.manager.create(ProductSerial, {
                tenantId,
                productId: su.productId,
                serialNumber: sn,
                status: SerialStatus.SOLD,
                invoiceItemId: correspondingItem?.id || null,
                notes: `Sold on invoice ${invoiceNum}`,
              });
            } else {
              serial.status = SerialStatus.SOLD;
              serial.invoiceItemId = correspondingItem?.id || null;
              serial.notes = `Sold on invoice ${invoiceNum}`;
            }
            await queryRunner.manager.save(serial);
          } else if (invoiceType === InvoiceType.RETURN) {
            if (serial) {
              serial.status = SerialStatus.RETURNED;
              serial.notes = `Returned via invoice ${invoiceNum}`;
              await queryRunner.manager.save(serial);
            }
          } else if (invoiceType === InvoiceType.PURCHASE) {
            if (!serial) {
              serial = queryRunner.manager.create(ProductSerial, {
                tenantId,
                productId: su.productId,
                serialNumber: sn,
                status: SerialStatus.IN_STOCK,
                notes: `Received via purchase invoice ${invoiceNum}`,
              });
            } else {
              serial.status = SerialStatus.IN_STOCK;
            }
            await queryRunner.manager.save(serial);
          }
        }
      }

      // Initial Payment Record
      if (paidAmount > 0) {
        const payment = queryRunner.manager.create(InvoicePayment, {
          tenantId,
          invoiceId: savedInvoice.id,
          amount: paidAmount,
          paymentMethod: dto.paymentMethod || 'CASH',
          paymentDate: new Date(),
          referenceNotes: `Initial checkout payment for ${invoiceNum}`,
          accountId: dto.accountId || null,
          recordedByUserId: dto.userId,
        });
        await queryRunner.manager.save(payment);
      }

      // Ledger Accounting Integration
      let targetAccountId = dto.accountId;
      if (!targetAccountId) {
        const defaultAccount = await queryRunner.manager.findOne(Account, {
          where: { tenantId, archived: false },
        });
        if (defaultAccount) targetAccountId = defaultAccount.id;
      }

      if (targetAccountId && paidAmount > 0) {
        const account = await queryRunner.manager.findOne(Account, {
          where: { id: targetAccountId, tenantId },
        });

        if (account) {
          if (invoiceType === InvoiceType.SALE) {
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
          } else if (invoiceType === InvoiceType.RETURN) {
            // Customer refund expense
            const refundTx = queryRunner.manager.create(Transaction, {
              tenantId,
              userId: dto.userId,
              accountId: account.id,
              categoryId: dto.categoryId || 1,
              type: 'EXPENSE',
              amount: paidAmount,
              currencyCode: account.currencyCode || 'PKR',
              transactionDate: new Date(),
              status: 'COMPLETED',
              description: `Customer Return Refund (${dto.paymentMethod}): ${invoiceNum}`,
              referenceNumber: invoiceNum,
              recurringInstance: false,
            });
            await queryRunner.manager.save(refundTx);
            account.currentBalance = Number(account.currentBalance || 0) - paidAmount;
            await queryRunner.manager.save(account);
          } else if (invoiceType === InvoiceType.PURCHASE) {
            // Supplier inventory purchase expense
            const purchaseTx = queryRunner.manager.create(Transaction, {
              tenantId,
              userId: dto.userId,
              accountId: account.id,
              categoryId: dto.categoryId || 1,
              type: 'EXPENSE',
              amount: paidAmount,
              currencyCode: account.currencyCode || 'PKR',
              transactionDate: new Date(),
              status: 'COMPLETED',
              description: `Inventory Purchase Payment (${dto.paymentMethod}): ${invoiceNum}`,
              referenceNumber: invoiceNum,
              recurringInstance: false,
            });
            await queryRunner.manager.save(purchaseTx);
            account.currentBalance = Number(account.currentBalance || 0) - paidAmount;
            await queryRunner.manager.save(account);
          }
        }
      }

      // Customer credit update if balance due on Sale
      if (dto.customerId && invoiceType === InvoiceType.SALE && balanceDue > 0) {
        const customer = await queryRunner.manager.findOne(Customer, {
          where: { id: dto.customerId, tenantId },
        });
        if (customer) {
          customer.currentCreditBalance =
            Number(customer.currentCreditBalance || 0) + balanceDue;
          await queryRunner.manager.save(customer);
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

  async recordPayment(invoiceId: number, dto: RecordPaymentDto, userId: number) {
    const tenantId = this.getTenantId();
    const invoice = await this.invoiceRepo.findOne({
      where: { id: invoiceId, tenantId },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice #${invoiceId} not found`);
    }

    if (invoice.balanceDue <= 0) {
      throw new BadRequestException('This invoice is already fully paid');
    }

    if (dto.amount <= 0) {
      throw new BadRequestException('Payment amount must be greater than zero');
    }

    const payAmount = Math.min(dto.amount, invoice.balanceDue);
    const newPaidAmount = Number(invoice.paidAmount) + payAmount;
    const newBalanceDue = Math.max(0, Number(invoice.grandTotal) - newPaidAmount);

    let paymentStatus = 'PAID';
    if (newBalanceDue > 0) {
      paymentStatus = 'PARTIALLY_PAID';
    }

    const payment = this.paymentRepo.create({
      tenantId,
      invoiceId: invoice.id,
      amount: payAmount,
      paymentMethod: dto.paymentMethod,
      paymentDate: dto.paymentDate ? new Date(dto.paymentDate) : new Date(),
      referenceNotes: dto.referenceNotes || `Installment payment for ${invoice.invoiceNumber}`,
      accountId: dto.accountId || invoice.accountId || null,
      recordedByUserId: userId,
    });
    await this.paymentRepo.save(payment);

    invoice.paidAmount = newPaidAmount;
    invoice.balanceDue = newBalanceDue;
    invoice.paymentStatus = paymentStatus;
    await this.invoiceRepo.save(invoice);

    // Ledger update
    const accountId = dto.accountId || invoice.accountId;
    if (accountId) {
      const account = await this.dataSource.manager.findOne(Account, {
        where: { id: accountId, tenantId },
      });
      if (account) {
        const txType = invoice.invoiceType === InvoiceType.PURCHASE ? 'EXPENSE' : 'INCOME';
        const tx = this.dataSource.manager.create(Transaction, {
          tenantId,
          userId,
          accountId: account.id,
          categoryId: 1,
          type: txType,
          amount: payAmount,
          currencyCode: account.currencyCode || 'PKR',
          transactionDate: new Date(),
          status: 'COMPLETED',
          description: `Post-checkout payment for ${invoice.invoiceNumber}`,
          referenceNumber: invoice.invoiceNumber,
          recurringInstance: false,
        });
        await this.dataSource.manager.save(tx);

        if (txType === 'INCOME') {
          account.currentBalance = Number(account.currentBalance || 0) + payAmount;
        } else {
          account.currentBalance = Number(account.currentBalance || 0) - payAmount;
        }
        await this.dataSource.manager.save(account);
      }
    }

    // Customer credit decrease if sale
    if (invoice.customerId && invoice.invoiceType === InvoiceType.SALE) {
      const customer = await this.customerRepo.findOne({
        where: { id: invoice.customerId, tenantId },
      });
      if (customer) {
        customer.currentCreditBalance = Math.max(
          0,
          Number(customer.currentCreditBalance || 0) - payAmount,
        );
        await this.customerRepo.save(customer);
      }
    }

    return this.getInvoiceById(invoice.id);
  }

  async getAllInvoices(
    status?: string,
    type?: InvoiceType,
    startDate?: Date,
    endDate?: Date,
  ): Promise<any[]> {
    const tenantId = this.getTenantId();
    const qb = this.invoiceRepo
      .createQueryBuilder('inv')
      .leftJoinAndSelect('inv.customer', 'c')
      .leftJoinAndSelect('inv.items', 'items')
      .leftJoinAndSelect('inv.payments', 'payments')
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

    if (type) {
      qb.andWhere('inv.invoiceType = :type', { type });
    }

    qb.orderBy('inv.invoiceDate', 'DESC');
    const invoices = await qb.getMany();
    return invoices.map((inv) => this.mapToDTO(inv));
  }

  async getInvoiceById(id: number): Promise<any> {
    const tenantId = this.getTenantId();
    const invoice = await this.invoiceRepo.findOne({
      where: { id, tenantId },
      relations: ['customer', 'items', 'payments'],
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
      relations: ['customer', 'items', 'payments'],
    });
    if (!invoice) {
      throw new NotFoundException(`Invoice not found with number: ${invoiceNumber}`);
    }
    return this.mapToDTO(invoice);
  }

  async generateInvoicePdf(id: number): Promise<Buffer> {
    const invoice = await this.getInvoiceById(id);
    const tenantId = this.getTenantId();
    const settings = await this.settingsRepo.findOne({ where: { tenantId } });

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 40, size: 'A4' });
        const buffers: Buffer[] = [];

        doc.on('data', (data: Buffer) => buffers.push(data));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', (err: any) => reject(err));

        // Header
        const storeTitle = settings?.receiptHeader?.split('\n')[0] || 'ExpenseManager ERP Store';
        doc.fontSize(20).font('Helvetica-Bold').text(storeTitle, { align: 'left' });
        doc.fontSize(10).font('Helvetica').fillColor('#555555');
        if (settings?.taxNumber) doc.text(`Tax ID: ${settings.taxNumber}`);
        doc.text(`Generated: ${new Date().toLocaleString()}`);
        doc.moveDown(1);

        // Divider
        doc.strokeColor('#e0e0e0').lineWidth(1).moveTo(40, doc.y).lineTo(555, doc.y).stroke();
        doc.moveDown(1);

        // Invoice Meta Block
        const yTop = doc.y;
        doc.fontSize(14).font('Helvetica-Bold').fillColor('#111111').text(`INVOICE: ${invoice.invoiceNumber}`);
        doc.fontSize(10).font('Helvetica').fillColor('#333333');
        doc.text(`Type: ${invoice.invoiceType} | Status: ${invoice.paymentStatus}`);
        doc.text(`Date: ${new Date(invoice.invoiceDate).toLocaleDateString()}`);
        doc.text(`Payment Method: ${invoice.paymentMethod}`);

        // Customer Column
        doc.y = yTop;
        doc.fontSize(11).font('Helvetica-Bold').fillColor('#111111').text('BILL TO:', 340, doc.y);
        doc.fontSize(10).font('Helvetica').fillColor('#333333');
        doc.text(invoice.customerName, 340, doc.y);
        if (invoice.customerPhone) doc.text(`Phone: ${invoice.customerPhone}`, 340, doc.y);
        doc.moveDown(2);

        // Items Table Header
        const tableY = Math.max(doc.y, yTop + 60);
        doc.fillColor('#f8f9fa').rect(40, tableY, 515, 22).fill();
        doc.fillColor('#111111').font('Helvetica-Bold').fontSize(9);
        doc.text('ITEM DESCRIPTION', 45, tableY + 6);
        doc.text('QTY', 290, tableY + 6, { width: 40, align: 'right' });
        doc.text('PRICE', 340, tableY + 6, { width: 60, align: 'right' });
        doc.text('TAX', 410, tableY + 6, { width: 45, align: 'right' });
        doc.text('TOTAL', 470, tableY + 6, { width: 80, align: 'right' });

        let currentY = tableY + 25;
        doc.font('Helvetica').fontSize(9);

        for (const item of invoice.items) {
          doc.fillColor('#333333').text(item.productName, 45, currentY);
          doc.text(String(item.quantity), 290, currentY, { width: 40, align: 'right' });
          doc.text(Number(item.unitPrice).toFixed(2), 340, currentY, { width: 60, align: 'right' });
          doc.text(`${item.taxRate}%`, 410, currentY, { width: 45, align: 'right' });
          doc.text(Number(item.lineTotal).toFixed(2), 470, currentY, { width: 80, align: 'right' });
          currentY += 18;
        }

        doc.strokeColor('#e0e0e0').lineWidth(0.5).moveTo(40, currentY + 5).lineTo(555, currentY + 5).stroke();
        currentY += 15;

        // Totals Box
        const totalX = 350;
        doc.fontSize(10).font('Helvetica').fillColor('#444444');
        doc.text('Subtotal:', totalX, currentY);
        doc.text(Number(invoice.subtotal).toFixed(2), 470, currentY, { width: 80, align: 'right' });
        currentY += 16;

        if (invoice.taxTotal > 0) {
          doc.text('Tax Total:', totalX, currentY);
          doc.text(Number(invoice.taxTotal).toFixed(2), 470, currentY, { width: 80, align: 'right' });
          currentY += 16;
        }

        if (invoice.discountTotal > 0) {
          doc.text('Discount:', totalX, currentY);
          doc.text(`-${Number(invoice.discountTotal).toFixed(2)}`, 470, currentY, { width: 80, align: 'right' });
          currentY += 16;
        }

        doc.font('Helvetica-Bold').fontSize(12).fillColor('#111111');
        doc.text('Grand Total:', totalX, currentY);
        doc.text(Number(invoice.grandTotal).toFixed(2), 470, currentY, { width: 80, align: 'right' });
        currentY += 18;

        doc.font('Helvetica').fontSize(10).fillColor('#2e7d32');
        doc.text('Paid Amount:', totalX, currentY);
        doc.text(Number(invoice.paidAmount).toFixed(2), 470, currentY, { width: 80, align: 'right' });
        currentY += 16;

        if (invoice.balanceDue > 0) {
          doc.font('Helvetica-Bold').fontSize(10).fillColor('#d32f2f');
          doc.text('Balance Due:', totalX, currentY);
          doc.text(Number(invoice.balanceDue).toFixed(2), 470, currentY, { width: 80, align: 'right' });
          currentY += 20;
        }

        // Footer
        doc.fontSize(9).font('Helvetica-Oblique').fillColor('#777777');
        const footerText = settings?.receiptFooter || 'Thank you for your business!';
        doc.text(footerText, 40, Math.max(currentY + 30, 720), { align: 'center', width: 515 });

        doc.end();
      } catch (e) {
        reject(e);
      }
    });
  }

  private mapToDTO(invoice: Invoice) {
    return {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      invoiceType: invoice.invoiceType,
      parentInvoiceId: invoice.parentInvoiceId,
      supplierId: invoice.supplierId,
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
      payments: (invoice.payments || []).map((p) => ({
        id: p.id,
        invoiceId: p.invoiceId,
        amount: Number(p.amount),
        paymentMethod: p.paymentMethod,
        paymentDate: p.paymentDate,
        referenceNotes: p.referenceNotes,
        accountId: p.accountId,
        recordedByUserId: p.recordedByUserId,
      })),
    };
  }
}
