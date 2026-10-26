import { Request, Response } from 'express';
import { KnowledgeService } from '../services/knowledge.service';
import { sendSuccess, sendError } from '../common/response';

export class KnowledgeController {
  public static async listArticles(req: Request, res: Response): Promise<void> {
    try {
      const { search, category, standardsReference, tag, page, limit } = req.query;

      const result = await KnowledgeService.listArticles({
        search: typeof search === 'string' ? search : undefined,
        category: typeof category === 'string' ? category : undefined,
        standardsReference: typeof standardsReference === 'string' ? standardsReference : undefined,
        tag: typeof tag === 'string' ? tag : undefined,
        page: page ? parseInt(String(page), 10) : 1,
        limit: limit ? parseInt(String(limit), 10) : 20,
      });

      sendSuccess(res, result.data, 200, {
        total: result.total,
        page: result.page,
        limit: result.limit,
      });
    } catch (err: any) {
      sendError(res, 'INTERNAL_ERROR', err.message, 500);
    }
  }

  public static async getArticleBySlug(req: Request, res: Response): Promise<void> {
    try {
      const { slug } = req.params;
      const article = await KnowledgeService.getArticleBySlug(slug);

      if (!article) {
        sendError(res, 'NOT_FOUND', 'Technical article not found', 404);
        return;
      }

      sendSuccess(res, article, 200);
    } catch (err: any) {
      sendError(res, 'INTERNAL_ERROR', err.message, 500);
    }
  }

  public static async createArticle(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      if (!user) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
        return;
      }

      const { title, category, summary, content, coverImageUrl, standardsReference, tags } = req.body;
      if (!title || !category || !summary || !content) {
        sendError(res, 'VALIDATION_ERROR', 'title, category, summary, and content are required', 400);
        return;
      }

      const article = await KnowledgeService.createArticle(user.profile?.displayName || user.email, {
        title,
        category,
        summary,
        content,
        coverImageUrl,
        standardsReference,
        tags,
      });

      sendSuccess(res, article, 201);
    } catch (err: any) {
      sendError(res, 'INTERNAL_ERROR', err.message, 500);
    }
  }
}
