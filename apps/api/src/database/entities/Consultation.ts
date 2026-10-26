import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseEntityWithTimestamps } from './BaseEntity';
import { ConsultationType, ConsultationStatus } from '@buildlink/shared';
import { User } from './User';
import { EngineerProfile } from './EngineerProfile';

@Entity('consultations')
export class Consultation extends BaseEntityWithTimestamps {
  @Index()
  @Column({ type: 'uuid' })
  clientId!: string;

  @ManyToOne(() => User, { onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'clientId' })
  client!: User;

  @Index()
  @Column({ type: 'uuid' })
  engineerId!: string;

  @ManyToOne(() => EngineerProfile, (eng) => eng.consultations, {
    onDelete: 'NO ACTION',
  })
  @JoinColumn({ name: 'engineerId' })
  engineer!: EngineerProfile;

  @Column({
    type: 'varchar',
    length: 20,
    default: ConsultationType.TEXT,
  })
  consultationType!: ConsultationType;

  @Column({
    type: 'varchar',
    length: 30,
    default: ConsultationStatus.REQUESTED,
  })
  status!: ConsultationStatus;

  @Column({ type: 'datetimeoffset', nullable: true })
  scheduledAt?: Date;

  @Column({ type: 'nvarchar', length: 'MAX' })
  problemDescription!: string;

  @Column({ type: 'nvarchar', length: 'MAX', nullable: true })
  attachmentsJson?: string;
}
