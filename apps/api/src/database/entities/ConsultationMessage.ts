import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseEntityWithTimestamps } from './BaseEntity';
import { User } from './User';
import type { Consultation } from './Consultation';

@Entity('consultation_messages')
export class ConsultationMessage extends BaseEntityWithTimestamps {
  @Index()
  @Column({ type: 'uuid' })
  consultationId!: string;

  @ManyToOne('Consultation', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'consultationId' })
  consultation!: Consultation;

  @Index()
  @Column({ type: 'uuid' })
  senderId!: string;

  @ManyToOne(() => User, { onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'senderId' })
  sender!: User;

  @Column({ type: 'nvarchar', length: 'MAX' })
  content!: string;

  @Column({ type: 'nvarchar', length: 'MAX', nullable: true })
  attachmentsJson?: string;

  @Column({ type: 'bit', default: false })
  isRead!: boolean;
}
