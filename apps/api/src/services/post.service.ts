import { randomUUID } from 'crypto';
import { AppDataSource } from '../database/data-source';
import { Post, Comment, PostLike, User } from '../database/entities';
import { UserService } from './user.service';
import {
  UserRole,
  VerificationStatus,
  PostType,
  QuestionStatus,
  PostDto,
  CreatePostDto,
  UpdatePostDto,
  CommentDto,
  CreateCommentDto,
  ToggleLikeResponseDto,
} from '@buildlink/shared';

// In-memory fallback stores for offline and testing
interface InMemoryPost {
  id: string;
  authorId: string;
  postType: PostType;
  category: string;
  title: string;
  content: string;
  mediaUrls: string[];
  questionStatus: QuestionStatus;
  likesCount: number;
  commentsCount: number;
  isResolved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface InMemoryComment {
  id: string;
  postId: string;
  authorId: string;
  parentCommentId?: string;
  content: string;
  isProfessionalAnswer: boolean;
  isMarkedHelpful: boolean;
  createdAt: Date;
}

const memoryPosts = new Map<string, InMemoryPost>();
const memoryComments = new Map<string, InMemoryComment>();
const memoryLikes = new Set<string>(); // "postId:userId"

export class PostService {
  private static parseMediaUrls(val: string | unknown): string[] {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    try {
      const parsed = JSON.parse(val as string);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private static async buildPostDto(
    post: Post | InMemoryPost,
    currentUserId?: string
  ): Promise<PostDto> {
    const author = await UserService.findById(post.authorId);
    const prof = author?.profile;
    const eng = author?.engineerProfile;

    const isVerifiedEngineer =
      author?.role === UserRole.ENGINEER &&
      eng?.verificationStatus === VerificationStatus.VERIFIED;

    let isLikedByMe = false;
    if (currentUserId) {
      if (AppDataSource.isInitialized) {
        const likeRepo = AppDataSource.getRepository(PostLike);
        const existing = await likeRepo.findOne({
          where: { postId: post.id, userId: currentUserId },
        });
        isLikedByMe = Boolean(existing);
      } else {
        isLikedByMe = memoryLikes.has(`${post.id}:${currentUserId}`);
      }
    }

    const mediaUrls =
      'mediaUrls' in post && Array.isArray(post.mediaUrls)
        ? post.mediaUrls
        : PostService.parseMediaUrls((post as Post).mediaUrlsJson);

    return {
      id: post.id,
      authorId: post.authorId,
      author: {
        id: post.authorId,
        displayName:
          prof?.displayName || `${prof?.firstName || ''} ${prof?.lastName || ''}`.trim() || 'Community Member',
        avatarUrl: prof?.avatarUrl,
        role: author?.role || UserRole.USER,
        isVerifiedEngineer,
        engineerTitle: eng?.title,
      },
      postType: post.postType,
      category: post.category,
      title: post.title,
      content: post.content,
      mediaUrls,
      questionStatus: post.questionStatus || QuestionStatus.OPEN,
      likesCount: post.likesCount,
      commentsCount: post.commentsCount,
      isResolved: Boolean(post.isResolved),
      isLikedByMe,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
    };
  }

  public static async createPost(authorId: string, dto: CreatePostDto): Promise<PostDto> {
    const postId = randomUUID();
    const now = new Date();
    const mediaUrls = dto.mediaUrls || [];

    if (AppDataSource.isInitialized) {
      const postRepo = AppDataSource.getRepository(Post);
      const post = postRepo.create({
        id: postId,
        authorId,
        postType: dto.postType || PostType.GENERAL,
        category: dto.category,
        title: dto.title.trim(),
        content: dto.content.trim(),
        mediaUrlsJson: JSON.stringify(mediaUrls),
        questionStatus: dto.postType === PostType.QUESTION ? QuestionStatus.OPEN : undefined,
        likesCount: 0,
        commentsCount: 0,
        isResolved: false,
      });

      const saved = await postRepo.save(post);
      return PostService.buildPostDto(saved, authorId);
    }

    const postObj: InMemoryPost = {
      id: postId,
      authorId,
      postType: dto.postType || PostType.GENERAL,
      category: dto.category,
      title: dto.title.trim(),
      content: dto.content.trim(),
      mediaUrls,
      questionStatus: dto.postType === PostType.QUESTION ? QuestionStatus.OPEN : QuestionStatus.OPEN,
      likesCount: 0,
      commentsCount: 0,
      isResolved: false,
      createdAt: now,
      updatedAt: now,
    };

    memoryPosts.set(postId, postObj);
    return PostService.buildPostDto(postObj, authorId);
  }

  public static async listPosts(params?: {
    postType?: PostType;
    category?: string;
    authorId?: string;
    currentUserId?: string;
    search?: string;
  }): Promise<PostDto[]> {
    if (AppDataSource.isInitialized) {
      const postRepo = AppDataSource.getRepository(Post);
      const qb = postRepo
        .createQueryBuilder('post')
        .leftJoinAndSelect('post.author', 'author')
        .leftJoinAndSelect('author.profile', 'profile')
        .leftJoinAndSelect('author.engineerProfile', 'engineerProfile')
        .orderBy('post.createdAt', 'DESC');

      if (params?.postType) {
        qb.andWhere('post.postType = :postType', { postType: params.postType });
      }
      if (params?.category) {
        qb.andWhere('post.category = :category', { category: params.category });
      }
      if (params?.authorId) {
        qb.andWhere('post.authorId = :authorId', { authorId: params.authorId });
      }
      if (params?.search) {
        qb.andWhere('(post.title LIKE :s OR post.content LIKE :s)', {
          s: `%${params.search}%`,
        });
      }

      const posts = await qb.getMany();
      return Promise.all(posts.map((p) => PostService.buildPostDto(p, params?.currentUserId)));
    }

    // In-memory fallback
    const all = Array.from(memoryPosts.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );

    const filtered = all.filter((p) => {
      if (params?.postType && p.postType !== params.postType) return false;
      if (params?.category && p.category.toLowerCase() !== params.category.toLowerCase()) return false;
      if (params?.authorId && p.authorId !== params.authorId) return false;
      if (params?.search) {
        const query = params.search.toLowerCase();
        const matches = p.title.toLowerCase().includes(query) || p.content.toLowerCase().includes(query);
        if (!matches) return false;
      }
      return true;
    });

    return Promise.all(filtered.map((p) => PostService.buildPostDto(p, params?.currentUserId)));
  }

  public static async getPostById(postId: string, currentUserId?: string): Promise<PostDto | null> {
    if (AppDataSource.isInitialized) {
      const postRepo = AppDataSource.getRepository(Post);
      const post = await postRepo.findOne({
        where: { id: postId },
        relations: ['author', 'author.profile', 'author.engineerProfile'],
      });
      if (!post) return null;
      return PostService.buildPostDto(post, currentUserId);
    }

    const post = memoryPosts.get(postId);
    if (!post) return null;
    return PostService.buildPostDto(post, currentUserId);
  }

  public static async updatePost(
    postId: string,
    authorId: string,
    dto: UpdatePostDto
  ): Promise<PostDto> {
    const post = await PostService.getPostById(postId);
    if (!post) throw new Error('POST_NOT_FOUND');
    if (post.authorId !== authorId) throw new Error('FORBIDDEN_NOT_AUTHOR');

    if (AppDataSource.isInitialized) {
      const postRepo = AppDataSource.getRepository(Post);
      const updateData: Partial<Post> = {};
      if (dto.title !== undefined) updateData.title = dto.title.trim();
      if (dto.content !== undefined) updateData.content = dto.content.trim();
      if (dto.category !== undefined) updateData.category = dto.category;
      if (dto.isResolved !== undefined) updateData.isResolved = dto.isResolved;
      if (dto.questionStatus !== undefined) updateData.questionStatus = dto.questionStatus;

      await postRepo.update(postId, updateData);
      const updated = await postRepo.findOne({ where: { id: postId } });
      return PostService.buildPostDto(updated!, authorId);
    }

    const inMem = memoryPosts.get(postId);
    if (!inMem) throw new Error('POST_NOT_FOUND');
    if (dto.title !== undefined) inMem.title = dto.title.trim();
    if (dto.content !== undefined) inMem.content = dto.content.trim();
    if (dto.category !== undefined) inMem.category = dto.category;
    if (dto.isResolved !== undefined) inMem.isResolved = dto.isResolved;
    if (dto.questionStatus !== undefined) inMem.questionStatus = dto.questionStatus;
    inMem.updatedAt = new Date();

    return PostService.buildPostDto(inMem, authorId);
  }

  public static async deletePost(
    postId: string,
    userId: string,
    userRole: UserRole
  ): Promise<void> {
    const post = await PostService.getPostById(postId);
    if (!post) throw new Error('POST_NOT_FOUND');
    if (post.authorId !== userId && userRole !== UserRole.ADMIN) {
      throw new Error('FORBIDDEN');
    }

    if (AppDataSource.isInitialized) {
      const postRepo = AppDataSource.getRepository(Post);
      await postRepo.delete(postId);
      return;
    }

    memoryPosts.delete(postId);
    // Delete associated comments
    for (const [cId, comment] of memoryComments.entries()) {
      if (comment.postId === postId) {
        memoryComments.delete(cId);
      }
    }
  }

  public static async toggleLike(
    postId: string,
    userId: string
  ): Promise<ToggleLikeResponseDto> {
    const post = await PostService.getPostById(postId);
    if (!post) throw new Error('POST_NOT_FOUND');

    if (AppDataSource.isInitialized) {
      const likeRepo = AppDataSource.getRepository(PostLike);
      const postRepo = AppDataSource.getRepository(Post);

      const existingLike = await likeRepo.findOne({ where: { postId, userId } });

      if (existingLike) {
        await likeRepo.delete(existingLike.id);
        const newCount = Math.max(0, post.likesCount - 1);
        await postRepo.update(postId, { likesCount: newCount });
        return { isLiked: false, likesCount: newCount };
      } else {
        const newLike = likeRepo.create({
          id: randomUUID(),
          postId,
          userId,
        });
        await likeRepo.save(newLike);
        const newCount = post.likesCount + 1;
        await postRepo.update(postId, { likesCount: newCount });
        return { isLiked: true, likesCount: newCount };
      }
    }

    const likeKey = `${postId}:${userId}`;
    const inMem = memoryPosts.get(postId);
    if (!inMem) throw new Error('POST_NOT_FOUND');

    if (memoryLikes.has(likeKey)) {
      memoryLikes.delete(likeKey);
      inMem.likesCount = Math.max(0, inMem.likesCount - 1);
      return { isLiked: false, likesCount: inMem.likesCount };
    } else {
      memoryLikes.add(likeKey);
      inMem.likesCount += 1;
      return { isLiked: true, likesCount: inMem.likesCount };
    }
  }

  public static async addComment(
    postId: string,
    authorId: string,
    dto: CreateCommentDto
  ): Promise<CommentDto> {
    const post = await PostService.getPostById(postId);
    if (!post) throw new Error('POST_NOT_FOUND');

    const author = await UserService.findById(authorId);
    const prof = author?.profile;
    const eng = author?.engineerProfile;

    const isVerifiedEngineer =
      author?.role === UserRole.ENGINEER &&
      eng?.verificationStatus === VerificationStatus.VERIFIED;

    const isProfessionalAnswer =
      dto.isProfessionalAnswer !== undefined
        ? dto.isProfessionalAnswer
        : isVerifiedEngineer;

    const commentId = randomUUID();
    const now = new Date();

    if (AppDataSource.isInitialized) {
      const commentRepo = AppDataSource.getRepository(Comment);
      const postRepo = AppDataSource.getRepository(Post);

      const comment = commentRepo.create({
        id: commentId,
        postId,
        authorId,
        parentCommentId: dto.parentCommentId,
        content: dto.content.trim(),
        isProfessionalAnswer,
        isMarkedHelpful: false,
      });

      await commentRepo.save(comment);
      await postRepo.update(postId, { commentsCount: post.commentsCount + 1 });
    } else {
      const inMem = memoryPosts.get(postId);
      if (inMem) inMem.commentsCount += 1;

      memoryComments.set(commentId, {
        id: commentId,
        postId,
        authorId,
        parentCommentId: dto.parentCommentId,
        content: dto.content.trim(),
        isProfessionalAnswer,
        isMarkedHelpful: false,
        createdAt: now,
      });
    }

    return {
      id: commentId,
      postId,
      authorId,
      author: {
        id: authorId,
        displayName:
          prof?.displayName || `${prof?.firstName || ''} ${prof?.lastName || ''}`.trim() || 'Community Member',
        avatarUrl: prof?.avatarUrl,
        role: author?.role || UserRole.USER,
        isVerifiedEngineer,
        engineerTitle: eng?.title,
      },
      parentCommentId: dto.parentCommentId,
      content: dto.content.trim(),
      isProfessionalAnswer,
      isMarkedHelpful: false,
      createdAt: now.toISOString(),
    };
  }

  public static async getCommentsByPostId(postId: string): Promise<CommentDto[]> {
    if (AppDataSource.isInitialized) {
      const commentRepo = AppDataSource.getRepository(Comment);
      const comments = await commentRepo.find({
        where: { postId },
        order: { createdAt: 'ASC' },
        relations: ['author', 'author.profile', 'author.engineerProfile'],
      });

      return comments.map((c) => {
        const u = c.author;
        const prof = u?.profile;
        const eng = u?.engineerProfile;
        const isVerifiedEngineer =
          u?.role === UserRole.ENGINEER &&
          eng?.verificationStatus === VerificationStatus.VERIFIED;

        return {
          id: c.id,
          postId: c.postId,
          authorId: c.authorId,
          author: {
            id: c.authorId,
            displayName:
              prof?.displayName || `${prof?.firstName || ''} ${prof?.lastName || ''}`.trim() || 'Community Member',
            avatarUrl: prof?.avatarUrl,
            role: u?.role || UserRole.USER,
            isVerifiedEngineer,
            engineerTitle: eng?.title,
          },
          parentCommentId: c.parentCommentId,
          content: c.content,
          isProfessionalAnswer: Boolean(c.isProfessionalAnswer),
          isMarkedHelpful: Boolean(c.isMarkedHelpful),
          createdAt: c.createdAt.toISOString(),
        };
      });
    }

    const commentsForPost = Array.from(memoryComments.values())
      .filter((c) => c.postId === postId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    return Promise.all(
      commentsForPost.map(async (c) => {
        const author = await UserService.findById(c.authorId);
        const prof = author?.profile;
        const eng = author?.engineerProfile;
        const isVerifiedEngineer =
          author?.role === UserRole.ENGINEER &&
          eng?.verificationStatus === VerificationStatus.VERIFIED;

        return {
          id: c.id,
          postId: c.postId,
          authorId: c.authorId,
          author: {
            id: c.authorId,
            displayName:
              prof?.displayName || `${prof?.firstName || ''} ${prof?.lastName || ''}`.trim() || 'Community Member',
            avatarUrl: prof?.avatarUrl,
            role: author?.role || UserRole.USER,
            isVerifiedEngineer,
            engineerTitle: eng?.title,
          },
          parentCommentId: c.parentCommentId,
          content: c.content,
          isProfessionalAnswer: c.isProfessionalAnswer,
          isMarkedHelpful: c.isMarkedHelpful,
          createdAt: c.createdAt.toISOString(),
        };
      })
    );
  }

  public static async deleteComment(
    commentId: string,
    userId: string,
    userRole: UserRole
  ): Promise<void> {
    if (AppDataSource.isInitialized) {
      const commentRepo = AppDataSource.getRepository(Comment);
      const postRepo = AppDataSource.getRepository(Post);
      const comment = await commentRepo.findOne({ where: { id: commentId } });
      if (!comment) throw new Error('COMMENT_NOT_FOUND');
      if (comment.authorId !== userId && userRole !== UserRole.ADMIN) {
        throw new Error('FORBIDDEN');
      }

      await commentRepo.delete(commentId);
      const post = await postRepo.findOne({ where: { id: comment.postId } });
      if (post) {
        await postRepo.update(post.id, {
          commentsCount: Math.max(0, post.commentsCount - 1),
        });
      }
      return;
    }

    const c = memoryComments.get(commentId);
    if (!c) throw new Error('COMMENT_NOT_FOUND');
    if (c.authorId !== userId && userRole !== UserRole.ADMIN) {
      throw new Error('FORBIDDEN');
    }

    const post = memoryPosts.get(c.postId);
    if (post) post.commentsCount = Math.max(0, post.commentsCount - 1);
    memoryComments.delete(commentId);
  }

  public static clearMemoryForTesting(): void {
    memoryPosts.clear();
    memoryComments.clear();
    memoryLikes.clear();
  }
}
