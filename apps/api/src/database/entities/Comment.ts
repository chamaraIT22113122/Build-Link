import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseEntityWithTimestamps } from './BaseEntity';
import { Post } from './Post';
import { User } from './User';

@Entity('comments')
export class Comment extends BaseEntityWithTimestamps {
  @Index()
  @Column({ type: 'uuid' })
  postId!: string;

  @ManyToOne(() => Post, (post) => post.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'postId' })
  post!: Post;

  @Index()
  @Column({ type: 'uuid' })
  authorId!: string;

  @ManyToOne(() => User, { onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'authorId' })
  author!: User;

  @Column({ type: 'uuid', nullable: true })
  parentCommentId?: string;

  @Column({ type: 'nvarchar', length: 'MAX' })
  content!: string;

  @Column({ type: 'bit', default: false })
  isProfessionalAnswer!: boolean;

  @Column({ type: 'bit', default: false })
  isMarkedHelpful!: boolean;

  @Column({ type: 'int', default: 0 })
  helpfulCount!: number;

  @Column({ type: 'bit', default: false })
  isAcceptedSolution!: boolean;
}
