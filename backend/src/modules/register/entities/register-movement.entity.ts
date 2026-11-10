import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';
import { DailyRegisterSession } from './daily-register-session.entity';

export enum RegisterMovementType {
  CASH_DROP = 'CASH_DROP',
  PAY_IN = 'PAY_IN',
  PAY_OUT = 'PAY_OUT',
}

@Entity('register_movements')
export class RegisterMovement extends BaseTenantEntity {
  @Column({ name: 'session_id', nullable: false })
  sessionId: number;

  @ManyToOne(() => DailyRegisterSession, (session) => session.movements, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'session_id' })
  session: DailyRegisterSession;

  @Column({
    name: 'movement_type',
    type: 'varchar',
    nullable: false,
  })
  movementType: RegisterMovementType;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    nullable: false,
    transformer: {
      to: (value: number) => value,
      from: (value: string | number) => (value ? parseFloat(value.toString()) : 0),
    },
  })
  amount: number;

  @Column({ nullable: true })
  reason: string;

  @Column({ name: 'user_id', nullable: false })
  userId: number;
}
