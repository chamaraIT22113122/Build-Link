import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseEntityWithTimestamps } from './BaseEntity';
import { VerificationStatus } from '@buildlink/shared';
import { EngineerProfile } from './EngineerProfile';

@Entity('verification_applications')
export class VerificationApplication extends BaseEntityWithTimestamps {
  @Index()
  @Column({ type: 'uuid' })
  engineerProfileId!: string;

  @ManyToOne(() => EngineerProfile, (eng) => eng.verificationApplications, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'engineerProfileId' })
  engineerProfile!: EngineerProfile;

  @Column({
    type: 'varchar',
    length: 30,
    default: VerificationStatus.PENDING_REVIEW,
  })
  status!: VerificationStatus;

  @Column({ type: 'nvarchar', length: 'MAX', nullable: true })
  reviewerNotes?: string;

  @Column({ type: 'uuid', nullable: true })
  reviewedBy?: string;

  @Column({ type: 'datetime2', nullable: true })
  reviewedAt?: Date;

  @Column({ type: 'nvarchar', length: 'MAX', nullable: true })
  submittedDocumentsJson?: string;
}
