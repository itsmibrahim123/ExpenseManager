import { Entity, Column } from 'typeorm';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';

@Entity('accounts')
export class Account extends BaseTenantEntity {
  @Column({ name: 'user_id', nullable: false })
  userId: number;

  @Column({ nullable: false })
  name: string;

  @Column({ nullable: false, default: 'CASH' })
  type: string;

  @Column({ name: 'currency_code', default: 'USD' })
  currencyCode: string;

  @Column({
    name: 'initial_balance',
    type: 'numeric',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: {
      to: (value: number) => value,
      from: (value: string | number) => (value ? parseFloat(value.toString()) : 0),
    },
  })
  initialBalance: number;

  @Column({
    name: 'current_balance',
    type: 'numeric',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: {
      to: (value: number) => value,
      from: (value: string | number) => (value ? parseFloat(value.toString()) : 0),
    },
  })
  currentBalance: number;

  @Column({ name: 'is_archived', default: false })
  archived: boolean;
}
