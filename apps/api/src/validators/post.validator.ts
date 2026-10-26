import { z } from 'zod';
import { PostType, QuestionStatus } from '@buildlink/shared';

export const createPostSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'Title must be at least 3 characters long')
    .max(255, 'Title cannot exceed 255 characters'),
  content: z
    .string()
    .trim()
    .min(5, 'Post content must be at least 5 characters long'),
  category: z.string().trim().min(1, 'Category is required'),
  postType: z.nativeEnum(PostType).default(PostType.GENERAL).optional(),
  mediaUrls: z.array(z.string()).optional(),
});

export const updatePostSchema = z.object({
  title: z.string().trim().min(3).max(255).optional(),
  content: z.string().trim().min(5).optional(),
  category: z.string().trim().optional(),
  isResolved: z.boolean().optional(),
  questionStatus: z.nativeEnum(QuestionStatus).optional(),
});

export const createCommentSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, 'Comment text cannot be empty')
    .max(2000, 'Comment cannot exceed 2000 characters'),
  parentCommentId: z.string().uuid().optional(),
  isProfessionalAnswer: z.boolean().optional(),
});
