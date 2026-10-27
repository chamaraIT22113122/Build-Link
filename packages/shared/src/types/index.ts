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
  coverPhotoUrl?: string;
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
  city?: string;
  district?: string;
  phoneNumber?: string;
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
  bio?: string;
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

export enum DocumentType {
  DEGREE_CERTIFICATE = 'DEGREE_CERTIFICATE',
  IESL_MEMBERSHIP_CARD = 'IESL_MEMBERSHIP_CARD',
  PRACTICING_LICENSE = 'PRACTICING_LICENSE',
  GOVERNMENT_ID = 'GOVERNMENT_ID',
  PROJECT_PORTFOLIO = 'PROJECT_PORTFOLIO',
  OTHER = 'OTHER',
}

export interface VerificationDocumentDto {
  id: string;
  applicationId: string;
  documentType: DocumentType;
  fileUrl: string;
  originalFilename: string;
  fileSizeBytes?: number;
  isVerified: boolean;
  createdAt: string;
}

export interface VerificationApplicationDto {
  id: string;
  engineerProfileId: string;
  engineerName?: string;
  engineerEmail?: string;
  engineerTitle?: string;
  registrationBody?: string;
  registrationNumber?: string;
  status: VerificationStatus;
  submissionDate: string;
  reviewerNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  documents: VerificationDocumentDto[];
}

export interface ApplyVerificationDto {
  registrationBody: string;
  registrationNumber: string;
  notes?: string;
  documents: Array<{
    documentType: DocumentType;
    fileUrl: string;
    originalFilename: string;
    fileSizeBytes?: number;
  }>;
}

export interface ReviewVerificationDto {
  status: VerificationStatus;
  reviewerNotes: string;
}

export interface AuditLogDto {
  id: string;
  actorId?: string;
  actorEmail?: string;
  action: string;
  targetType: string;
  targetId: string;
  details: string;
  ipAddress?: string;
  createdAt: string;
}

export interface PostAuthorDto {
  id: string;
  displayName: string;
  avatarUrl?: string;
  role: UserRole;
  isVerifiedEngineer?: boolean;
  engineerTitle?: string;
}

export enum ReactionType {
  LIKE = 'LIKE',       // 👍 Like
  LOVE = 'LOVE',       // ❤️ Love
  INSIGHT = 'INSIGHT', // 💡 Insightful
  SOLID = 'SOLID',     // 🏗️ Solid Work
  CAUTION = 'CAUTION', // ⚠️ Caution
}

export interface PostReactionBreakdownDto {
  like: number;
  love: number;
  insight: number;
  solid: number;
  caution: number;
}

export interface PostDto {
  id: string;
  authorId: string;
  author: PostAuthorDto;
  postType: PostType;
  category: string;
  title: string;
  content: string;
  mediaUrls: string[];
  questionStatus?: QuestionStatus;
  isQuestion?: boolean;
  urgency?: string;
  locationTag?: string;
  groupId?: string;
  groupName?: string;
  likesCount: number;
  commentsCount: number;
  isResolved: boolean;
  acceptedAnswerId?: string;
  isLikedByMe?: boolean;
  userReaction?: ReactionType | null;
  reactionBreakdown?: PostReactionBreakdownDto;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePostDto {
  title: string;
  content: string;
  category: string;
  postType?: PostType;
  mediaUrls?: string[];
  isQuestion?: boolean;
  urgency?: string;
  locationTag?: string;
  groupId?: string;
  groupName?: string;
}

export interface UpdatePostDto {
  title?: string;
  content?: string;
  category?: string;
  isResolved?: boolean;
  questionStatus?: QuestionStatus;
}

export interface CommentAuthorDto {
  id: string;
  displayName: string;
  avatarUrl?: string;
  role: UserRole;
  isVerifiedEngineer?: boolean;
  engineerTitle?: string;
}

export interface CommentDto {
  id: string;
  postId: string;
  authorId: string;
  author: CommentAuthorDto;
  parentCommentId?: string;
  content: string;
  isProfessionalAnswer: boolean;
  isMarkedHelpful: boolean;
  helpfulCount: number;
  isAcceptedSolution: boolean;
  createdAt: string;
}

export interface CreateCommentDto {
  content: string;
  parentCommentId?: string;
  isProfessionalAnswer?: boolean;
}

export interface ToggleLikeResponseDto {
  isLiked: boolean;
  likesCount: number;
}

export interface ResolveQuestionDto {
  acceptedCommentId?: string;
  resolutionNotes?: string;
}

export interface VoteHelpfulResponseDto {
  isMarkedHelpful: boolean;
  helpfulCount: number;
}

export interface AskQuestionDto {
  title: string;
  content: string;
  category: string;
  mediaUrls?: string[];
  urgency?: 'LOW' | 'MEDIUM' | 'HIGH';
}

// Phase 6: Professional Directory & Consultation DTOs
export interface EngineerDirectoryItemDto {
  id: string;
  userId: string;
  displayName: string;
  title: string;
  specializations: string[];
  yearsOfExperience: number;
  verificationStatus: VerificationStatus;
  isVerified: boolean;
  city?: string;
  district?: string;
  avatarUrl?: string;
  bio?: string;
  consultationFee: number;
  availableForConsultation: boolean;
  ratingAverage: number;
  ratingCount: number;
  registrationBody?: string;
  registrationNumber?: string;
}

export interface EngineerDirectoryQueryDto {
  search?: string;
  specialization?: string;
  district?: string;
  verifiedOnly?: boolean;
  sortBy?: 'rating' | 'experience' | 'fee';
  sortOrder?: 'ASC' | 'DESC';
  page?: number;
  limit?: number;
}

export interface ConsultationDto {
  id: string;
  clientId: string;
  clientName?: string;
  clientEmail?: string;
  engineerId: string;
  engineerName?: string;
  engineerTitle?: string;
  consultationType: ConsultationType;
  status: ConsultationStatus;
  scheduledAt?: string;
  problemDescription: string;
  attachments?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateConsultationDto {
  engineerId: string;
  consultationType: ConsultationType;
  scheduledAt?: string;
  problemDescription: string;
  attachments?: string[];
}

export interface UpdateConsultationStatusDto {
  status: ConsultationStatus;
  scheduledAt?: string;
  notes?: string;
}

// Phase 7: Project Tracking & Milestone Collaboration DTOs
export interface ProjectMilestoneDto {
  id: string;
  projectId: string;
  stage: ProjectStage;
  title: string;
  description?: string;
  targetDate?: string;
  isCompleted: boolean;
  completedAt?: string;
  isSignedOffByEngineer: boolean;
  signedOffByEngineerId?: string;
  signedOffEngineerName?: string;
  signedOffAt?: string;
  engineerNotes?: string;
  photoUrls?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectDto {
  id: string;
  ownerId: string;
  ownerName?: string;
  assignedEngineerId?: string;
  assignedEngineerName?: string;
  assignedEngineerTitle?: string;
  title: string;
  description: string;
  location: string;
  district: string;
  stage: ProjectStage;
  estimatedBudget: number;
  actualSpent: number;
  startDate?: string;
  targetCompletionDate?: string;
  milestones: ProjectMilestoneDto[];
  completedMilestonesCount: number;
  totalMilestonesCount: number;
  progressPercentage: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectDto {
  title: string;
  description: string;
  location: string;
  district: string;
  stage?: ProjectStage;
  estimatedBudget?: number;
  budget?: number;
  spent?: number;
  assignedEngineerId?: string;
  startDate?: string;
  targetCompletionDate?: string;
}

export interface UpdateProjectDto {
  title?: string;
  description?: string;
  location?: string;
  district?: string;
  stage?: ProjectStage;
  estimatedBudget?: number;
  actualSpent?: number;
  assignedEngineerId?: string;
  startDate?: string;
  targetCompletionDate?: string;
}

export interface CreateMilestoneDto {
  stage: ProjectStage;
  title: string;
  description?: string;
  targetDate?: string;
  photoUrls?: string[];
}

export interface SignOffMilestoneDto {
  notes?: string;
  photoUrls?: string[];
}

// Phase 8: Knowledge Hub & Sri Lankan Building Standards DTOs
export interface KnowledgeArticleDto {
  id: string;
  slug: string;
  title: string;
  category: string;
  summary: string;
  content: string;
  coverImageUrl?: string;
  authorName: string;
  standardsReference?: string;
  tags: string[];
  readingTimeMinutes: number;
  viewsCount: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateKnowledgeArticleDto {
  title: string;
  slug?: string;
  category: string;
  summary: string;
  content: string;
  coverImageUrl?: string;
  authorName?: string;
  standardsReference?: string;
  tags?: string[];
  readingTimeMinutes?: number;
}

export interface KnowledgeSearchQueryDto {
  search?: string;
  category?: string;
  standardsReference?: string;
  tag?: string;
  page?: number;
  limit?: number;
}

// Phase 9: In-App Messaging & Review Ratings DTOs
export interface ConsultationMessageDto {
  id: string;
  consultationId: string;
  senderId: string;
  senderName?: string;
  senderRole?: UserRole;
  content: string;
  attachments?: string[];
  isRead: boolean;
  createdAt: string;
}

export interface CreateConsultationMessageDto {
  content: string;
  attachments?: string[];
}

export interface EngineerReviewDto {
  id: string;
  engineerProfileId: string;
  clientId: string;
  clientName?: string;
  rating: number;
  reviewText: string;
  isVerifiedClient: boolean;
  createdAt: string;
}

export interface CreateEngineerReviewDto {
  rating: number;
  reviewText: string;
  consultationId?: string;
}

// Facebook-style Direct Messaging & Messenger DTOs
export interface DirectMessageDto {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  senderRole?: UserRole;
  recipientId: string;
  recipientName: string;
  content: string;
  attachments?: string[];
  isRead: boolean;
  createdAt: string;
}

export interface SendDirectMessageDto {
  recipientId: string;
  content: string;
  attachments?: string[];
}

export interface ConversationSummaryDto {
  otherUserId: string;
  otherUserName: string;
  otherUserAvatar?: string;
  otherUserRole: UserRole;
  otherUserTitle?: string;
  isVerifiedEngineer?: boolean;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

export interface UserConnectionDto {
  id: string;
  userId: string;
  connectedUserId: string;
  connectedUserName: string;
  connectedUserTitle?: string;
  connectedUserAvatar?: string;
  isVerifiedEngineer?: boolean;
  createdAt: string;
}

// Facebook Stories (Site Snaps) DTOs
export interface StoryDto {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  authorRole: UserRole;
  isVerifiedEngineer?: boolean;
  mediaUrl: string;
  caption?: string;
  locationTag?: string;
  createdAt: string;
  expiresAt: string;
  isViewed?: boolean;
}

export interface CreateStoryDto {
  mediaUrl: string;
  caption?: string;
  locationTag?: string;
}

// Facebook-style Construction Groups & Communities DTOs
export interface ConstructionGroupDto {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  coverImage?: string;
  icon?: string;
  membersCount: number;
  postsCount: number;
  isMember?: boolean;
  isPrivate?: boolean;
  locationDistrict?: string;
  createdAt: string;
}

export interface ToggleReactionResponseDto {
  isLiked: boolean;
  likesCount: number;
  userReaction?: ReactionType | null;
  reactionBreakdown: PostReactionBreakdownDto;
}









