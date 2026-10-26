import {
  Entity,
  Column,
  OneToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseEntityWithTimestamps } from './BaseEntity';
import { User } from './User';
import { VerificationStatus } from '@buildlink/shared';
import type { VerificationApplication } from './VerificationApplication';
import type { Consultation } from './Consultation';

@Entity('engineer_profiles')
export class EngineerProfile extends BaseEntityWithTimestamps {
  @Index({ unique: true })
  @Column({ type: 'uuid' })
  userId!: string;

  @OneToOne(() => User, (user) => user.engineerProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ type: 'nvarchar', length: 150 })
  title!: string;

  @Column({ type: 'nvarchar', length: 'MAX' })
  specializations!: string; // JSON array of specializations

  @Column({ type: 'int', default: 0 })
  yearsOfExperience!: number;

  @Column({ type: 'nvarchar', length: 150, nullable: true })
  registrationBody?: string;

  @Column({ type: 'nvarchar', length: 100, nullable: true })
  registrationNumber?: string;

  @Column({
    type: 'varchar',
    length: 30,
    default: VerificationStatus.NOT_SUBMITTED,
  })
  verificationStatus!: VerificationStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  consultationFee!: number;

  @Column({ type: 'bit', default: true })
  availableForConsultation!: boolean;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  ratingAverage!: number;

  @Column({ type: 'int', default: 0 })
  ratingCount!: number;

  @OneToMany(
    'VerificationApplication',
    (app: VerificationApplication) => app.engineerProfile
  )
  verificationApplications?: VerificationApplication[];

  @OneToMany('Consultation', (c: Consultation) => c.engineer)
  consultations?: Consultation[];
}
