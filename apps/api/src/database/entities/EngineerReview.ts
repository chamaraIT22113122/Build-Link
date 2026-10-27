import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseEntityWithTimestamps } from './BaseEntity';
import { User } from './User';
import { EngineerProfile } from './EngineerProfile';

@Entity('engineer_reviews')
export class EngineerReview extends BaseEntityWithTimestamps {
  @Index()
  @Column({ type: 'uuid' })
  engineerProfileId!: string;

  @ManyToOne(() => EngineerProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'engineerProfileId' })
  engineerProfile!: EngineerProfile;

  @Index()
  @Column({ type: 'uuid' })
  clientId!: string;

  @ManyToOne(() => User, { onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'clientId' })
  client!: User;

  @Column({ type: 'uuid', nullable: true })
  consultationId?: string;

  @Column({ type: 'int' })
  rating!: number; // 1 to 5 stars

  @Column({ type: 'nvarchar', length: 'MAX' })
  reviewText!: string;

  @Column({ type: 'bit', default: true })
  isVerifiedClient!: boolean;
}
