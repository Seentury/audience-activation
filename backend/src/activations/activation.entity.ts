import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum ActivationStatus {
  Pending = 'Pending',
  Processing = 'Processing',
  Success = 'Success',
  Failed = 'Failed',
}

@Entity('activations')
export class Activation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'audience_id', type: 'uuid' })
  audienceId!: string;

  @Column({ name: 'audience_name', type: 'varchar', length: 255 })
  audienceName!: string;

  @Column({ type: 'text' })
  message!: string;

  @Column({
    type: 'varchar',
    length: 16,
    default: ActivationStatus.Pending,
  })
  status!: ActivationStatus;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @Column({ name: 'started_at', type: 'timestamptz', nullable: true })
  startedAt!: Date | null;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt!: Date | null;
}