import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { ActivationStatus } from './activation.entity';

@Entity('activation_recipients')
@Unique(['activationId', 'customerId'])
export class ActivationRecipient {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'activation_id', type: 'uuid' })
  activationId!: string;

  @Column({ name: 'customer_id', type: 'uuid' })
  customerId!: string;

  @Column({
    name: 'customer_name',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  customerName!: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  phone!: string | null;

  @Column({
    type: 'varchar',
    length: 16,
    default: ActivationStatus.Pending,
  })
  status!: ActivationStatus;

  @Column({
    name: 'provider_message_id',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  providerMessageId!: string | null;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @Column({ name: 'processed_at', type: 'timestamptz', nullable: true })
  processedAt!: Date | null;
}