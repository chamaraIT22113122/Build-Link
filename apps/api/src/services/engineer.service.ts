import { randomUUID } from 'crypto';
import { AppDataSource } from '../database/data-source';
import { User, EngineerProfile, Consultation, UserProfile, ConsultationMessage, EngineerReview } from '../database/entities';
import { UserService } from './user.service';
import {
  VerificationStatus,
  ConsultationStatus,
  ConsultationType,
  EngineerDirectoryItemDto,
  EngineerDirectoryQueryDto,
  ConsultationDto,
  CreateConsultationDto,
  ConsultationMessageDto,
  EngineerReviewDto,
} from '@buildlink/shared';

// In-memory consultations store for testing / offline
const memoryConsultations = new Map<string, Consultation>();
const memoryMessages = new Map<string, ConsultationMessage>();
const memoryReviews = new Map<string, EngineerReview>();

export class EngineerService {
  private static parseSpecializations(val: string | unknown): string[] {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    try {
      const parsed = JSON.parse(val as string);
      return Array.isArray(parsed) ? parsed : [String(parsed)];
    } catch {
      return [String(val)];
    }
  }

  private static toDirectoryItem(
    eng: EngineerProfile,
    user?: User,
    profile?: UserProfile
  ): EngineerDirectoryItemDto {
    const usr = user || eng.user;
    const prof = profile || usr?.profile;
    const isVerified = eng.verificationStatus === VerificationStatus.VERIFIED;
    const firstName = prof?.firstName || '';
    const lastName = prof?.lastName || '';
    const displayName = prof?.displayName || (firstName || lastName ? `${firstName} ${lastName}`.trim() : 'Registered Engineer');

    return {
      id: eng.id,
      userId: eng.userId,
      displayName,
      title: eng.title || 'Professional Engineer',
      specializations: EngineerService.parseSpecializations(eng.specializations),
      yearsOfExperience: eng.yearsOfExperience || 0,
      verificationStatus: eng.verificationStatus || VerificationStatus.NOT_SUBMITTED,
      isVerified,
      city: prof?.city,
      district: prof?.district,
      avatarUrl: prof?.avatarUrl,
      bio: prof?.bio,
      consultationFee: Number(eng.consultationFee || 0),
      availableForConsultation: Boolean(eng.availableForConsultation),
      ratingAverage: Number(eng.ratingAverage || 0),
      ratingCount: Number(eng.ratingCount || 0),
      registrationBody: eng.registrationBody,
      registrationNumber: eng.registrationNumber,
    };
  }

  public static async listEngineers(
    query: EngineerDirectoryQueryDto = {}
  ): Promise<{ data: EngineerDirectoryItemDto[]; total: number; page: number; limit: number }> {
    const {
      search,
      specialization,
      district,
      verifiedOnly,
      sortBy = 'rating',
      sortOrder = 'DESC',
      page = 1,
      limit = 20,
    } = query;

    if (AppDataSource.isInitialized) {
      const engRepo = AppDataSource.getRepository(EngineerProfile);
      const qb = engRepo
        .createQueryBuilder('eng')
        .leftJoinAndSelect('eng.user', 'user')
        .leftJoinAndSelect('user.profile', 'profile');

      if (verifiedOnly) {
        qb.andWhere('eng.verificationStatus = :verified', {
          verified: VerificationStatus.VERIFIED,
        });
      }

      if (specialization) {
        qb.andWhere('eng.specializations LIKE :spec', {
          spec: `%${specialization}%`,
        });
      }

      if (district) {
        qb.andWhere('profile.district = :dist', { dist: district });
      }

      if (search) {
        qb.andWhere(
          '(eng.title LIKE :s OR profile.displayName LIKE :s OR profile.firstName LIKE :s OR profile.lastName LIKE :s OR profile.city LIKE :s OR eng.specializations LIKE :s)',
          { s: `%${search}%` }
        );
      }

      if (sortBy === 'rating') {
        qb.orderBy('eng.ratingAverage', sortOrder);
      } else if (sortBy === 'experience') {
        qb.orderBy('eng.yearsOfExperience', sortOrder);
      } else if (sortBy === 'fee') {
        qb.orderBy('eng.consultationFee', sortOrder);
      } else {
        qb.orderBy('eng.createdAt', 'DESC');
      }

      const total = await qb.getCount();
      const items = await qb
        .skip((page - 1) * limit)
        .take(limit)
        .getMany();

      return {
        data: items.map((item) => EngineerService.toDirectoryItem(item)),
        total,
        page,
        limit,
      };
    }

    // In-Memory Fallback
    const memory = UserService.getMemoryStore();
    let engineers: EngineerProfile[] = [];

    for (const record of memory.values()) {
      if (record.engineerProfile) {
        record.engineerProfile.user = record.user;
        if (record.profile) {
          record.user.profile = record.profile;
        }
        engineers.push(record.engineerProfile);
      }
    }

    if (verifiedOnly) {
      engineers = engineers.filter(
        (e) => e.verificationStatus === VerificationStatus.VERIFIED
      );
    }

    if (specialization) {
      engineers = engineers.filter((e) => {
        const specs = EngineerService.parseSpecializations(e.specializations);
        return specs.some((s) => s.toLowerCase().includes(specialization.toLowerCase()));
      });
    }

    if (district) {
      engineers = engineers.filter((e) => {
        const prof = e.user?.profile;
        return prof?.district?.toLowerCase() === district.toLowerCase();
      });
    }

    if (search) {
      const s = search.toLowerCase();
      engineers = engineers.filter((e) => {
        const prof = e.user?.profile;
        const name = `${prof?.firstName || ''} ${prof?.lastName || ''} ${prof?.displayName || ''}`.toLowerCase();
        const title = (e.title || '').toLowerCase();
        const city = (prof?.city || '').toLowerCase();
        const specs = EngineerService.parseSpecializations(e.specializations).join(' ').toLowerCase();
        return name.includes(s) || title.includes(s) || city.includes(s) || specs.includes(s);
      });
    }

    // Sort
    engineers.sort((a, b) => {
      let diff = 0;
      if (sortBy === 'rating') {
        diff = Number(b.ratingAverage || 0) - Number(a.ratingAverage || 0);
      } else if (sortBy === 'experience') {
        diff = (b.yearsOfExperience || 0) - (a.yearsOfExperience || 0);
      } else if (sortBy === 'fee') {
        diff = Number(b.consultationFee || 0) - Number(a.consultationFee || 0);
      }
      return sortOrder === 'ASC' ? -diff : diff;
    });

    const total = engineers.length;
    const startIndex = (page - 1) * limit;
    const paginated = engineers.slice(startIndex, startIndex + limit);

    return {
      data: paginated.map((eng) => EngineerService.toDirectoryItem(eng, eng.user, eng.user?.profile)),
      total,
      page,
      limit,
    };
  }

  public static async getEngineerById(idOrUserId: string): Promise<EngineerDirectoryItemDto | null> {
    if (AppDataSource.isInitialized) {
      const engRepo = AppDataSource.getRepository(EngineerProfile);
      const eng = await engRepo
        .createQueryBuilder('eng')
        .leftJoinAndSelect('eng.user', 'user')
        .leftJoinAndSelect('user.profile', 'profile')
        .where('eng.id = :id OR eng.userId = :id', { id: idOrUserId })
        .getOne();

      return eng ? EngineerService.toDirectoryItem(eng) : null;
    }

    // In-memory
    const memory = UserService.getMemoryStore();
    for (const record of memory.values()) {
      if (
        record.engineerProfile &&
        (record.engineerProfile.id === idOrUserId || record.engineerProfile.userId === idOrUserId)
      ) {
        return EngineerService.toDirectoryItem(
          record.engineerProfile,
          record.user,
          record.profile
        );
      }
    }

    return null;
  }

  public static async requestConsultation(
    clientId: string,
    dto: CreateConsultationDto
  ): Promise<ConsultationDto> {
    const engineer = await EngineerService.getEngineerById(dto.engineerId);
    if (!engineer) {
      throw new Error('ENGINEER_NOT_FOUND');
    }

    const scheduledDate = dto.scheduledAt ? new Date(dto.scheduledAt) : undefined;
    const attachmentsJson = dto.attachments ? JSON.stringify(dto.attachments) : undefined;

    if (AppDataSource.isInitialized) {
      const consRepo = AppDataSource.getRepository(Consultation);
      const consultation = consRepo.create({
        clientId,
        engineerId: engineer.id,
        consultationType: dto.consultationType || ConsultationType.TEXT,
        status: ConsultationStatus.REQUESTED,
        scheduledAt: scheduledDate,
        problemDescription: dto.problemDescription,
        attachmentsJson,
      });

      const saved = await consRepo.save(consultation);
      return {
        id: saved.id,
        clientId: saved.clientId,
        engineerId: saved.engineerId,
        consultationType: saved.consultationType,
        status: saved.status,
        scheduledAt: saved.scheduledAt?.toISOString(),
        problemDescription: saved.problemDescription,
        attachments: dto.attachments || [],
        createdAt: saved.createdAt.toISOString(),
        updatedAt: saved.updatedAt.toISOString(),
      };
    }

    // In-memory
    const clientUser = await UserService.findById(clientId);
    const id = randomUUID();
    const now = new Date();

    const inMemoryConsultation = {
      id,
      clientId,
      engineerId: engineer.id,
      consultationType: dto.consultationType || ConsultationType.TEXT,
      status: ConsultationStatus.REQUESTED,
      scheduledAt: scheduledDate,
      problemDescription: dto.problemDescription,
      attachmentsJson,
      createdAt: now,
      updatedAt: now,
    } as unknown as Consultation;

    memoryConsultations.set(id, inMemoryConsultation);

    return {
      id,
      clientId,
      clientName: clientUser?.profile?.displayName || clientUser?.email,
      clientEmail: clientUser?.email,
      engineerId: engineer.id,
      engineerName: engineer.displayName,
      engineerTitle: engineer.title,
      consultationType: inMemoryConsultation.consultationType,
      status: inMemoryConsultation.status,
      scheduledAt: scheduledDate?.toISOString(),
      problemDescription: inMemoryConsultation.problemDescription,
      attachments: dto.attachments || [],
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
  }

  public static async listUserConsultations(userId: string): Promise<ConsultationDto[]> {
    if (AppDataSource.isInitialized) {
      const consRepo = AppDataSource.getRepository(Consultation);
      const items = await consRepo
        .createQueryBuilder('c')
        .leftJoinAndSelect('c.client', 'client')
        .leftJoinAndSelect('client.profile', 'clientProfile')
        .leftJoinAndSelect('c.engineer', 'engineer')
        .leftJoinAndSelect('engineer.user', 'engineerUser')
        .leftJoinAndSelect('engineerUser.profile', 'engProfile')
        .where('c.clientId = :userId OR engineer.userId = :userId', { userId })
        .orderBy('c.createdAt', 'DESC')
        .getMany();

      return items.map((c) => ({
        id: c.id,
        clientId: c.clientId,
        clientName: c.client?.profile?.displayName,
        clientEmail: c.client?.email,
        engineerId: c.engineerId,
        engineerName: c.engineer?.user?.profile?.displayName,
        engineerTitle: c.engineer?.title,
        consultationType: c.consultationType,
        status: c.status,
        scheduledAt: c.scheduledAt?.toISOString(),
        problemDescription: c.problemDescription,
        attachments: c.attachmentsJson ? JSON.parse(c.attachmentsJson) : [],
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      }));
    }

    // In-memory
    const results: ConsultationDto[] = [];
    const memory = UserService.getMemoryStore();
    const userRecord = memory.get(userId);
    const userEngineerId = userRecord?.engineerProfile?.id;

    for (const c of memoryConsultations.values()) {
      if (c.clientId === userId || c.engineerId === userEngineerId) {
        const clientUser = await UserService.findById(c.clientId);
        const engineer = await EngineerService.getEngineerById(c.engineerId);

        results.push({
          id: c.id,
          clientId: c.clientId,
          clientName: clientUser?.profile?.displayName || clientUser?.email,
          clientEmail: clientUser?.email,
          engineerId: c.engineerId,
          engineerName: engineer?.displayName,
          engineerTitle: engineer?.title,
          consultationType: c.consultationType,
          status: c.status,
          scheduledAt: c.scheduledAt ? new Date(c.scheduledAt).toISOString() : undefined,
          problemDescription: c.problemDescription,
          attachments: c.attachmentsJson ? JSON.parse(c.attachmentsJson) : [],
          createdAt: new Date(c.createdAt).toISOString(),
          updatedAt: new Date(c.updatedAt).toISOString(),
        });
      }
    }

    return results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public static async updateConsultationStatus(
    userId: string,
    consultationId: string,
    status: ConsultationStatus
  ): Promise<ConsultationDto> {
    if (AppDataSource.isInitialized) {
      const consRepo = AppDataSource.getRepository(Consultation);
      const c = await consRepo
        .createQueryBuilder('c')
        .leftJoinAndSelect('c.engineer', 'engineer')
        .where('c.id = :id', { id: consultationId })
        .getOne();

      if (!c) {
        throw new Error('CONSULTATION_NOT_FOUND');
      }

      if (c.clientId !== userId && c.engineer?.userId !== userId) {
        throw new Error('FORBIDDEN');
      }

      c.status = status;
      c.updatedAt = new Date();
      await consRepo.save(c);

      return {
        id: c.id,
        clientId: c.clientId,
        engineerId: c.engineerId,
        consultationType: c.consultationType,
        status: c.status,
        scheduledAt: c.scheduledAt?.toISOString(),
        problemDescription: c.problemDescription,
        attachments: c.attachmentsJson ? JSON.parse(c.attachmentsJson) : [],
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      };
    }

    // In-memory
    const c = memoryConsultations.get(consultationId);
    if (!c) {
      throw new Error('CONSULTATION_NOT_FOUND');
    }

    const memory = UserService.getMemoryStore();
    const userRecord = memory.get(userId);
    const userEngineerId = userRecord?.engineerProfile?.id;

    if (c.clientId !== userId && c.engineerId !== userEngineerId) {
      throw new Error('FORBIDDEN');
    }

    c.status = status;
    c.updatedAt = new Date();

    const clientUser = await UserService.findById(c.clientId);
    const engineer = await EngineerService.getEngineerById(c.engineerId);

    return {
      id: c.id,
      clientId: c.clientId,
      clientName: clientUser?.profile?.displayName || clientUser?.email,
      clientEmail: clientUser?.email,
      engineerId: c.engineerId,
      engineerName: engineer?.displayName,
      engineerTitle: engineer?.title,
      consultationType: c.consultationType,
      status: c.status,
      scheduledAt: c.scheduledAt ? new Date(c.scheduledAt).toISOString() : undefined,
      problemDescription: c.problemDescription,
      attachments: c.attachmentsJson ? JSON.parse(c.attachmentsJson) : [],
      createdAt: new Date(c.createdAt).toISOString(),
      updatedAt: new Date(c.updatedAt).toISOString(),
    };
  }

  // Phase 9: In-App Consultation Messaging
  public static async addConsultationMessage(
    senderId: string,
    consultationId: string,
    content: string,
    attachments?: string[]
  ): Promise<ConsultationMessageDto> {
    const sender = await UserService.findById(senderId);
    if (!sender) throw new Error('USER_NOT_FOUND');

    const attachmentsJson = attachments ? JSON.stringify(attachments) : undefined;

    if (AppDataSource.isInitialized) {
      const msgRepo = AppDataSource.getRepository(ConsultationMessage);
      const msg = msgRepo.create({
        consultationId,
        senderId,
        content,
        attachmentsJson,
        isRead: false,
      });
      const saved = await msgRepo.save(msg);
      return {
        id: saved.id,
        consultationId: saved.consultationId,
        senderId: saved.senderId,
        senderName: sender.profile?.displayName || sender.email,
        senderRole: sender.role,
        content: saved.content,
        attachments: attachments || [],
        isRead: false,
        createdAt: saved.createdAt.toISOString(),
      };
    }

    // In-memory
    const id = randomUUID();
    const now = new Date();
    const inMem = {
      id,
      consultationId,
      senderId,
      content,
      attachmentsJson,
      isRead: false,
      createdAt: now,
      updatedAt: now,
    } as unknown as ConsultationMessage;

    memoryMessages.set(id, inMem);

    return {
      id,
      consultationId,
      senderId,
      senderName: sender.profile?.displayName || sender.email,
      senderRole: sender.role,
      content,
      attachments: attachments || [],
      isRead: false,
      createdAt: now.toISOString(),
    };
  }

  public static async listConsultationMessages(
    userId: string,
    consultationId: string
  ): Promise<ConsultationMessageDto[]> {
    if (AppDataSource.isInitialized) {
      const msgRepo = AppDataSource.getRepository(ConsultationMessage);
      const messages = await msgRepo
        .createQueryBuilder('m')
        .leftJoinAndSelect('m.sender', 'sender')
        .leftJoinAndSelect('sender.profile', 'profile')
        .where('m.consultationId = :cid', { cid: consultationId })
        .orderBy('m.createdAt', 'ASC')
        .getMany();

      return messages.map((m) => ({
        id: m.id,
        consultationId: m.consultationId,
        senderId: m.senderId,
        senderName: m.sender?.profile?.displayName || m.sender?.email,
        senderRole: m.sender?.role,
        content: m.content,
        attachments: m.attachmentsJson ? JSON.parse(m.attachmentsJson) : [],
        isRead: m.isRead,
        createdAt: m.createdAt.toISOString(),
      }));
    }

    // In-memory
    const results: ConsultationMessageDto[] = [];
    for (const m of memoryMessages.values()) {
      if (m.consultationId === consultationId) {
        const sender = await UserService.findById(m.senderId);
        results.push({
          id: m.id,
          consultationId: m.consultationId,
          senderId: m.senderId,
          senderName: sender?.profile?.displayName || sender?.email,
          senderRole: sender?.role,
          content: m.content,
          attachments: m.attachmentsJson ? JSON.parse(m.attachmentsJson) : [],
          isRead: m.isRead,
          createdAt: new Date(m.createdAt).toISOString(),
        });
      }
    }

    return results.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  // Phase 9: Verified Engineer Reviews & Ratings
  public static async addEngineerReview(
    clientId: string,
    engineerProfileId: string,
    rating: number,
    reviewText: string,
    consultationId?: string
  ): Promise<EngineerReviewDto> {
    if (rating < 1 || rating > 5) {
      throw new Error('INVALID_RATING');
    }

    const client = await UserService.findById(clientId);
    if (!client) throw new Error('CLIENT_NOT_FOUND');

    const engineer = await EngineerService.getEngineerById(engineerProfileId);
    if (!engineer) throw new Error('ENGINEER_NOT_FOUND');

    if (AppDataSource.isInitialized) {
      const revRepo = AppDataSource.getRepository(EngineerReview);
      const engRepo = AppDataSource.getRepository(EngineerProfile);

      const review = revRepo.create({
        engineerProfileId: engineer.id,
        clientId,
        consultationId,
        rating,
        reviewText,
        isVerifiedClient: true,
      });

      const saved = await revRepo.save(review);

      // Recalculate average rating
      const reviews = await revRepo.find({ where: { engineerProfileId: engineer.id } });
      const totalScore = reviews.reduce((sum, r) => sum + r.rating, 0);
      const average = Number((totalScore / reviews.length).toFixed(1));

      await engRepo.update(engineer.id, {
        ratingAverage: average,
        ratingCount: reviews.length,
      });

      return {
        id: saved.id,
        engineerProfileId: saved.engineerProfileId,
        clientId: saved.clientId,
        clientName: client.profile?.displayName || client.email,
        rating: saved.rating,
        reviewText: saved.reviewText,
        isVerifiedClient: true,
        createdAt: saved.createdAt.toISOString(),
      };
    }

    // In-memory
    const id = randomUUID();
    const now = new Date();
    const rev = {
      id,
      engineerProfileId: engineer.id,
      clientId,
      consultationId,
      rating,
      reviewText,
      isVerifiedClient: true,
      createdAt: now,
      updatedAt: now,
    } as unknown as EngineerReview;

    memoryReviews.set(id, rev);

    // Update in-memory engineer profile rating
    const memory = UserService.getMemoryStore();
    const engRecord = memory.get(engineer.userId);
    if (engRecord && engRecord.engineerProfile) {
      const engReviews = Array.from(memoryReviews.values()).filter(
        (r) => r.engineerProfileId === engineer.id
      );
      const totalScore = engReviews.reduce((sum, r) => sum + r.rating, 0);
      engRecord.engineerProfile.ratingCount = engReviews.length;
      engRecord.engineerProfile.ratingAverage = Number((totalScore / engReviews.length).toFixed(1));
    }

    return {
      id,
      engineerProfileId: engineer.id,
      clientId,
      clientName: client.profile?.displayName || client.email,
      rating,
      reviewText,
      isVerifiedClient: true,
      createdAt: now.toISOString(),
    };
  }

  public static async listEngineerReviews(engineerProfileId: string): Promise<EngineerReviewDto[]> {
    const engineer = await EngineerService.getEngineerById(engineerProfileId);
    if (!engineer) throw new Error('ENGINEER_NOT_FOUND');

    if (AppDataSource.isInitialized) {
      const revRepo = AppDataSource.getRepository(EngineerReview);
      const reviews = await revRepo
        .createQueryBuilder('r')
        .leftJoinAndSelect('r.client', 'client')
        .leftJoinAndSelect('client.profile', 'profile')
        .where('r.engineerProfileId = :eid', { eid: engineer.id })
        .orderBy('r.createdAt', 'DESC')
        .getMany();

      return reviews.map((r) => ({
        id: r.id,
        engineerProfileId: r.engineerProfileId,
        clientId: r.clientId,
        clientName: r.client?.profile?.displayName || r.client?.email,
        rating: r.rating,
        reviewText: r.reviewText,
        isVerifiedClient: r.isVerifiedClient,
        createdAt: r.createdAt.toISOString(),
      }));
    }

    // In-memory
    const results: EngineerReviewDto[] = [];
    for (const r of memoryReviews.values()) {
      if (r.engineerProfileId === engineer.id) {
        const client = await UserService.findById(r.clientId);
        results.push({
          id: r.id,
          engineerProfileId: r.engineerProfileId,
          clientId: r.clientId,
          clientName: client?.profile?.displayName || client?.email,
          rating: r.rating,
          reviewText: r.reviewText,
          isVerifiedClient: r.isVerifiedClient,
          createdAt: new Date(r.createdAt).toISOString(),
        });
      }
    }

    return results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public static clearMemoryForTesting(): void {
    memoryConsultations.clear();
    memoryMessages.clear();
    memoryReviews.clear();
  }
}

