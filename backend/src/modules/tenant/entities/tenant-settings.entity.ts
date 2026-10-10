import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  Index,
  BaseEntity,
} from 'typeorm';
import { Tenant } from './tenant.entity';

@Entity('tenant_settings')
export class TenantSettings extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ name: 'tenant_id', type: 'uuid', unique: true, nullable: false })
  tenantId: string;

  @OneToOne(() => Tenant, (tenant) => tenant.settings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column({ name: 'tax_number', nullable: true })
  taxNumber: string;

  @Column({
    name: 'tax_rate_default',
    type: 'numeric',
    precision: 10,
    scale: 2,
    default: 0,
    transformer: {
      to: (value: number) => value,
      from: (value: string | number) => (value ? parseFloat(value.toString()) : 0),
    },
  })
  taxRateDefault: number;

  @Column({ name: 'receipt_header', type: 'text', nullable: true })
  receiptHeader: string;

  @Column({ name: 'receipt_footer', type: 'text', nullable: true })
  receiptFooter: string;

  @Column({ name: 'logo_url', nullable: true })
  logoUrl: string;

  @Column({ name: 'allow_negative_stock', default: false })
  allowNegativeStock: boolean;
}
