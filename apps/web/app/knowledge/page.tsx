'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  KnowledgeArticleDto,
} from '@buildlink/shared';
import {
  BookOpen,
  Search,
  Filter,
  Clock,
  Eye,
  ShieldCheck,
  Building,
  Award,
  ArrowRight,
  Sparkles,
  FileText,
  ChevronRight,
  Layers,
} from 'lucide-react';

const KNOWLEDGE_CATEGORIES = [
  'All Categories',
  'Concrete Technology',
  'Structural Design',
  'Foundation & Soil',
  'Building Regulations',
  'Roofing & Waterproofing',
  'Building Materials',
];

const STANDARDS_BODIES = [
  { id: 'ALL', label: 'All Standards' },
  { id: 'SLS', label: 'SLS (Sri Lanka Standards)' },
  { id: 'CIDA', label: 'CIDA / ICTAD Specifications' },
  { id: 'NBRO', label: 'NBRO Landslide & Slope Codes' },
  { id: 'UDA', label: 'UDA Planning & Setback Rules' },
];

function KnowledgeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [articles, setArticles] = useState<KnowledgeArticleDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedStandard, setSelectedStandard] = useState('ALL');

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050/api/v1';

  // Read URL params
  useEffect(() => {
    const q = searchParams.get('search');
    const c = searchParams.get('category');
    const s = searchParams.get('standard');
    if (q) setSearchQuery(q);
    if (c) setSelectedCategory(c);
    if (s) setSelectedStandard(s);
  }, [searchParams]);

  const loadArticles = async () => {
    setLoading(true);
    try {
      const queryParts: string[] = [];
      if (searchQuery.trim()) queryParts.push(`search=${encodeURIComponent(searchQuery.trim())}`);
      if (selectedCategory !== 'All Categories') queryParts.push(`category=${encodeURIComponent(selectedCategory)}`);
      if (selectedStandard !== 'ALL') queryParts.push(`standardsReference=${encodeURIComponent(selectedStandard)}`);

      const queryString = queryParts.length ? `?${queryParts.join('&')}` : '';

      const res = await fetch(`${apiUrl}/knowledge${queryString}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setArticles(data.data);
      }
    } catch {
      // Handled silently
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArticles();
  }, [searchQuery, selectedCategory, selectedStandard]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-navy via-[#102d52] to-brand-blue text-white p-8 sm:p-10 shadow-xl">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-amber-300 text-xs font-bold uppercase tracking-wider mb-3 shadow-xs">
            <Award className="w-4 h-4 text-brand-orange" />
            Official Sri Lankan Construction Standards
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Engineering Knowledge Hub
          </h1>
          <p className="mt-2 text-blue-100 text-sm sm:text-base leading-relaxed">
            Curated technical guidelines, statutory building regulations, and engineering standards from SLS, CIDA (ICTAD), NBRO, and UDA for safe, compliant construction in Sri Lanka.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span className="px-3 py-1 rounded-lg bg-white/10 text-white font-mono text-xs font-bold border border-white/20">
              SLS 1253 & SLS 522
            </span>
            <span className="px-3 py-1 rounded-lg bg-white/10 text-white font-mono text-xs font-bold border border-white/20">
              CIDA SP/201
            </span>
            <span className="px-3 py-1 rounded-lg bg-white/10 text-white font-mono text-xs font-bold border border-white/20">
              NBRO Hazard Codes
            </span>
            <span className="px-3 py-1 rounded-lg bg-white/10 text-white font-mono text-xs font-bold border border-white/20">
              UDA Regulations 2021
            </span>
          </div>
        </div>

        {/* Decorative backdrop shapes */}
        <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-brand-orange/20 blur-3xl pointer-events-none" />
      </div>

      {/* Search and Category Bar */}
      <div className="bg-white rounded-2xl border border-brand-border p-4 sm:p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Keyword Search */}
          <div className="md:col-span-1 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search standards, concrete, setbacks..."
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-brand-border text-xs text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
            <Search className="w-4 h-4 text-brand-muted absolute left-3 top-3" />
          </div>

          {/* Category Dropdown */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-brand-border text-xs text-brand-navy bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
            >
              {KNOWLEDGE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Standards Filter */}
          <div>
            <select
              value={selectedStandard}
              onChange={(e) => setSelectedStandard(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-brand-border text-xs text-brand-navy bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
            >
              {STANDARDS_BODIES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Filter Tags */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 border-t border-slate-100">
          <span className="text-xs font-bold text-brand-navy flex-shrink-0 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-brand-blue" /> Authorities:
          </span>
          {STANDARDS_BODIES.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedStandard(s.id)}
              className={`flex-shrink-0 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                selectedStandard === s.id
                  ? 'bg-brand-blue text-white shadow-xs font-bold'
                  : 'bg-slate-50 text-brand-text hover:bg-slate-100'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Articles Grid */}
      {loading ? (
        <div className="min-h-[40vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue" />
        </div>
      ) : articles.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-brand-border text-center space-y-4 shadow-sm">
          <BookOpen className="w-14 h-14 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-brand-navy">No technical guides match your search</h3>
          <p className="text-xs text-brand-muted max-w-sm mx-auto">
            Try adjusting your search terms or standards authority filter to view technical publications.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All Categories');
              setSelectedStandard('ALL');
            }}
            className="btn-secondary text-xs"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {articles.map((art) => {
            return (
              <article
                key={art.id}
                className="bg-white rounded-3xl border border-brand-border overflow-hidden shadow-sm hover:shadow-lg transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Article Image Preview if available */}
                  {art.coverImageUrl && (
                    <div className="h-48 w-full overflow-hidden bg-slate-100 relative">
                      <img
                        src={art.coverImageUrl}
                        alt={art.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {art.standardsReference && (
                        <div className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-black bg-brand-navy/90 text-white backdrop-blur-md border border-white/20 shadow-md">
                          {art.standardsReference}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="p-6 space-y-3">
                    <div className="flex items-center justify-between text-xs font-semibold text-brand-muted">
                      <span className="text-brand-blue font-bold uppercase tracking-wider">
                        {art.category}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {art.readingTimeMinutes} min read
                      </span>
                    </div>

                    <Link href={`/knowledge/${art.slug}`} className="block group">
                      <h2 className="text-lg font-bold text-brand-navy group-hover:text-brand-blue transition-colors leading-snug">
                        {art.title}
                      </h2>
                    </Link>

                    <p className="text-xs text-brand-text leading-relaxed line-clamp-3">
                      {art.summary}
                    </p>

                    {/* Tags */}
                    {art.tags && art.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-2">
                        {art.tags.slice(0, 4).map((tag, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-brand-muted"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer with Author & Read link */}
                <div className="px-6 py-4 bg-slate-50/70 border-t border-brand-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-brand-navy text-white flex items-center justify-center text-[10px] font-bold">
                      {art.authorName.split(' ')[1]?.[0] || 'E'}
                    </div>
                    <span className="text-xs font-semibold text-brand-navy">
                      {art.authorName}
                    </span>
                  </div>

                  <Link
                    href={`/knowledge/${art.slug}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-brand-blue hover:text-brand-navy transition-colors"
                  >
                    Read Guide <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function KnowledgePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue" />
        </div>
      }
    >
      <KnowledgeContent />
    </Suspense>
  );
}
