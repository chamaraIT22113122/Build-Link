import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseEntityWithTimestamps } from './BaseEntity';
import { ProjectStage } from '@buildlink/shared';
import type { Project } from './Project';

@Entity('project_milestones')
export class ProjectMilestone extends BaseEntityWithTimestamps {
  @Index()
  @Column({ type: 'uuid' })
  projectId!: string;

  @ManyToOne('Project', (project: Project) => project.milestones, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'projectId' })
  project!: Project;

  @Column({
    type: 'varchar',
    length: 50,
    default: ProjectStage.PLANNING,
  })
  stage!: ProjectStage;

  @Column({ type: 'nvarchar', length: 200 })
  title!: string;

  @Column({ type: 'nvarchar', length: 'MAX', nullable: true })
  description?: string;

  @Column({ type: 'datetimeoffset', nullable: true })
  targetDate?: Date;

  @Column({ type: 'bit', default: false })
  isCompleted!: boolean;

  @Column({ type: 'datetimeoffset', nullable: true })
  completedAt?: Date;

  @Column({ type: 'bit', default: false })
  isSignedOffByEngineer!: boolean;

  @Column({ type: 'uuid', nullable: true })
  signedOffByEngineerId?: string;

  @Column({ type: 'datetimeoffset', nullable: true })
  signedOffAt?: Date;

  @Column({ type: 'nvarchar', length: 'MAX', nullable: true })
  engineerNotes?: string;

  @Column({ type: 'nvarchar', length: 'MAX', nullable: true })
  photoUrlsJson?: string;
}
