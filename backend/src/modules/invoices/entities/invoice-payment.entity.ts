import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';
import { Invoice } from './invoice.entity';

@Entity('invoice_payments')
export class InvoicePayment extends BaseTenantEntity {
  @Column({ name: 'invoice_id', nullable: false })
  invoiceId: number;

  @ManyToOne(() => Invoice, (inv) => inv.payments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'invoice_id' })
  invoice: Invoice;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    nullable: false,
    transformer: {
      to: (value: number) => value,
      from: (value: string | number) => (value ? parseFloat(value.toString()) : 0),
    },
  })
  amount: number;

  @Column({ name: 'payment_method', default: 'CASH' })
  paymentMethod: string;

  @Column({ name: 'payment_date', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  paymentDate: Date;

  @Column({ name: 'reference_notes', nullable: true })
  referenceNotes: string;

  @Column({ name: 'account_id', nullable: true })
  accountId: number;

  @Column({ name: 'recorded_by_user_id', nullable: true })
  recordedByUserId: number;
}
