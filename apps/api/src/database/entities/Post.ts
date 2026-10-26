import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseEntityWithTimestamps } from './BaseEntity';
import { PostType, QuestionStatus } from '@buildlink/shared';
import { User } from './User';
import type { Comment } from './Comment';

@Entity('posts')
export class Post extends BaseEntityWithTimestamps {
  @Index()
  @Column({ type: 'uuid' })
  authorId!: string;

  @ManyToOne(() => User, (user) => user.posts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'authorId' })
  author!: User;

  @Column({
    type: 'varchar',
    length: 30,
    default: PostType.GENERAL,
  })
  postType!: PostType;

  @Index()
  @Column({ type: 'nvarchar', length: 100 })
  category!: string;

  @Column({ type: 'nvarchar', length: 255 })
  title!: string;

  @Column({ type: 'nvarchar', length: 'MAX' })
  content!: string;

  @Column({ type: 'nvarchar', length: 'MAX', nullable: true })
  mediaUrlsJson?: string; // JSON array of uploaded photo/document URLs

  @Column({
    type: 'varchar',
    length: 30,
    nullable: true,
    default: QuestionStatus.OPEN,
  })
  questionStatus?: QuestionStatus;

  @Column({ type: 'int', default: 0 })
  likesCount!: number;

  @Column({ type: 'int', default: 0 })
  commentsCount!: number;

  @Column({ type: 'bit', default: false })
  isResolved!: boolean;

  @Column({ type: 'uuid', nullable: true })
  acceptedAnswerId?: string;

  @OneToMany('Comment', (comment: Comment) => comment.post)
  comments?: Comment[];
}
