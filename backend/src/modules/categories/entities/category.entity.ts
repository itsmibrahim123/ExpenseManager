import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';

@Entity('categories')
export class Category extends BaseTenantEntity {
  @Column({ name: 'user_id', nullable: true })
  userId: number;

  @Column({ name: 'parent_category_id', nullable: true })
  parentCategoryId: number;

  @Column({ nullable: false })
  name: string;

  @Column({ nullable: false, default: 'EXPENSE' })
  type: string; // INCOME or EXPENSE

  @Column({ nullable: true })
  icon: string;

  @Column({ nullable: true })
  color: string;

  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;

  @Column({ name: 'is_archived', default: false })
  archived: boolean;
}
