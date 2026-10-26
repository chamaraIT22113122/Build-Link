import {
  Entity,
  Column,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseEntityWithTimestamps } from './BaseEntity';
import { User } from './User';

@Entity('user_profiles')
export class UserProfile extends BaseEntityWithTimestamps {
  @Index()
  @Column({ type: 'uuid' })
  userId!: string;

  @OneToOne(() => User, (user) => user.profile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ type: 'nvarchar', length: 100 })
  firstName!: string;

  @Column({ type: 'nvarchar', length: 100 })
  lastName!: string;

  @Column({ type: 'nvarchar', length: 200, nullable: true })
  displayName?: string;

  @Column({ type: 'nvarchar', length: 500, nullable: true })
  avatarUrl?: string;

  @Column({ type: 'nvarchar', length: 1000, nullable: true })
  bio?: string;

  @Column({ type: 'nvarchar', length: 100, nullable: true })
  city?: string;

  @Column({ type: 'nvarchar', length: 100, nullable: true })
  district?: string;

  @Column({ type: 'nvarchar', length: 30, nullable: true })
  phoneNumber?: string;
}
