import { Entity, Column } from 'typeorm';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';

@Entity('customers')
export class Customer extends BaseTenantEntity {
  @Column({ nullable: false })
  name: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  address: string;

  @Column({ name: 'tax_id', nullable: true })
  taxId: string;

  @Column({
    name: 'current_credit_balance',
    type: 'numeric',
    precision: 10,
    scale: 2,
    default: 0,
    transformer: {
      to: (value: number) => value,
      from: (value: string | number) => (value ? parseFloat(value.toString()) : 0),
    },
  })
  currentCreditBalance: number;
}
