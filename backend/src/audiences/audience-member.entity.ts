import { CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity('audience_members')
export class AudienceMember {
  @PrimaryColumn({ name: 'audience_id', type: 'uuid' })
  audienceId!: string;

  @PrimaryColumn({ name: 'customer_id', type: 'uuid' })
  customerId!: string;

  @CreateDateColumn({
    name: 'joined_at',
    type: 'timestamptz',
  })
  joinedAt!: Date;
}