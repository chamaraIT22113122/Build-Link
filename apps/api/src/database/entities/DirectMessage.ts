import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseEntityWithTimestamps } from './BaseEntity';
import { User } from './User';

@Entity('direct_messages')
export class DirectMessage extends BaseEntityWithTimestamps {
  @Index()
  @Column({ type: 'uuid' })
  senderId!: string;

  @ManyToOne(() => User, { onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'senderId' })
  sender!: User;

  @Index()
  @Column({ type: 'uuid' })
  recipientId!: string;

  @ManyToOne(() => User, { onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'recipientId' })
  recipient!: User;

  @Column({ type: 'nvarchar', length: 'MAX' })
  content!: string;

  @Column({ type: 'nvarchar', length: 'MAX', nullable: true })
  attachmentsJson?: string;

  @Column({ type: 'bit', default: false })
  isRead!: boolean;
}
