import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';
import { Account } from '../../accounts/entities/account.entity';
import { Category } from '../../categories/entities/category.entity';

@Entity('transactions')
export class Transaction extends BaseTenantEntity {
  @Column({ name: 'user_id', nullable: false })
  userId: number;

  @Column({ name: 'account_id', nullable: false })
  accountId: number;

  @ManyToOne(() => Account, { eager: true, nullable: true })
  @JoinColumn({ name: 'account_id' })
  account: Account;

  @Column({ name: 'category_id', nullable: false })
  categoryId: number;

  @ManyToOne(() => Category, { eager: true, nullable: true })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @Column({ nullable: false, default: 'EXPENSE' })
  type: string;

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
  amount: number;

  @Column({ name: 'currency_code', default: 'USD' })
  currencyCode: string;

  @Column({
    name: 'transaction_date',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  transactionDate: Date;

  @Column({ default: 'COMPLETED' })
  status: string;

  @Column({ name: 'reference_number', nullable: true })
  referenceNumber: string;

  @Column({ nullable: true })
  description: string;

  @Column({ name: 'is_recurring_instance', default: false })
  recurringInstance: boolean;

  @Column({ name: 'linked_transaction_id', nullable: true })
  linkedTransactionId: number;
}
