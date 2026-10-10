import {
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BaseEntity,
  BeforeInsert,
  Index,
} from 'typeorm';
import { TenantContext } from '../context/tenant-context';

export abstract class BaseTenantEntity extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Index()
  @Column({ type: 'uuid', name: 'tenant_id', nullable: false })
  tenantId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @BeforeInsert()
  autoPopulateTenant() {
    if (!this.tenantId) {
      const currentTenantId = TenantContext.getTenantId();
      if (currentTenantId) {
        this.tenantId = currentTenantId;
      }
    }
  }
}
