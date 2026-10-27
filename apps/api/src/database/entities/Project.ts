import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseEntityWithTimestamps } from './BaseEntity';
import { ProjectStage } from '@buildlink/shared';
import { User } from './User';
import { EngineerProfile } from './EngineerProfile';
import type { ProjectMilestone } from './ProjectMilestone';

@Entity('projects')
export class Project extends BaseEntityWithTimestamps {
  @Index()
  @Column({ type: 'uuid' })
  ownerId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ownerId' })
  owner!: User;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  assignedEngineerId?: string;

  @ManyToOne(() => EngineerProfile, { onDelete: 'NO ACTION', nullable: true })
  @JoinColumn({ name: 'assignedEngineerId' })
  assignedEngineer?: EngineerProfile;

  @Column({ type: 'nvarchar', length: 200 })
  title!: string;

  @Column({ type: 'nvarchar', length: 'MAX' })
  description!: string;

  @Column({ type: 'nvarchar', length: 150 })
  location!: string;

  @Column({ type: 'nvarchar', length: 100 })
  district!: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: ProjectStage.PLANNING,
  })
  stage!: ProjectStage;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  estimatedBudget!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  actualSpent!: number;

  @Column({ type: 'datetimeoffset', nullable: true })
  startDate?: Date;

  @Column({ type: 'datetimeoffset', nullable: true })
  targetCompletionDate?: Date;

  @OneToMany('ProjectMilestone', (milestone: ProjectMilestone) => milestone.project, {
    cascade: true,
  })
  milestones?: ProjectMilestone[];
}
