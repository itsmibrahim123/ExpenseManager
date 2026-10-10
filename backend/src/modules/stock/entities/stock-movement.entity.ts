import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';
import { Product } from '../../products/entities/product.entity';

@Entity('stock_movements')
export class StockMovement extends BaseTenantEntity {
  @Column({ name: 'product_id', nullable: false })
  productId: number;

  @ManyToOne(() => Product, { eager: true })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ name: 'movement_type', nullable: false })
  movementType: string;

  @Column({ name: 'quantity_changed', nullable: false })
  quantityChanged: number;

  @Column({ name: 'balance_after', nullable: false })
  balanceAfter: number;

  @Column({ name: 'reference_id', nullable: true })
  referenceId: string;

  @Column({ nullable: true })
  notes: string;
}
