import { randomUUID } from 'crypto';
import { AppDataSource } from '../database/data-source';
import { Post, Comment, PostLike, User } from '../database/entities';
import { UserService } from './user.service';
import {
  UserRole,
  VerificationStatus,
  PostType,
  QuestionStatus,
  ReactionType,
  PostReactionBreakdownDto,
  ToggleReactionResponseDto,
  StoryDto,
  CreateStoryDto,
  ConstructionGroupDto,
  PostDto,
  CreatePostDto,
  UpdatePostDto,
  CommentDto,
  CreateCommentDto,
  ToggleLikeResponseDto,
  ResolveQuestionDto,
  VoteHelpfulResponseDto,
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
  acceptedAnswerId?: string;
  locationTag?: string;
  groupId?: string;
  groupName?: string;
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
  helpfulCount: number;
  isAcceptedSolution: boolean;
  createdAt: Date;
}

interface InMemoryStory {
  id: string;
  authorId: string;
  mediaUrl: string;
  caption?: string;
  locationTag?: string;
  createdAt: Date;
  expiresAt: Date;
}

const memoryPosts = new Map<string, InMemoryPost>();
const memoryComments = new Map<string, InMemoryComment>();
const memoryLikes = new Set<string>(); // "postId:userId"
const memoryReactions = new Map<string, ReactionType>(); // "postId:userId" -> ReactionType
const memoryHelpfulVotes = new Set<string>(); // "commentId:userId"
const memoryStories: InMemoryStory[] = [];
const memoryGroupMembers = new Set<string>(); // "groupId:userId"


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
    let userReaction: ReactionType | null = null;
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
      userReaction = memoryReactions.get(`${post.id}:${currentUserId}`) || (isLikedByMe ? ReactionType.LIKE : null);
    }

    // Reaction breakdown
    let like = 0;
    let love = 0;
    let insight = 0;
    let solid = 0;
    let caution = 0;
    for (const [key, rx] of memoryReactions.entries()) {
      if (key.startsWith(`${post.id}:`)) {
        if (rx === ReactionType.LIKE) like++;
        else if (rx === ReactionType.LOVE) love++;
        else if (rx === ReactionType.INSIGHT) insight++;
        else if (rx === ReactionType.SOLID) solid++;
        else if (rx === ReactionType.CAUTION) caution++;
      }
    }
    if (like + love + insight + solid + caution === 0 && post.likesCount > 0) {
      like = post.likesCount;
    }
    const reactionBreakdown: PostReactionBreakdownDto = { like, love, insight, solid, caution };

    const mediaUrls =
      'mediaUrls' in post && Array.isArray(post.mediaUrls)
        ? post.mediaUrls
        : PostService.parseMediaUrls((post as Post).mediaUrlsJson);

    const locationTag = 'locationTag' in post ? post.locationTag : undefined;
    const groupId = 'groupId' in post ? post.groupId : undefined;
    const groupName = 'groupName' in post ? post.groupName : undefined;

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
      locationTag,
      groupId,
      groupName,
      questionStatus: post.questionStatus || QuestionStatus.OPEN,
      likesCount: post.likesCount,
      commentsCount: post.commentsCount,
      isResolved: Boolean(post.isResolved),
      acceptedAnswerId: post.acceptedAnswerId,
      isLikedByMe,
      userReaction,
      reactionBreakdown,
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
      locationTag: dto.locationTag,
      groupId: dto.groupId,
      groupName: dto.groupName,
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
    userId: string,
    reactionType: ReactionType = ReactionType.LIKE
  ): Promise<ToggleReactionResponseDto> {
    const post = await PostService.getPostById(postId);
    if (!post) throw new Error('POST_NOT_FOUND');

    let isLikedNow = false;
    let finalUserReaction: ReactionType | null = null;
    let updatedLikesCount = post.likesCount;

    if (AppDataSource.isInitialized) {
      const likeRepo = AppDataSource.getRepository(PostLike);
      const postRepo = AppDataSource.getRepository(Post);
      const existingLike = await likeRepo.findOne({ where: { postId, userId } });

      if (existingLike) {
        await likeRepo.delete(existingLike.id);
        updatedLikesCount = Math.max(0, post.likesCount - 1);
        await postRepo.update(postId, { likesCount: updatedLikesCount });
        isLikedNow = false;
        finalUserReaction = null;
      } else {
        const newLike = likeRepo.create({
          id: randomUUID(),
          postId,
          userId,
        });
        await likeRepo.save(newLike);
        updatedLikesCount = post.likesCount + 1;
        await postRepo.update(postId, { likesCount: updatedLikesCount });
        isLikedNow = true;
        finalUserReaction = reactionType;
      }
    }

    const likeKey = `${postId}:${userId}`;
    const inMem = memoryPosts.get(postId);
    if (!AppDataSource.isInitialized && !inMem) throw new Error('POST_NOT_FOUND');

    const currentReaction = memoryReactions.get(likeKey);
    if (currentReaction) {
      if (currentReaction === reactionType) {
        // Toggle off
        memoryReactions.delete(likeKey);
        memoryLikes.delete(likeKey);
        if (inMem) inMem.likesCount = Math.max(0, inMem.likesCount - 1);
        updatedLikesCount = inMem ? inMem.likesCount : updatedLikesCount;
        isLikedNow = false;
        finalUserReaction = null;
      } else {
        // Switch reaction (e.g. from LIKE to LOVE)
        memoryReactions.set(likeKey, reactionType);
        memoryLikes.add(likeKey);
        isLikedNow = true;
        finalUserReaction = reactionType;
        if (inMem) updatedLikesCount = inMem.likesCount;
      }
    } else {
      // First reaction
      memoryReactions.set(likeKey, reactionType);
      memoryLikes.add(likeKey);
      if (inMem) inMem.likesCount += 1;
      updatedLikesCount = inMem ? inMem.likesCount : updatedLikesCount;
      isLikedNow = true;
      finalUserReaction = reactionType;
    }

    // Compute reaction breakdown
    let like = 0;
    let love = 0;
    let insight = 0;
    let solid = 0;
    let caution = 0;
    for (const [key, rx] of memoryReactions.entries()) {
      if (key.startsWith(`${postId}:`)) {
        if (rx === ReactionType.LIKE) like++;
        else if (rx === ReactionType.LOVE) love++;
        else if (rx === ReactionType.INSIGHT) insight++;
        else if (rx === ReactionType.SOLID) solid++;
        else if (rx === ReactionType.CAUTION) caution++;
      }
    }
    if (like + love + insight + solid + caution === 0 && updatedLikesCount > 0) {
      like = updatedLikesCount;
    }

    return {
      isLiked: isLikedNow,
      likesCount: updatedLikesCount,
      userReaction: finalUserReaction,
      reactionBreakdown: { like, love, insight, solid, caution },
    };
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
        helpfulCount: 0,
        isAcceptedSolution: false,
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
        helpfulCount: 0,
        isAcceptedSolution: false,
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
      helpfulCount: 0,
      isAcceptedSolution: false,
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
          helpfulCount: Number(c.helpfulCount || 0),
          isAcceptedSolution: Boolean(c.isAcceptedSolution),
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
          helpfulCount: c.helpfulCount || 0,
          isAcceptedSolution: c.isAcceptedSolution || false,
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

  public static async resolveQuestion(
    questionId: string,
    userId: string,
    userRole: UserRole,
    dto: ResolveQuestionDto
  ): Promise<PostDto> {
    const post = await PostService.getPostById(questionId);
    if (!post) throw new Error('QUESTION_NOT_FOUND');
    if (post.authorId !== userId && userRole !== UserRole.ADMIN) {
      throw new Error('FORBIDDEN_NOT_AUTHOR');
    }

    if (AppDataSource.isInitialized) {
      const postRepo = AppDataSource.getRepository(Post);
      const commentRepo = AppDataSource.getRepository(Comment);

      if (dto.acceptedCommentId) {
        const comment = await commentRepo.findOne({
          where: { id: dto.acceptedCommentId, postId: questionId },
        });
        if (!comment) throw new Error('COMMENT_NOT_FOUND');
        await commentRepo.update(dto.acceptedCommentId, { isAcceptedSolution: true });
      }

      await postRepo.update(questionId, {
        isResolved: true,
        questionStatus: QuestionStatus.RESOLVED,
        acceptedAnswerId: dto.acceptedCommentId,
      });

      const updated = await postRepo.findOne({
        where: { id: questionId },
        relations: ['author', 'author.profile', 'author.engineerProfile'],
      });
      return PostService.buildPostDto(updated!, userId);
    }

    const inMem = memoryPosts.get(questionId);
    if (!inMem) throw new Error('QUESTION_NOT_FOUND');

    if (dto.acceptedCommentId) {
      const comm = memoryComments.get(dto.acceptedCommentId);
      if (!comm || comm.postId !== questionId) throw new Error('COMMENT_NOT_FOUND');
      comm.isAcceptedSolution = true;
      inMem.acceptedAnswerId = dto.acceptedCommentId;
    }

    inMem.isResolved = true;
    inMem.questionStatus = QuestionStatus.RESOLVED;
    inMem.updatedAt = new Date();

    return PostService.buildPostDto(inMem, userId);
  }

  public static async unresolveQuestion(
    questionId: string,
    userId: string,
    userRole: UserRole
  ): Promise<PostDto> {
    const post = await PostService.getPostById(questionId);
    if (!post) throw new Error('QUESTION_NOT_FOUND');
    if (post.authorId !== userId && userRole !== UserRole.ADMIN) {
      throw new Error('FORBIDDEN_NOT_AUTHOR');
    }

    if (AppDataSource.isInitialized) {
      const postRepo = AppDataSource.getRepository(Post);
      const commentRepo = AppDataSource.getRepository(Comment);

      if (post.acceptedAnswerId) {
        await commentRepo.update(post.acceptedAnswerId, { isAcceptedSolution: false });
      }

      await postRepo.update(questionId, {
        isResolved: false,
        questionStatus: QuestionStatus.OPEN,
        acceptedAnswerId: undefined,
      });

      const updated = await postRepo.findOne({
        where: { id: questionId },
        relations: ['author', 'author.profile', 'author.engineerProfile'],
      });
      return PostService.buildPostDto(updated!, userId);
    }

    const inMem = memoryPosts.get(questionId);
    if (!inMem) throw new Error('QUESTION_NOT_FOUND');

    if (inMem.acceptedAnswerId) {
      const comm = memoryComments.get(inMem.acceptedAnswerId);
      if (comm) comm.isAcceptedSolution = false;
      inMem.acceptedAnswerId = undefined;
    }

    inMem.isResolved = false;
    inMem.questionStatus = QuestionStatus.OPEN;
    inMem.updatedAt = new Date();

    return PostService.buildPostDto(inMem, userId);
  }

  public static async toggleHelpfulComment(
    commentId: string,
    userId: string
  ): Promise<VoteHelpfulResponseDto> {
    if (AppDataSource.isInitialized) {
      const commentRepo = AppDataSource.getRepository(Comment);
      const comment = await commentRepo.findOne({ where: { id: commentId } });
      if (!comment) throw new Error('COMMENT_NOT_FOUND');

      const isHelpfulNow = !comment.isMarkedHelpful;
      const count = isHelpfulNow
        ? (comment.helpfulCount || 0) + 1
        : Math.max(0, (comment.helpfulCount || 0) - 1);

      await commentRepo.update(commentId, {
        isMarkedHelpful: isHelpfulNow,
        helpfulCount: count,
      });

      return { isMarkedHelpful: isHelpfulNow, helpfulCount: count };
    }

    const comm = memoryComments.get(commentId);
    if (!comm) throw new Error('COMMENT_NOT_FOUND');

    const key = `${commentId}:${userId}`;
    let isHelpfulNow = false;

    if (memoryHelpfulVotes.has(key)) {
      memoryHelpfulVotes.delete(key);
      comm.helpfulCount = Math.max(0, comm.helpfulCount - 1);
      comm.isMarkedHelpful = comm.helpfulCount > 0;
      isHelpfulNow = false;
    } else {
      memoryHelpfulVotes.add(key);
      comm.helpfulCount += 1;
      comm.isMarkedHelpful = true;
      isHelpfulNow = true;
    }

    return { isMarkedHelpful: isHelpfulNow, helpfulCount: comm.helpfulCount };
  }

  public static async listQuestions(params?: {
    status?: QuestionStatus | 'ALL' | 'UNRESOLVED';
    category?: string;
    search?: string;
    currentUserId?: string;
  }): Promise<PostDto[]> {
    const allQuestions = await PostService.listPosts({
      postType: PostType.QUESTION,
      category: params?.category,
      search: params?.search,
      currentUserId: params?.currentUserId,
    });

    if (!params?.status || params.status === 'ALL') {
      return allQuestions;
    }

    if (params.status === 'UNRESOLVED') {
      return allQuestions.filter((q) => !q.isResolved && q.questionStatus !== QuestionStatus.RESOLVED);
    }

    return allQuestions.filter((q) => q.questionStatus === params.status);
  }

  // --- Facebook Stories (Site Snaps) backed by Real Database Accounts ---
  public static async getStories(currentUserId?: string): Promise<StoryDto[]> {
    const now = new Date();
    // Default initial seeded stories linked to real database accounts if memoryStories is empty
    if (memoryStories.length === 0) {
      const dayAhead = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const kamal = await UserService.findByEmail('kamal.engineer@buildlink.lk');
      const oshadi = await UserService.findByEmail('oshadi.arch@buildlink.lk');
      const client = await UserService.findByEmail('client@buildlink.lk');
      const anura = await UserService.findByEmail('anura.geotech@buildlink.lk');
      const nimal = await UserService.findByEmail('nimal.mep@buildlink.lk');

      memoryStories.push(
        {
          id: 'story-1',
          authorId: kamal?.id || 'eng-kasun',
          mediaUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb18615f3?auto=format&fit=crop&w=600&q=80',
          caption: 'Slab reinforcement inspection passed today in Colombo 03! SLS 1253 compliant.',
          locationTag: 'Colombo 03',
          createdAt: now,
          expiresAt: dayAhead,
        },
        {
          id: 'story-2',
          authorId: oshadi?.id || 'arch-nimali',
          mediaUrl: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=600&q=80',
          caption: 'CSEB eco-courtyard cantilever balcony casting in progress. Precision formwork & cover blocks.',
          locationTag: 'Kurunegala',
          createdAt: new Date(now.getTime() - 2 * 3600 * 1000),
          expiresAt: dayAhead,
        },
        {
          id: 'story-3',
          authorId: client?.id || 'wardena-build',
          mediaUrl: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=600&q=80',
          caption: 'First-floor slab formwork and substructure compaction test verified at our Kandy site.',
          locationTag: 'Peradeniya, Kandy',
          createdAt: new Date(now.getTime() - 4 * 3600 * 1000),
          expiresAt: dayAhead,
        },
        {
          id: 'story-4',
          authorId: anura?.id || 'eng-ruwan',
          mediaUrl: 'https://images.unsplash.com/photo-1590274853856-f22d5ee3d228?auto=format&fit=crop&w=600&q=80',
          caption: 'NBRO certified retaining wall anchor rods and weep holes completed in Hantana.',
          locationTag: 'Hantana, Kandy',
          createdAt: new Date(now.getTime() - 5 * 3600 * 1000),
          expiresAt: dayAhead,
        },
        {
          id: 'story-5',
          authorId: nimal?.id || 'eng-kasun',
          mediaUrl: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=600&q=80',
          caption: '5kW Hybrid Solar PV array & LiFePO4 battery inverter commissioned in Negombo.',
          locationTag: 'Negombo',
          createdAt: new Date(now.getTime() - 6 * 3600 * 1000),
          expiresAt: dayAhead,
        }
      );
    }

    const result: StoryDto[] = [];
    for (const s of memoryStories) {
      let authorName = 'Site Engineer';
      let authorAvatar: string | undefined = undefined;
      let authorRole = UserRole.ENGINEER;
      let isVerifiedEngineer = true;

      const u = await UserService.findById(s.authorId);
      if (u) {
        authorName = u.profile?.displayName || `${u.profile?.firstName || ''} ${u.profile?.lastName || ''}`.trim() || 'Community Member';
        authorAvatar = u.profile?.avatarUrl;
        authorRole = u.role;
        isVerifiedEngineer = u.role === UserRole.ENGINEER && u.engineerProfile?.verificationStatus === VerificationStatus.VERIFIED;
      } else if (s.authorId === 'eng-kasun') {
        authorName = 'Eng. Kamal Silva';
        authorAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80';
      } else if (s.authorId === 'arch-nimali') {
        authorName = 'Eng. Oshadi Senanayake';
        authorAvatar = 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80';
      } else if (s.authorId === 'wardena-build') {
        authorName = 'Dilshan Perera';
        authorAvatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80';
        authorRole = UserRole.USER;
        isVerifiedEngineer = false;
      } else if (s.authorId === 'eng-ruwan') {
        authorName = 'Eng. Anura Wickramasinghe';
        authorAvatar = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80';
      }

      result.push({
        id: s.id,
        authorId: s.authorId,
        authorName,
        authorAvatar,
        authorRole,
        isVerifiedEngineer,
        mediaUrl: s.mediaUrl,
        caption: s.caption,
        locationTag: s.locationTag,
        createdAt: s.createdAt.toISOString(),
        expiresAt: s.expiresAt.toISOString(),
        isViewed: false,
      });
    }

    return result;
  }

  public static async createStory(authorId: string, dto: CreateStoryDto): Promise<StoryDto> {
    const id = randomUUID();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const newStory: InMemoryStory = {
      id,
      authorId,
      mediaUrl: dto.mediaUrl,
      caption: dto.caption,
      locationTag: dto.locationTag,
      createdAt: now,
      expiresAt,
    };
    memoryStories.unshift(newStory);

    const u = await UserService.findById(authorId);
    return {
      id,
      authorId,
      authorName: u?.profile?.displayName || `${u?.profile?.firstName || ''} ${u?.profile?.lastName || ''}`.trim() || 'You',
      authorAvatar: u?.profile?.avatarUrl,
      authorRole: u?.role || UserRole.USER,
      isVerifiedEngineer: u?.role === UserRole.ENGINEER && u?.engineerProfile?.verificationStatus === VerificationStatus.VERIFIED,
      mediaUrl: dto.mediaUrl,
      caption: dto.caption,
      locationTag: dto.locationTag,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      isViewed: false,
    };
  }

  // --- Specialized Engineering & Builder Groups ---
  public static async getGroups(currentUserId?: string): Promise<ConstructionGroupDto[]> {
    const baseGroups: ConstructionGroupDto[] = [
      {
        id: 'group-1',
        name: 'Sri Lanka Home Builders & Renovators',
        slug: 'sl-home-builders',
        description: 'The largest active community of Sri Lankan homeowners, architects, and structural advisors sharing real site progress, BOQ rates, and house construction tips.',
        category: 'Residential',
        coverImage: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=800&q=80',
        icon: '🏠',
        membersCount: 14250,
        postsCount: 1280,
        isPrivate: false,
        locationDistrict: 'Islandwide',
        createdAt: '2025-01-15T00:00:00.000Z',
      },
      {
        id: 'group-2',
        name: 'Structural Engineers & MEP Hub (IESL)',
        slug: 'structural-mep-hub',
        description: 'Professional technical discussions on Eurocodes, BS 8110, SLS 1253 concrete standards, CIDA SP/201 clear cover, foundation raft design, and MEP coordination.',
        category: 'Structural Engineering',
        coverImage: 'https://images.unsplash.com/photo-1541888946425-d0fbb18615f3?auto=format&fit=crop&w=800&q=80',
        icon: '📐',
        membersCount: 5830,
        postsCount: 640,
        isPrivate: false,
        locationDistrict: 'Colombo',
        createdAt: '2025-02-01T00:00:00.000Z',
      },
      {
        id: 'group-3',
        name: 'Cost-Effective & Eco Housing Sri Lanka',
        slug: 'eco-housing-sl',
        description: 'Sustainable CSEB compressed earth blocks, passive tropical cooling, courtyard villas, rainwater harvesting, and keeping home construction under budget.',
        category: 'Sustainable Construction',
        coverImage: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
        icon: '🌱',
        membersCount: 8910,
        postsCount: 915,
        isPrivate: false,
        locationDistrict: 'Islandwide',
        createdAt: '2025-03-10T00:00:00.000Z',
      },
      {
        id: 'group-4',
        name: 'Hill Country & NBRO Safe Builders',
        slug: 'hill-country-nbro',
        description: 'Dedicated to safe slope cutting, RC cantilever retaining walls, soil nailing, weep-hole drainage channels, and NBRO landslide clearances in Kandy, Badulla & Nuwara Eliya.',
        category: 'Geotechnical & Landslides',
        coverImage: 'https://images.unsplash.com/photo-1590274853856-f22d5ee3d228?auto=format&fit=crop&w=800&q=80',
        icon: '⛰️',
        membersCount: 3420,
        postsCount: 420,
        isPrivate: false,
        locationDistrict: 'Kandy',
        createdAt: '2025-04-05T00:00:00.000Z',
      },
      {
        id: 'group-5',
        name: 'Smart Home Automation & Solar LK',
        slug: 'solar-smarthome-lk',
        description: 'Hybrid solar PV inverters, CEB Net-Plus tariffs, 3-phase wiring, lightning arresters, automated water pump relays, and smart home networking.',
        category: 'Electrical & Renewable',
        coverImage: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=800&q=80',
        icon: '⚡',
        membersCount: 6100,
        postsCount: 780,
        isPrivate: false,
        locationDistrict: 'Western Province',
        createdAt: '2025-05-01T00:00:00.000Z',
      },
      {
        id: 'group-6',
        name: 'Colombo & Gampaha Modern Villa Builders',
        slug: 'colombo-villa-builders',
        description: 'Connect with verified contractors, quantity surveyors, and homeowners building modern two-storey and three-storey residences in Colombo, Gampaha, and Kalutara.',
        category: 'Residential',
        coverImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
        icon: '🏘️',
        membersCount: 7490,
        postsCount: 530,
        isPrivate: false,
        locationDistrict: 'Colombo & Gampaha',
        createdAt: '2025-05-20T00:00:00.000Z',
      },
    ];

    // Pre-join logged-in users to initial groups if they haven't initialized group memberships yet
    if (currentUserId && !memoryGroupMembers.has(`init:${currentUserId}`)) {
      memoryGroupMembers.add(`init:${currentUserId}`);
      memoryGroupMembers.add(`group-1:${currentUserId}`);
      memoryGroupMembers.add(`group-2:${currentUserId}`);
      memoryGroupMembers.add(`group-4:${currentUserId}`);
    }

    return baseGroups.map((g) => ({
      ...g,
      isMember: currentUserId ? memoryGroupMembers.has(`${g.id}:${currentUserId}`) : false,
    }));
  }

  public static async toggleJoinGroup(userId: string, groupId: string): Promise<{ isMember: boolean; membersCount: number }> {
    const key = `${groupId}:${userId}`;
    let isMember = false;
    if (memoryGroupMembers.has(key)) {
      memoryGroupMembers.delete(key);
      isMember = false;
    } else {
      memoryGroupMembers.add(key);
      isMember = true;
    }

    const allGroups = await PostService.getGroups(userId);
    const target = allGroups.find((g) => g.id === groupId);
    const count = target ? target.membersCount + (isMember ? 1 : 0) : 100;
    return { isMember, membersCount: count };
  }

  public static clearMemoryForTesting(): void {
    memoryPosts.clear();
    memoryComments.clear();
    memoryLikes.clear();
    memoryHelpfulVotes.clear();
  }

}
