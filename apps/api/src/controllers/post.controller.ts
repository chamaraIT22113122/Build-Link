import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../common/response';
import { PostService } from '../services/post.service';
import {
  createPostSchema,
  updatePostSchema,
  createCommentSchema,
} from '../validators/post.validator';
import { PostType, UserRole } from '@buildlink/shared';

export class PostController {
  public static async uploadMedia(req: Request, res: Response): Promise<Response> {
    try {
      if (!req.file) {
        return sendError(res, 'NO_FILE_UPLOADED', 'Please select an image to upload.', 400);
      }

      const fileUrl = `/uploads/verification/${req.file.filename}`;
      return sendSuccess(
        res,
        {
          fileUrl,
          originalFilename: req.file.originalname,
          fileSizeBytes: req.file.size,
          mimeType: req.file.mimetype,
        },
        201
      );
    } catch (err: unknown) {
      return sendError(
        res,
        'UPLOAD_FAILED',
        'Failed to upload post media.',
        500,
        err instanceof Error ? err.message : undefined
      );
    }
  }

  public static async createPost(req: Request, res: Response): Promise<Response> {
    try {
      const authorId = req.user?.id;
      if (!authorId) return sendError(res, 'UNAUTHORIZED', 'Unauthorized.', 401);

      const parsed = createPostSchema.safeParse(req.body);
      if (!parsed.success) {
        return sendError(
          res,
          'VALIDATION_ERROR',
          'Validation failed for post.',
          400,
          parsed.error.errors
        );
      }

      const post = await PostService.createPost(authorId, parsed.data);
      return sendSuccess(res, post, 201);
    } catch (err: unknown) {
      return sendError(
        res,
        'INTERNAL_SERVER_ERROR',
        'Failed to publish post.',
        500,
        err instanceof Error ? err.message : undefined
      );
    }
  }

  public static async listPosts(req: Request, res: Response): Promise<Response> {
    try {
      const postType = req.query.postType as PostType | undefined;
      const category = req.query.category as string | undefined;
      const authorId = req.query.authorId as string | undefined;
      const search = req.query.search as string | undefined;
      const currentUserId = req.user?.id;

      const posts = await PostService.listPosts({
        postType,
        category,
        authorId,
        currentUserId,
        search,
      });

      return sendSuccess(res, posts, 200);
    } catch (err: unknown) {
      return sendError(
        res,
        'INTERNAL_SERVER_ERROR',
        'Failed to load community feed.',
        500,
        err instanceof Error ? err.message : undefined
      );
    }
  }

  public static async getPostById(req: Request, res: Response): Promise<Response> {
    try {
      const postId = req.params.id;
      const currentUserId = req.user?.id;

      const post = await PostService.getPostById(postId, currentUserId);
      if (!post) {
        return sendError(res, 'NOT_FOUND', 'Post not found.', 404);
      }

      return sendSuccess(res, post, 200);
    } catch (err: unknown) {
      return sendError(
        res,
        'INTERNAL_SERVER_ERROR',
        'Failed to retrieve post details.',
        500,
        err instanceof Error ? err.message : undefined
      );
    }
  }

  public static async updatePost(req: Request, res: Response): Promise<Response> {
    try {
      const postId = req.params.id;
      const authorId = req.user?.id;
      if (!authorId) return sendError(res, 'UNAUTHORIZED', 'Unauthorized.', 401);

      const parsed = updatePostSchema.safeParse(req.body);
      if (!parsed.success) {
        return sendError(
          res,
          'VALIDATION_ERROR',
          'Invalid post update fields.',
          400,
          parsed.error.errors
        );
      }

      const updated = await PostService.updatePost(postId, authorId, parsed.data);
      return sendSuccess(res, updated, 200);
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.message === 'POST_NOT_FOUND') {
          return sendError(res, 'NOT_FOUND', 'Post not found.', 404);
        }
        if (err.message === 'FORBIDDEN_NOT_AUTHOR') {
          return sendError(res, 'FORBIDDEN', 'You can only edit your own posts.', 403);
        }
      }
      return sendError(
        res,
        'INTERNAL_SERVER_ERROR',
        'Failed to update post.',
        500,
        err instanceof Error ? err.message : undefined
      );
    }
  }

  public static async deletePost(req: Request, res: Response): Promise<Response> {
    try {
      const postId = req.params.id;
      const userId = req.user?.id;
      const userRole = req.user?.role || UserRole.USER;
      if (!userId) return sendError(res, 'UNAUTHORIZED', 'Unauthorized.', 401);

      await PostService.deletePost(postId, userId, userRole);
      return sendSuccess(res, { message: 'Post removed successfully.' }, 200);
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.message === 'POST_NOT_FOUND') {
          return sendError(res, 'NOT_FOUND', 'Post not found.', 404);
        }
        if (err.message === 'FORBIDDEN') {
          return sendError(res, 'FORBIDDEN', 'Access denied to delete this post.', 403);
        }
      }
      return sendError(
        res,
        'INTERNAL_SERVER_ERROR',
        'Failed to delete post.',
        500,
        err instanceof Error ? err.message : undefined
      );
    }
  }

  public static async toggleLike(req: Request, res: Response): Promise<Response> {
    try {
      const postId = req.params.id;
      const userId = req.user?.id;
      if (!userId) return sendError(res, 'UNAUTHORIZED', 'Sign in to like posts.', 401);

      const result = await PostService.toggleLike(postId, userId);
      return sendSuccess(res, result, 200);
    } catch (err: unknown) {
      if (err instanceof Error && err.message === 'POST_NOT_FOUND') {
        return sendError(res, 'NOT_FOUND', 'Post not found.', 404);
      }
      return sendError(
        res,
        'INTERNAL_SERVER_ERROR',
        'Failed to toggle like.',
        500,
        err instanceof Error ? err.message : undefined
      );
    }
  }

  public static async addComment(req: Request, res: Response): Promise<Response> {
    try {
      const postId = req.params.id;
      const authorId = req.user?.id;
      if (!authorId) return sendError(res, 'UNAUTHORIZED', 'Sign in to comment.', 401);

      const parsed = createCommentSchema.safeParse(req.body);
      if (!parsed.success) {
        return sendError(
          res,
          'VALIDATION_ERROR',
          'Validation failed for comment.',
          400,
          parsed.error.errors
        );
      }

      const comment = await PostService.addComment(postId, authorId, parsed.data);
      return sendSuccess(res, comment, 201);
    } catch (err: unknown) {
      if (err instanceof Error && err.message === 'POST_NOT_FOUND') {
        return sendError(res, 'NOT_FOUND', 'Post not found.', 404);
      }
      return sendError(
        res,
        'INTERNAL_SERVER_ERROR',
        'Failed to add comment.',
        500,
        err instanceof Error ? err.message : undefined
      );
    }
  }

  public static async getComments(req: Request, res: Response): Promise<Response> {
    try {
      const postId = req.params.id;
      const comments = await PostService.getCommentsByPostId(postId);
      return sendSuccess(res, comments, 200);
    } catch (err: unknown) {
      return sendError(
        res,
        'INTERNAL_SERVER_ERROR',
        'Failed to retrieve comments.',
        500,
        err instanceof Error ? err.message : undefined
      );
    }
  }

  public static async deleteComment(req: Request, res: Response): Promise<Response> {
    try {
      const commentId = req.params.commentId;
      const userId = req.user?.id;
      const userRole = req.user?.role || UserRole.USER;
      if (!userId) return sendError(res, 'UNAUTHORIZED', 'Unauthorized.', 401);

      await PostService.deleteComment(commentId, userId, userRole);
      return sendSuccess(res, { message: 'Comment removed successfully.' }, 200);
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.message === 'COMMENT_NOT_FOUND') {
          return sendError(res, 'NOT_FOUND', 'Comment not found.', 404);
        }
        if (err.message === 'FORBIDDEN') {
          return sendError(res, 'FORBIDDEN', 'Access denied to delete comment.', 403);
        }
      }
      return sendError(
        res,
        'INTERNAL_SERVER_ERROR',
        'Failed to delete comment.',
        500,
        err instanceof Error ? err.message : undefined
      );
    }
  }
}
