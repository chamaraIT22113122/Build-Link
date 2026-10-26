export enum UserRole {
  USER = 'USER',
  ENGINEER = 'ENGINEER',
  ADMIN = 'ADMIN'
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  PENDING = 'PENDING',
  SUSPENDED = 'SUSPENDED',
  DEACTIVATED = 'DEACTIVATED'
}

export enum VerificationStatus {
  NOT_SUBMITTED = 'NOT_SUBMITTED',
  PENDING_REVIEW = 'PENDING_REVIEW',
  UNDER_REVIEW = 'UNDER_REVIEW',
  ADDITIONAL_INFO_REQUIRED = 'ADDITIONAL_INFO_REQUIRED',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
  SUSPENDED = 'SUSPENDED',
  EXPIRED = 'EXPIRED'
}

export enum PostType {
  GENERAL = 'GENERAL',
  QUESTION = 'QUESTION',
  PROJECT_UPDATE = 'PROJECT_UPDATE',
  PROFESSIONAL_ADVICE = 'PROFESSIONAL_ADVICE',
  TIP = 'TIP',
  MATERIAL_DISCUSSION = 'MATERIAL_DISCUSSION'
}

export enum QuestionStatus {
  OPEN = 'OPEN',
  ANSWERED = 'ANSWERED',
  AWAITING_PROFESSIONAL = 'AWAITING_PROFESSIONAL',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
  UNDER_MODERATION = 'UNDER_MODERATION'
}

export enum ConsultationType {
  TEXT = 'TEXT',
  AUDIO = 'AUDIO',
  VIDEO = 'VIDEO',
  ONSITE = 'ONSITE',
  ADVICE = 'ADVICE'
}

export enum ConsultationStatus {
  REQUESTED = 'REQUESTED',
  ACCEPTED = 'ACCEPTED',
  ALTERNATIVE_PROPOSED = 'ALTERNATIVE_PROPOSED',
  DECLINED = 'DECLINED',
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  DISPUTED = 'DISPUTED'
}

export enum ProjectStage {
  PLANNING = 'PLANNING',
  DESIGN = 'DESIGN',
  APPROVALS = 'APPROVALS',
  SITE_PREPARATION = 'SITE_PREPARATION',
  FOUNDATION = 'FOUNDATION',
  STRUCTURAL_WORK = 'STRUCTURAL_WORK',
  ROOFING = 'ROOFING',
  ELECTRICAL_PLUMBING = 'ELECTRICAL_PLUMBING',
  FINISHING = 'FINISHING',
  FINAL_INSPECTION = 'FINAL_INSPECTION',
  COMPLETED = 'COMPLETED'
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
  timestamp: string;
}

export interface HealthCheckResponse {
  status: 'ok' | 'degraded' | 'error';
  service: string;
  version: string;
  timestamp: string;
  uptime: number;
  database: {
    status: 'connected' | 'disconnected' | 'unconfigured';
    engine: string;
    message?: string;
  };
}

export interface UserProfileDto {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  city?: string;
  district?: string;
  phoneNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EngineerProfileDto {
  id: string;
  userId: string;
  title: string;
  specializations: string[];
  yearsOfExperience: number;
  registrationBody?: string;
  registrationNumber?: string;
  verificationStatus: VerificationStatus;
  consultationFee: number;
  availableForConsultation: boolean;
  ratingAverage: number;
  ratingCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserDto {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  profile?: UserProfileDto;
  engineerProfile?: EngineerProfileDto;
}

export interface AuthResponseData {
  user: UserDto;
  token: string;
}

export interface RegisterRequestDto {
  email: string;
  password: string;
  role?: UserRole;
  firstName: string;
  lastName: string;
  engineerTitle?: string;
  specialization?: string;
}

export interface LoginRequestDto {
  email: string;
  password: string;
}

export interface UpdateProfileRequestDto {
  firstName?: string;
  lastName?: string;
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  city?: string;
  district?: string;
  phoneNumber?: string;
}

export interface UpdateEngineerProfileRequestDto {
  title?: string;
  specializations?: string[];
  yearsOfExperience?: number;
  registrationBody?: string;
  registrationNumber?: string;
  consultationFee?: number;
  availableForConsultation?: boolean;
}

export interface ChangePasswordRequestDto {
  currentPassword: string;
  newPassword: string;
}

export interface JwtTokenPayload {
  sub: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

