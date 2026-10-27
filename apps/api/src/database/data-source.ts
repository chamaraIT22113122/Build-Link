import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { env } from '../config';
import {
  User,
  UserProfile,
  EngineerProfile,
  VerificationApplication,
  Post,
  Comment,
  Consultation,
  KnowledgeArticle,
  AuditLog,
  PostLike,
  Project,
  ProjectMilestone,
  ConsultationMessage,
  EngineerReview,
  DirectMessage,
  UserConnection,
} from './entities';

export const AppDataSource = new DataSource({
  type: 'mssql',
  host: env.DB_HOST,
  port: env.DB_PORT,
  username: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  synchronize: false, // Use migrations for schema changes
  logging: env.NODE_ENV === 'development',
  entities: [
    User,
    UserProfile,
    EngineerProfile,
    VerificationApplication,
    Post,
    Comment,
    Consultation,
    KnowledgeArticle,
    AuditLog,
    PostLike,
    Project,
    ProjectMilestone,
    ConsultationMessage,
    EngineerReview,
    DirectMessage,
    UserConnection,
  ],
  migrations: [__dirname + '/migrations/*.{ts,js}'],
  options: {
    encrypt: env.DB_ENCRYPT,
    trustServerCertificate: env.DB_TRUST_SERVER_CERTIFICATE,
    connectTimeout: 5000,
  },
  extra: {
    requestTimeout: 10000,
  },
});

export interface DatabaseConnectionState {
  isConnected: boolean;
  engine: string;
  host: string;
  database: string;
  error?: string;
}

export let dbState: DatabaseConnectionState = {
  isConnected: false,
  engine: 'Microsoft SQL Server 2025 Express',
  host: `${env.DB_HOST}:${env.DB_PORT}`,
  database: env.DB_NAME,
};

export async function initializeDatabase(): Promise<DatabaseConnectionState> {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    dbState = {
      isConnected: true,
      engine: 'Microsoft SQL Server 2025 Express',
      host: `${env.DB_HOST}:${env.DB_PORT}`,
      database: env.DB_NAME,
    };
    console.log(
      `[Database] Successfully connected to Microsoft SQL Server 2025 Express (${env.DB_NAME} at ${env.DB_HOST}:${env.DB_PORT})`
    );
    return dbState;
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error ? err.message : 'Unknown database connection error';
    dbState = {
      isConnected: false,
      engine: 'Microsoft SQL Server 2025 Express',
      host: `${env.DB_HOST}:${env.DB_PORT}`,
      database: env.DB_NAME,
      error: errorMsg,
    };
    console.warn(
      `[Database] Note: Microsoft SQL Server is currently unreachable at ${env.DB_HOST}:${env.DB_PORT}.\n` +
        `Reason: ${errorMsg}\n` +
        `BuildLink API will continue running in diagnostic/offline-ready mode.\n` +
        `To enable live persistence, ensure SQL Server Express is running and configured as specified in docs/deployment.md.`
    );
    return dbState;
  }
}
