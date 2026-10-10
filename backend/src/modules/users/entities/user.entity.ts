import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BaseEntity,
  Index,
} from 'typeorm';

export enum UserRole {
  ROLE_SUPER_ADMIN = 'ROLE_SUPER_ADMIN',
  ROLE_STORE_ADMIN = 'ROLE_STORE_ADMIN',
  ROLE_CASHIER = 'ROLE_CASHIER',
  ROLE_INVENTORY_MANAGER = 'ROLE_INVENTORY_MANAGER',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

@Entity('users')
export class User extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Index()
  @Column({ name: 'tenant_id', type: 'uuid', nullable: true })
  tenantId: string | null;

  @Column({ name: 'full_name', nullable: false })
  fullName: string;

  @Index({ unique: true })
  @Column({ unique: true, nullable: false })
  email: string;

  @Column({ name: 'password_hash', nullable: false })
  passwordHash: string;

  @Column({
    type: 'varchar',
    default: UserRole.ROLE_STORE_ADMIN,
  })
  role: UserRole;

  @Column({
    name: 'user_status',
    type: 'varchar',
    default: UserStatus.ACTIVE,
  })
  userStatus: UserStatus;

  @Column({ default: 'ACTIVE' })
  status: string;

  @Column({ name: 'preferred_currency', nullable: true })
  preferredCurrency: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
