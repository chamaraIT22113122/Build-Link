import {
  Entity,
  Column,
  Index,
} from 'typeorm';
import { BaseEntityWithTimestamps } from './BaseEntity';

@Entity('knowledge_articles')
export class KnowledgeArticle extends BaseEntityWithTimestamps {
  @Index({ unique: true })
  @Column({ type: 'nvarchar', length: 200 })
  slug!: string;

  @Column({ type: 'nvarchar', length: 255 })
  title!: string;

  @Index()
  @Column({ type: 'nvarchar', length: 100 })
  category!: string;

  @Column({ type: 'nvarchar', length: 500 })
  summary!: string;

  @Column({ type: 'nvarchar', length: 'MAX' })
  content!: string;

  @Column({ type: 'nvarchar', length: 500, nullable: true })
  coverImageUrl?: string;

  @Column({ type: 'nvarchar', length: 100 })
  authorName!: string;

  @Column({ type: 'nvarchar', length: 150, nullable: true })
  standardsReference?: string;

  @Column({ type: 'nvarchar', length: 'MAX', nullable: true })
  tagsJson?: string;

  @Column({ type: 'int', default: 5 })
  readingTimeMinutes!: number;

  @Column({ type: 'int', default: 0 })
  viewsCount!: number;

  @Column({ type: 'bit', default: true })
  isPublished!: boolean;
}
