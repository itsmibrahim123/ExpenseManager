import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';
import { Product } from './product.entity';

export enum SerialStatus {
  IN_STOCK = 'IN_STOCK',
  SOLD = 'SOLD',
  DEFECTIVE = 'DEFECTIVE',
  RETURNED = 'RETURNED',
}

@Entity('product_serials')
@Index(['tenantId', 'serialNumber'], { unique: true })
export class ProductSerial extends BaseTenantEntity {
  @Column({ name: 'product_id', nullable: false })
  productId: number;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ name: 'serial_number', nullable: false })
  serialNumber: string;

  @Column({
    type: 'varchar',
    default: SerialStatus.IN_STOCK,
  })
  status: SerialStatus;

  @Column({ name: 'invoice_item_id', nullable: true })
  invoiceItemId: number;

  @Column({ nullable: true })
  notes: string;
}
