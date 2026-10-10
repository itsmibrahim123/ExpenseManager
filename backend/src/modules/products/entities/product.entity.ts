import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';
import { Category } from '../../categories/entities/category.entity';

@Entity('products')
export class Product extends BaseTenantEntity {
  @Column({ nullable: false })
  sku: string;

  @Column({ nullable: true })
  barcode: string;

  @Column({ nullable: false })
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({
    name: 'cost_price',
    type: 'numeric',
    precision: 10,
    scale: 2,
    default: 0,
    transformer: {
      to: (value: number) => value,
      from: (value: string | number) => (value ? parseFloat(value.toString()) : 0),
    },
  })
  costPrice: number;

  @Column({
    name: 'selling_price',
    type: 'numeric',
    precision: 10,
    scale: 2,
    default: 0,
    transformer: {
      to: (value: number) => value,
      from: (value: string | number) => (value ? parseFloat(value.toString()) : 0),
    },
  })
  sellingPrice: number;

  @Column({ name: 'current_stock', default: 0 })
  currentStock: number;

  @Column({ name: 'reorder_level', default: 5 })
  reorderLevel: number;

  @Column({ default: 'PCS' })
  unit: string;

  @Column({ name: 'category_id', nullable: true })
  categoryId: number;

  @ManyToOne(() => Category, { eager: true, nullable: true })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @Column({ default: true })
  active: boolean;
}
