'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { KnowledgeArticleDto } from '@buildlink/shared';
import {
  BookOpen,
  ArrowLeft,
  Clock,
  Eye,
  Award,
  ShieldCheck,
  Building,
  Share2,
  Calendar,
  CheckCircle2,
  Bookmark,
} from 'lucide-react';

export default function ArticleReaderPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [article, setArticle] = useState<KnowledgeArticleDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050/api/v1';

  useEffect(() => {
    if (!slug) return;

    const fetchArticle = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${apiUrl}/knowledge/${slug}`);
        const data = await res.json();
        if (data.success && data.data) {
          setArticle(data.data);
        } else {
          setError(data?.error?.message || 'Technical guide not found');
        }
      } catch {
        setError('Error loading article');
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue" />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
        <h2 className="text-xl font-bold text-brand-navy">Article Not Found</h2>
        <p className="text-xs text-brand-muted">{error || 'The requested technical publication is unavailable.'}</p>
        <Link href="/knowledge" className="btn-primary text-xs inline-flex items-center gap-1.5">
          <ArrowLeft className="w-4 h-4" /> Return to Knowledge Hub
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Back Link */}
      <div>
        <Link
          href="/knowledge"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-blue hover:text-brand-navy transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Knowledge Hub
        </Link>
      </div>

      {/* Main Article Container */}
      <article className="bg-white rounded-3xl border border-brand-border p-6 sm:p-10 shadow-sm space-y-8">
        {/* Header Metadata */}
        <div className="space-y-4 pb-6 border-b border-brand-border">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-blue-100 text-brand-blue uppercase tracking-wider">
                {article.category}
              </span>
              {article.standardsReference && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-brand-navy text-white shadow-xs">
                  <Award className="w-3.5 h-3.5 text-amber-300" />
                  {article.standardsReference}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 text-xs text-brand-muted">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> {article.readingTimeMinutes} min read
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" /> {article.viewsCount} views
              </span>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-brand-navy tracking-tight leading-tight">
            {article.title}
          </h1>

          <p className="text-sm sm:text-base text-brand-muted leading-relaxed font-medium">
            {article.summary}
          </p>

          {/* Author Badge */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand-navy text-white flex items-center justify-center font-bold text-xs shadow-sm">
                {article.authorName.split(' ')[1]?.[0] || 'E'}
              </div>
              <div>
                <p className="text-xs font-bold text-brand-navy">{article.authorName}</p>
                <p className="text-[11px] text-brand-muted">
                  Published {new Date(article.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                navigator.clipboard?.writeText(window.location.href);
                alert('Article link copied to clipboard!');
              }}
              className="inline-flex items-center gap-1 text-xs font-semibold text-brand-muted hover:text-brand-navy px-3 py-1.5 rounded-lg border border-brand-border hover:bg-slate-50 transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" /> Share
            </button>
          </div>
        </div>

        {/* Cover Image if available */}
        {article.coverImageUrl && (
          <div className="rounded-2xl overflow-hidden max-h-80 w-full border border-brand-border shadow-sm">
            <img
              src={article.coverImageUrl}
              alt={article.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Technical Article Body */}
        <div className="prose prose-blue max-w-none text-xs sm:text-sm text-brand-text leading-relaxed space-y-4">
          <div className="whitespace-pre-line leading-relaxed">
            {article.content}
          </div>
        </div>

        {/* Standards Citation Banner */}
        {article.standardsReference && (
          <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/70 border border-brand-blue/30 flex items-start gap-3">
            <ShieldCheck className="w-6 h-6 text-brand-blue flex-shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <h4 className="font-bold text-brand-navy">
                Statutory Reference: {article.standardsReference}
              </h4>
              <p className="text-brand-text leading-relaxed">
                This engineering guide complies with current regulations gazetted by the Sri Lanka Standards Institution (SLSI), Construction Industry Development Authority (CIDA), and relevant local authorities. Always consult a verified registered engineer for site-specific soil bearing and structural calculations.
              </p>
            </div>
          </div>
        )}

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="pt-4 border-t border-brand-border flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-brand-navy">Tags:</span>
            {article.tags.map((tag, i) => (
              <span
                key={i}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-brand-navy"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </article>
    </div>
  );
}
