import {
  Entity,
  Column,
  OneToOne,
  OneToMany,
  Index,
} from 'typeorm';
import { BaseEntityWithTimestamps } from './BaseEntity';
import { UserRole, UserStatus } from '@buildlink/shared';
import type { UserProfile } from './UserProfile';
import type { EngineerProfile } from './EngineerProfile';
import type { Post } from './Post';

@Entity('users')
export class User extends BaseEntityWithTimestamps {
  @Index({ unique: true })
  @Column({ type: 'nvarchar', length: 255 })
  email!: string;

  @Column({ type: 'varchar', length: 255 })
  passwordHash!: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: UserRole.USER,
  })
  role!: UserRole;

  @Column({
    type: 'varchar',
    length: 20,
    default: UserStatus.ACTIVE,
  })
  status!: UserStatus;

  @Column({ type: 'bit', default: false })
  emailVerified!: boolean;

  @OneToOne('UserProfile', (profile: UserProfile) => profile.user, {
    cascade: true,
  })
  profile?: UserProfile;

  @OneToOne('EngineerProfile', (engProfile: EngineerProfile) => engProfile.user)
  engineerProfile?: EngineerProfile;

  @OneToMany('Post', (post: Post) => post.author)
  posts?: Post[];
}
