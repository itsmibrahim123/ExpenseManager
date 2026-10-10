import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  Index,
  BaseEntity,
} from 'typeorm';
import { TenantSettings } from './tenant-settings.entity';

export enum TenantStatus {
  TRIAL = 'TRIAL',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  CANCELLED = 'CANCELLED',
}

export enum PlanTier {
  STARTER = 'STARTER',
  PROFESSIONAL = 'PROFESSIONAL',
  ENTERPRISE = 'ENTERPRISE',
}

@Entity('tenants')
export class Tenant extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'store_name', nullable: false })
  storeName: string;

  @Index({ unique: true })
  @Column({ unique: true, nullable: false })
  slug: string;

  @Column({ name: 'contact_email', nullable: false })
  contactEmail: string;

  @Column({ name: 'contact_phone', nullable: true })
  contactPhone: string;

  @Column({ name: 'currency_code', default: 'USD' })
  currencyCode: string;

  @Column({
    type: 'varchar',
    default: TenantStatus.TRIAL,
  })
  status: TenantStatus;

  @Column({
    name: 'plan_tier',
    type: 'varchar',
    default: PlanTier.STARTER,
  })
  planTier: PlanTier;

  @Column({ name: 'expires_at', type: 'timestamptz', nullable: false })
  expiresAt: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToOne(() => TenantSettings, (settings) => settings.tenant)
  settings: TenantSettings;
}
