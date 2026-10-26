import { randomUUID } from 'crypto';
import { AppDataSource } from '../database/data-source';
import { VerificationApplication, EngineerProfile, User, AuditLog } from '../database/entities';
import { UserService } from './user.service';
import {
  UserRole,
  VerificationStatus,
  VerificationApplicationDto,
  VerificationDocumentDto,
  ApplyVerificationDto,
  ReviewVerificationDto,
  AuditLogDto,
} from '@buildlink/shared';

// In-memory fallback storage for offline & test runs
interface InMemoryVerificationStore {
  application: VerificationApplication;
  documents: VerificationDocumentDto[];
  engineerName?: string;
  engineerEmail?: string;
  engineerTitle?: string;
}

const memoryApplications = new Map<string, InMemoryVerificationStore>();
const memoryAuditLogs: AuditLogDto[] = [];

export class VerificationService {
  private static parseDocuments(val: string | unknown): VerificationDocumentDto[] {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    try {
      const parsed = JSON.parse(val as string);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  public static async recordAuditLog(
    actorId: string | undefined,
    actorEmail: string | undefined,
    action: string,
    targetType: string,
    targetId: string,
    details: string,
    ipAddress?: string
  ): Promise<AuditLogDto> {
    const logId = randomUUID();
    const now = new Date();

    if (AppDataSource.isInitialized) {
      const repo = AppDataSource.getRepository(AuditLog);
      const entry = repo.create({
        id: logId,
        actorId,
        actorEmail,
        action,
        targetType,
        targetId,
        details,
        ipAddress,
      });
      await repo.save(entry);
    }

    const auditDto: AuditLogDto = {
      id: logId,
      actorId,
      actorEmail,
      action,
      targetType,
      targetId,
      details,
      ipAddress,
      createdAt: now.toISOString(),
    };

    memoryAuditLogs.unshift(auditDto);
    return auditDto;
  }

  public static async applyForVerification(
    userId: string,
    userEmail: string,
    dto: ApplyVerificationDto,
    actorIp?: string
  ): Promise<VerificationApplicationDto> {
    const user = await UserService.findById(userId);
    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }
    if (user.role !== UserRole.ENGINEER) {
      throw new Error('ONLY_ENGINEERS_CAN_APPLY');
    }

    const appId = randomUUID();
    const now = new Date();

    const documentsWithIds: VerificationDocumentDto[] = (dto.documents || []).map((doc) => ({
      id: randomUUID(),
      applicationId: appId,
      documentType: doc.documentType,
      fileUrl: doc.fileUrl,
      originalFilename: doc.originalFilename,
      fileSizeBytes: doc.fileSizeBytes,
      isVerified: false,
      createdAt: now.toISOString(),
    }));

    // Update engineer profile registration info
    await UserService.updateEngineerProfile(userId, {
      registrationBody: dto.registrationBody,
      registrationNumber: dto.registrationNumber,
    });

    const engineerProfile = user.engineerProfile;
    const engProfileId = engineerProfile?.id || randomUUID();

    if (AppDataSource.isInitialized) {
      const appRepo = AppDataSource.getRepository(VerificationApplication);
      const engRepo = AppDataSource.getRepository(EngineerProfile);

      const app = appRepo.create({
        id: appId,
        engineerProfileId: engProfileId,
        status: VerificationStatus.PENDING_REVIEW,
        reviewerNotes: dto.notes ? `Applicant cover note: ${dto.notes}` : undefined,
        submittedDocumentsJson: JSON.stringify(documentsWithIds),
      });

      await appRepo.save(app);

      // Update verification status on engineer profile
      await engRepo.update(engProfileId, {
        verificationStatus: VerificationStatus.PENDING_REVIEW,
        registrationBody: dto.registrationBody,
        registrationNumber: dto.registrationNumber,
      });
    }

    // Update in-memory engineer profile if offline
    if (engineerProfile) {
      engineerProfile.verificationStatus = VerificationStatus.PENDING_REVIEW;
      engineerProfile.registrationBody = dto.registrationBody;
      engineerProfile.registrationNumber = dto.registrationNumber;
    }

    const appObj: VerificationApplication = {
      id: appId,
      engineerProfileId: engProfileId,
      status: VerificationStatus.PENDING_REVIEW,
      reviewerNotes: dto.notes,
      submittedDocumentsJson: JSON.stringify(documentsWithIds),
      createdAt: now,
      updatedAt: now,
    } as VerificationApplication;

    memoryApplications.set(appId, {
      application: appObj,
      documents: documentsWithIds,
      engineerName: user.profile?.displayName || `${user.profile?.firstName} ${user.profile?.lastName}`,
      engineerEmail: user.email,
      engineerTitle: engineerProfile?.title,
    });

    // Record Audit Log
    await VerificationService.recordAuditLog(
      userId,
      userEmail,
      'VERIFICATION_APPLICATION_SUBMITTED',
      'VerificationApplication',
      appId,
      `Submitted application with ${documentsWithIds.length} credential document(s) for ${dto.registrationBody} (${dto.registrationNumber})`,
      actorIp
    );

    return {
      id: appId,
      engineerProfileId: engProfileId,
      engineerName: user.profile?.displayName || `${user.profile?.firstName} ${user.profile?.lastName}`,
      engineerEmail: user.email,
      engineerTitle: engineerProfile?.title,
      registrationBody: dto.registrationBody,
      registrationNumber: dto.registrationNumber,
      status: VerificationStatus.PENDING_REVIEW,
      submissionDate: now.toISOString(),
      reviewerNotes: dto.notes,
      documents: documentsWithIds,
    };
  }

  public static async getMyVerificationStatus(
    userId: string
  ): Promise<VerificationApplicationDto | null> {
    const user = await UserService.findById(userId);
    if (!user || user.role !== UserRole.ENGINEER) {
      return null;
    }

    const engProfileId = user.engineerProfile?.id;
    if (!engProfileId) return null;

    if (AppDataSource.isInitialized) {
      const appRepo = AppDataSource.getRepository(VerificationApplication);
      const app = await appRepo.findOne({
        where: { engineerProfileId: engProfileId },
        order: { createdAt: 'DESC' },
      });

      if (!app) return null;

      return {
        id: app.id,
        engineerProfileId: app.engineerProfileId,
        engineerName: user.profile?.displayName || `${user.profile?.firstName} ${user.profile?.lastName}`,
        engineerEmail: user.email,
        engineerTitle: user.engineerProfile?.title,
        registrationBody: user.engineerProfile?.registrationBody,
        registrationNumber: user.engineerProfile?.registrationNumber,
        status: app.status,
        submissionDate: app.createdAt.toISOString(),
        reviewerNotes: app.reviewerNotes,
        reviewedBy: app.reviewedBy,
        reviewedAt: app.reviewedAt?.toISOString(),
        documents: VerificationService.parseDocuments(app.submittedDocumentsJson),
      };
    }

    // In-memory fallback: Find latest application by engineerProfileId
    for (const record of memoryApplications.values()) {
      if (record.application.engineerProfileId === engProfileId) {
        return {
          id: record.application.id,
          engineerProfileId: record.application.engineerProfileId,
          engineerName: record.engineerName,
          engineerEmail: record.engineerEmail,
          engineerTitle: record.engineerTitle,
          registrationBody: user.engineerProfile?.registrationBody,
          registrationNumber: user.engineerProfile?.registrationNumber,
          status: record.application.status,
          submissionDate: record.application.createdAt.toISOString(),
          reviewerNotes: record.application.reviewerNotes,
          reviewedBy: record.application.reviewedBy,
          reviewedAt: record.application.reviewedAt?.toISOString(),
          documents: record.documents,
        };
      }
    }

    return null;
  }

  public static async listApplications(
    statusFilter?: VerificationStatus
  ): Promise<VerificationApplicationDto[]> {
    if (AppDataSource.isInitialized) {
      const appRepo = AppDataSource.getRepository(VerificationApplication);
      const whereClause = statusFilter ? { status: statusFilter } : {};
      const apps = await appRepo.find({
        where: whereClause,
        order: { createdAt: 'DESC' },
        relations: ['engineerProfile', 'engineerProfile.user', 'engineerProfile.user.profile'],
      });

      return apps.map((app) => {
        const eng = app.engineerProfile;
        const u = eng?.user;
        const prof = u?.profile;

        return {
          id: app.id,
          engineerProfileId: app.engineerProfileId,
          engineerName: prof?.displayName || `${prof?.firstName || ''} ${prof?.lastName || ''}`.trim() || 'Engineer',
          engineerEmail: u?.email,
          engineerTitle: eng?.title,
          registrationBody: eng?.registrationBody,
          registrationNumber: eng?.registrationNumber,
          status: app.status,
          submissionDate: app.createdAt.toISOString(),
          reviewerNotes: app.reviewerNotes,
          reviewedBy: app.reviewedBy,
          reviewedAt: app.reviewedAt?.toISOString(),
          documents: VerificationService.parseDocuments(app.submittedDocumentsJson),
        };
      });
    }

    const results: VerificationApplicationDto[] = [];
    for (const rec of memoryApplications.values()) {
      if (!statusFilter || rec.application.status === statusFilter) {
        results.push({
          id: rec.application.id,
          engineerProfileId: rec.application.engineerProfileId,
          engineerName: rec.engineerName,
          engineerEmail: rec.engineerEmail,
          engineerTitle: rec.engineerTitle,
          status: rec.application.status,
          submissionDate: rec.application.createdAt.toISOString(),
          reviewerNotes: rec.application.reviewerNotes,
          reviewedBy: rec.application.reviewedBy,
          reviewedAt: rec.application.reviewedAt?.toISOString(),
          documents: rec.documents,
        });
      }
    }

    return results;
  }

  public static async reviewApplication(
    applicationId: string,
    adminUserId: string,
    adminEmail: string,
    dto: ReviewVerificationDto,
    actorIp?: string
  ): Promise<VerificationApplicationDto> {
    const now = new Date();

    if (AppDataSource.isInitialized) {
      const appRepo = AppDataSource.getRepository(VerificationApplication);
      const engRepo = AppDataSource.getRepository(EngineerProfile);

      const app = await appRepo.findOne({
        where: { id: applicationId },
        relations: ['engineerProfile', 'engineerProfile.user', 'engineerProfile.user.profile'],
      });

      if (!app) throw new Error('APPLICATION_NOT_FOUND');

      app.status = dto.status;
      app.reviewerNotes = dto.reviewerNotes;
      app.reviewedBy = adminUserId;
      app.reviewedAt = now;
      await appRepo.save(app);

      // Update engineer profile status
      await engRepo.update(app.engineerProfileId, {
        verificationStatus: dto.status,
      });

      await VerificationService.recordAuditLog(
        adminUserId,
        adminEmail,
        'VERIFICATION_APPLICATION_REVIEWED',
        'VerificationApplication',
        applicationId,
        `Audited application status updated to '${dto.status}'. Notes: ${dto.reviewerNotes}`,
        actorIp
      );

      const eng = app.engineerProfile;
      const u = eng?.user;
      const prof = u?.profile;

      return {
        id: app.id,
        engineerProfileId: app.engineerProfileId,
        engineerName: prof?.displayName || `${prof?.firstName || ''} ${prof?.lastName || ''}`.trim(),
        engineerEmail: u?.email,
        engineerTitle: eng?.title,
        registrationBody: eng?.registrationBody,
        registrationNumber: eng?.registrationNumber,
        status: app.status,
        submissionDate: app.createdAt.toISOString(),
        reviewerNotes: app.reviewerNotes,
        reviewedBy: app.reviewedBy,
        reviewedAt: app.reviewedAt?.toISOString(),
        documents: VerificationService.parseDocuments(app.submittedDocumentsJson),
      };
    }

    const rec = memoryApplications.get(applicationId);
    if (!rec) throw new Error('APPLICATION_NOT_FOUND');

    rec.application.status = dto.status;
    rec.application.reviewerNotes = dto.reviewerNotes;
    rec.application.reviewedBy = adminUserId;
    rec.application.reviewedAt = now;
    rec.application.updatedAt = now;

    // Update in-memory engineer status
    for (const u of (await UserService.findByEmail(rec.engineerEmail || '')) ? [await UserService.findByEmail(rec.engineerEmail || '')] : []) {
      if (u && u.engineerProfile) {
        u.engineerProfile.verificationStatus = dto.status;
      }
    }

    await VerificationService.recordAuditLog(
      adminUserId,
      adminEmail,
      'VERIFICATION_APPLICATION_REVIEWED',
      'VerificationApplication',
      applicationId,
      `Audited application status updated to '${dto.status}'. Notes: ${dto.reviewerNotes}`,
      actorIp
    );

    return {
      id: rec.application.id,
      engineerProfileId: rec.application.engineerProfileId,
      engineerName: rec.engineerName,
      engineerEmail: rec.engineerEmail,
      engineerTitle: rec.engineerTitle,
      status: rec.application.status,
      submissionDate: rec.application.createdAt.toISOString(),
      reviewerNotes: rec.application.reviewerNotes,
      reviewedBy: rec.application.reviewedBy,
      reviewedAt: rec.application.reviewedAt?.toISOString(),
      documents: rec.documents,
    };
  }

  public static async getAuditLogs(limit = 50): Promise<AuditLogDto[]> {
    if (AppDataSource.isInitialized) {
      const repo = AppDataSource.getRepository(AuditLog);
      const entries = await repo.find({
        order: { createdAt: 'DESC' },
        take: limit,
      });

      return entries.map((e) => ({
        id: e.id,
        actorId: e.actorId,
        actorEmail: e.actorEmail,
        action: e.action,
        targetType: e.targetType,
        targetId: e.targetId,
        details: e.details,
        ipAddress: e.ipAddress,
        createdAt: e.createdAt.toISOString(),
      }));
    }

    return memoryAuditLogs.slice(0, limit);
  }

  public static clearMemoryForTesting(): void {
    memoryApplications.clear();
    memoryAuditLogs.length = 0;
  }
}
