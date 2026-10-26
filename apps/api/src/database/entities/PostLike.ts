import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { BaseEntityWithTimestamps } from './BaseEntity';
import { Post } from './Post';
import { User } from './User';

@Entity('post_likes')
@Unique(['postId', 'userId'])
export class PostLike extends BaseEntityWithTimestamps {
  @Index()
  @Column({ type: 'uuid' })
  postId!: string;

  @ManyToOne(() => Post, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'postId' })
  post!: Post;

  @Index()
  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'userId' })
  user!: User;
}
