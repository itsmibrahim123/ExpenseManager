import { Entity, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';
import { InvoiceItem } from './invoice-item.entity';
import { Customer } from '../../customers/entities/customer.entity';

@Entity('invoices')
export class Invoice extends BaseTenantEntity {
  @Column({ name: 'invoice_number', nullable: false })
  invoiceNumber: string;

  @Column({ name: 'customer_id', nullable: true })
  customerId: number;

  @ManyToOne(() => Customer, { eager: true, nullable: true })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column({ name: 'user_id', nullable: false })
  userId: number;

  @Column({ name: 'invoice_date', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  invoiceDate: Date;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: {
      to: (value: number) => value,
      from: (value: string | number) => (value ? parseFloat(value.toString()) : 0),
    },
  })
  subtotal: number;

  @Column({
    name: 'tax_total',
    type: 'numeric',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: {
      to: (value: number) => value,
      from: (value: string | number) => (value ? parseFloat(value.toString()) : 0),
    },
  })
  taxTotal: number;

  @Column({
    name: 'discount_total',
    type: 'numeric',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: {
      to: (value: number) => value,
      from: (value: string | number) => (value ? parseFloat(value.toString()) : 0),
    },
  })
  discountTotal: number;

  @Column({
    name: 'grand_total',
    type: 'numeric',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: {
      to: (value: number) => value,
      from: (value: string | number) => (value ? parseFloat(value.toString()) : 0),
    },
  })
  grandTotal: number;

  @Column({
    name: 'paid_amount',
    type: 'numeric',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: {
      to: (value: number) => value,
      from: (value: string | number) => (value ? parseFloat(value.toString()) : 0),
    },
  })
  paidAmount: number;

  @Column({
    name: 'balance_due',
    type: 'numeric',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: {
      to: (value: number) => value,
      from: (value: string | number) => (value ? parseFloat(value.toString()) : 0),
    },
  })
  balanceDue: number;

  @Column({ name: 'payment_status', default: 'PAID' })
  paymentStatus: string;

  @Column({ name: 'payment_method', default: 'CASH' })
  paymentMethod: string;

  @Column({ name: 'account_id', nullable: true })
  accountId: number;

  @OneToMany(() => InvoiceItem, (item) => item.invoice, { cascade: true, eager: true })
  items: InvoiceItem[];
}
