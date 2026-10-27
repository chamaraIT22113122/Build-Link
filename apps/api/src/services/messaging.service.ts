import { randomUUID } from 'crypto';
import { AppDataSource } from '../database/data-source';
import { DirectMessage, UserConnection, User, EngineerProfile } from '../database/entities';
import { UserService } from './user.service';
import {
  UserRole,
  VerificationStatus,
  DirectMessageDto,
  ConversationSummaryDto,
  UserConnectionDto,
} from '@buildlink/shared';

// In-memory resilient stores for offline and testing
interface InMemoryDirectMessage {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  attachments: string[];
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface InMemoryConnection {
  id: string;
  userId: string;
  connectedUserId: string;
  status: string;
  createdAt: Date;
}

const memoryMessages = new Map<string, InMemoryDirectMessage>();
const memoryConnections = new Map<string, InMemoryConnection>();

export class MessagingService {
  /**
   * Send a private direct message (Free messaging like Messenger)
   */
  public static async sendMessage(
    senderId: string,
    recipientId: string,
    content: string,
    attachments?: string[]
  ): Promise<DirectMessageDto> {
    if (!content || !content.trim()) {
      throw new Error('CONTENT_REQUIRED');
    }
    if (senderId === recipientId) {
      throw new Error('CANNOT_MESSAGE_SELF');
    }

    const sender = await UserService.findById(senderId);
    if (!sender) throw new Error('SENDER_NOT_FOUND');

    const recipient = await UserService.findById(recipientId);
    if (!recipient) throw new Error('RECIPIENT_NOT_FOUND');

    const cleanContent = content.trim();
    const cleanAttachments = attachments || [];
    const attachmentsJson = cleanAttachments.length > 0 ? JSON.stringify(cleanAttachments) : undefined;
    const now = new Date();

    // Auto-connect sender and recipient if not yet connected
    await MessagingService.ensureConnected(senderId, recipientId);

    if (AppDataSource.isInitialized) {
      const msgRepo = AppDataSource.getRepository(DirectMessage);
      const msg = msgRepo.create({
        id: randomUUID(),
        senderId,
        recipientId,
        content: cleanContent,
        attachmentsJson,
        isRead: false,
      });

      const saved = await msgRepo.save(msg);
      return {
        id: saved.id,
        senderId: saved.senderId,
        senderName: sender.profile?.displayName || sender.email,
        senderAvatar: sender.profile?.avatarUrl,
        senderRole: sender.role,
        recipientId: saved.recipientId,
        recipientName: recipient.profile?.displayName || recipient.email,
        content: saved.content,
        attachments: cleanAttachments,
        isRead: saved.isRead,
        createdAt: saved.createdAt.toISOString(),
      };
    }

    // In-memory fallback
    const id = randomUUID();
    const inMem: InMemoryDirectMessage = {
      id,
      senderId,
      recipientId,
      content: cleanContent,
      attachments: cleanAttachments,
      isRead: false,
      createdAt: now,
      updatedAt: now,
    };
    memoryMessages.set(id, inMem);

    return {
      id,
      senderId,
      senderName: sender.profile?.displayName || sender.email,
      senderAvatar: sender.profile?.avatarUrl,
      senderRole: sender.role,
      recipientId,
      recipientName: recipient.profile?.displayName || recipient.email,
      content: cleanContent,
      attachments: cleanAttachments,
      isRead: false,
      createdAt: now.toISOString(),
    };
  }

  /**
   * Get direct message thread between two users
   */
  public static async getThread(
    userId: string,
    otherUserId: string
  ): Promise<DirectMessageDto[]> {
    const user = await UserService.findById(userId);
    const other = await UserService.findById(otherUserId);
    if (!other) throw new Error('USER_NOT_FOUND');

    if (AppDataSource.isInitialized) {
      const msgRepo = AppDataSource.getRepository(DirectMessage);
      const messages = await msgRepo
        .createQueryBuilder('m')
        .leftJoinAndSelect('m.sender', 'sender')
        .leftJoinAndSelect('sender.profile', 'senderProfile')
        .leftJoinAndSelect('m.recipient', 'recipient')
        .leftJoinAndSelect('recipient.profile', 'recipientProfile')
        .where(
          '((m.senderId = :u AND m.recipientId = :o) OR (m.senderId = :o AND m.recipientId = :u))',
          { u: userId, o: otherUserId }
        )
        .orderBy('m.createdAt', 'ASC')
        .getMany();

      // Mark incoming unread messages as read
      await msgRepo
        .createQueryBuilder()
        .update(DirectMessage)
        .set({ isRead: true })
        .where('senderId = :o AND recipientId = :u AND isRead = 0', {
          o: otherUserId,
          u: userId,
        })
        .execute();

      return messages.map((m) => ({
        id: m.id,
        senderId: m.senderId,
        senderName: m.sender?.profile?.displayName || m.sender?.email,
        senderAvatar: m.sender?.profile?.avatarUrl,
        senderRole: m.sender?.role,
        recipientId: m.recipientId,
        recipientName: m.recipient?.profile?.displayName || m.recipient?.email,
        content: m.content,
        attachments: m.attachmentsJson ? JSON.parse(m.attachmentsJson) : [],
        isRead: m.isRead,
        createdAt: m.createdAt.toISOString(),
      }));
    }

    // In-memory fallback
    const thread: DirectMessageDto[] = [];
    for (const m of memoryMessages.values()) {
      const match =
        (m.senderId === userId && m.recipientId === otherUserId) ||
        (m.senderId === otherUserId && m.recipientId === userId);

      if (match) {
        if (m.recipientId === userId) {
          m.isRead = true;
        }
        const s = m.senderId === userId ? user : other;
        const r = m.recipientId === userId ? user : other;

        thread.push({
          id: m.id,
          senderId: m.senderId,
          senderName: s?.profile?.displayName || s?.email || 'User',
          senderAvatar: s?.profile?.avatarUrl,
          senderRole: s?.role,
          recipientId: m.recipientId,
          recipientName: r?.profile?.displayName || r?.email || 'User',
          content: m.content,
          attachments: m.attachments,
          isRead: m.isRead,
          createdAt: m.createdAt.toISOString(),
        });
      }
    }

    return thread.sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }

  /**
   * Get all conversation summaries for current user (Like Messenger inbox)
   */
  public static async getConversations(
    userId: string
  ): Promise<ConversationSummaryDto[]> {
    const partnerIds = new Set<string>();

    if (AppDataSource.isInitialized) {
      const msgRepo = AppDataSource.getRepository(DirectMessage);
      const messages = await msgRepo
        .createQueryBuilder('m')
        .where('m.senderId = :u OR m.recipientId = :u', { u: userId })
        .orderBy('m.createdAt', 'DESC')
        .getMany();

      for (const m of messages) {
        const partner = m.senderId === userId ? m.recipientId : m.senderId;
        partnerIds.add(partner);
      }
    } else {
      for (const m of memoryMessages.values()) {
        if (m.senderId === userId || m.recipientId === userId) {
          const partner = m.senderId === userId ? m.recipientId : m.senderId;
          partnerIds.add(partner);
        }
      }
    }

    // Also include connected users who haven't messaged yet
    const connections = await MessagingService.listConnections(userId);
    for (const c of connections) {
      partnerIds.add(c.connectedUserId);
    }

    const summaries: ConversationSummaryDto[] = [];
    for (const pId of partnerIds) {
      const partner = await UserService.findById(pId);
      if (!partner) continue;

      let lastMessage = 'No messages yet';
      let lastMessageAt = new Date(0).toISOString();
      let unreadCount = 0;

      if (AppDataSource.isInitialized) {
        const msgRepo = AppDataSource.getRepository(DirectMessage);
        const lastMsg = await msgRepo
          .createQueryBuilder('m')
          .where(
            '((m.senderId = :u AND m.recipientId = :p) OR (m.senderId = :p AND m.recipientId = :u))',
            { u: userId, p: pId }
          )
          .orderBy('m.createdAt', 'DESC')
          .getOne();

        if (lastMsg) {
          lastMessage = lastMsg.content;
          lastMessageAt = lastMsg.createdAt.toISOString();
        }

        unreadCount = await msgRepo
          .createQueryBuilder('m')
          .where('m.senderId = :p AND m.recipientId = :u AND m.isRead = 0', {
            p: pId,
            u: userId,
          })
          .getCount();
      } else {
        const related = Array.from(memoryMessages.values())
          .filter(
            (m) =>
              (m.senderId === userId && m.recipientId === pId) ||
              (m.senderId === pId && m.recipientId === userId)
          )
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        if (related.length > 0) {
          lastMessage = related[0].content;
          lastMessageAt = related[0].createdAt.toISOString();
        }

        unreadCount = related.filter(
          (m) => m.senderId === pId && m.recipientId === userId && !m.isRead
        ).length;
      }

      summaries.push({
        otherUserId: partner.id,
        otherUserName: partner.profile?.displayName || partner.email,
        otherUserAvatar: partner.profile?.avatarUrl,
        otherUserRole: partner.role,
        otherUserTitle: partner.engineerProfile?.title,
        isVerifiedEngineer:
          partner.role === UserRole.ENGINEER &&
          partner.engineerProfile?.verificationStatus === VerificationStatus.VERIFIED,
        lastMessage,
        lastMessageAt,
        unreadCount,
      });
    }

    return summaries.sort(
      (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
    );
  }

  /**
   * Connect with an engineer or user (Facebook-style Add Friend / Connect)
   */
  public static async connectUser(
    userId: string,
    targetUserId: string
  ): Promise<UserConnectionDto> {
    if (userId === targetUserId) {
      throw new Error('CANNOT_CONNECT_SELF');
    }

    const target = await UserService.findById(targetUserId);
    if (!target) throw new Error('TARGET_USER_NOT_FOUND');

    const now = new Date();

    if (AppDataSource.isInitialized) {
      const connRepo = AppDataSource.getRepository(UserConnection);
      let existing = await connRepo.findOne({
        where: { userId, connectedUserId: targetUserId },
      });

      if (!existing) {
        existing = connRepo.create({
          id: randomUUID(),
          userId,
          connectedUserId: targetUserId,
          status: 'CONNECTED',
        });
        await connRepo.save(existing);

        // Bi-directional connection
        const reverse = connRepo.create({
          id: randomUUID(),
          userId: targetUserId,
          connectedUserId: userId,
          status: 'CONNECTED',
        });
        await connRepo.save(reverse);
      }

      return {
        id: existing.id,
        userId,
        connectedUserId: targetUserId,
        connectedUserName: target.profile?.displayName || target.email,
        connectedUserTitle: target.engineerProfile?.title,
        connectedUserAvatar: target.profile?.avatarUrl,
        isVerifiedEngineer:
          target.role === UserRole.ENGINEER &&
          target.engineerProfile?.verificationStatus === VerificationStatus.VERIFIED,
        createdAt: existing.createdAt.toISOString(),
      };
    }

    // In-memory
    const key1 = `${userId}:${targetUserId}`;
    const key2 = `${targetUserId}:${userId}`;
    let c = memoryConnections.get(key1);

    if (!c) {
      const id1 = randomUUID();
      const id2 = randomUUID();
      c = {
        id: id1,
        userId,
        connectedUserId: targetUserId,
        status: 'CONNECTED',
        createdAt: now,
      };
      memoryConnections.set(key1, c);
      memoryConnections.set(key2, {
        id: id2,
        userId: targetUserId,
        connectedUserId: userId,
        status: 'CONNECTED',
        createdAt: now,
      });
    }

    return {
      id: c.id,
      userId,
      connectedUserId: targetUserId,
      connectedUserName: target.profile?.displayName || target.email,
      connectedUserTitle: target.engineerProfile?.title,
      connectedUserAvatar: target.profile?.avatarUrl,
      isVerifiedEngineer:
        target.role === UserRole.ENGINEER &&
        target.engineerProfile?.verificationStatus === VerificationStatus.VERIFIED,
      createdAt: c.createdAt.toISOString(),
    };
  }

  /**
   * List connected users
   */
  public static async listConnections(userId: string): Promise<UserConnectionDto[]> {
    if (AppDataSource.isInitialized) {
      const connRepo = AppDataSource.getRepository(UserConnection);
      const connections = await connRepo
        .createQueryBuilder('c')
        .leftJoinAndSelect('c.connectedUser', 'u')
        .leftJoinAndSelect('u.profile', 'profile')
        .leftJoinAndSelect('u.engineerProfile', 'engineerProfile')
        .where('c.userId = :u', { u: userId })
        .orderBy('c.createdAt', 'DESC')
        .getMany();

      return connections.map((c) => ({
        id: c.id,
        userId: c.userId,
        connectedUserId: c.connectedUserId,
        connectedUserName: c.connectedUser?.profile?.displayName || c.connectedUser?.email,
        connectedUserTitle: c.connectedUser?.engineerProfile?.title,
        connectedUserAvatar: c.connectedUser?.profile?.avatarUrl,
        isVerifiedEngineer:
          c.connectedUser?.role === UserRole.ENGINEER &&
          c.connectedUser?.engineerProfile?.verificationStatus === VerificationStatus.VERIFIED,
        createdAt: c.createdAt.toISOString(),
      }));
    }

    // In-memory
    const results: UserConnectionDto[] = [];
    for (const c of memoryConnections.values()) {
      if (c.userId === userId) {
        const target = await UserService.findById(c.connectedUserId);
        results.push({
          id: c.id,
          userId: c.userId,
          connectedUserId: c.connectedUserId,
          connectedUserName: target?.profile?.displayName || target?.email || 'User',
          connectedUserTitle: target?.engineerProfile?.title,
          connectedUserAvatar: target?.profile?.avatarUrl,
          isVerifiedEngineer:
            target?.role === UserRole.ENGINEER &&
            target?.engineerProfile?.verificationStatus === VerificationStatus.VERIFIED,
          createdAt: c.createdAt.toISOString(),
        });
      }
    }

    return results;
  }

  private static async ensureConnected(userId: string, targetUserId: string): Promise<void> {
    try {
      await MessagingService.connectUser(userId, targetUserId);
    } catch {
      // ignore
    }
  }

  public static clearMemoryForTesting(): void {
    memoryMessages.clear();
    memoryConnections.clear();
  }
}
