import {
  Entity,
  Column,
  Index,
} from 'typeorm';
import { BaseEntityWithTimestamps } from './BaseEntity';

@Entity('audit_logs')
export class AuditLog extends BaseEntityWithTimestamps {
  @Index()
  @Column({ type: 'uuid', nullable: true })
  actorId?: string;

  @Column({ type: 'nvarchar', length: 255, nullable: true })
  actorEmail?: string;

  @Column({ type: 'varchar', length: 100 })
  action!: string;

  @Column({ type: 'varchar', length: 50 })
  targetType!: string;

  @Column({ type: 'varchar', length: 100 })
  targetId!: string;

  @Column({ type: 'nvarchar', length: 'MAX' })
  details!: string;

  @Column({ type: 'varchar', length: 60, nullable: true })
  ipAddress?: string;
}
