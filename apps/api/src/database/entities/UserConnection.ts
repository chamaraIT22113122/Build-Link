import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseEntityWithTimestamps } from './BaseEntity';
import { User } from './User';

@Entity('user_connections')
export class UserConnection extends BaseEntityWithTimestamps {
  @Index()
  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Index()
  @Column({ type: 'uuid' })
  connectedUserId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'connectedUserId' })
  connectedUser!: User;

  @Column({ type: 'nvarchar', length: 50, default: 'CONNECTED' })
  status!: string;
}
