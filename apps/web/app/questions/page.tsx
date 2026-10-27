'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import {
  PostDto,
  PostType,
  CONSTRUCTION_CATEGORIES,
} from '@buildlink/shared';
import {
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MessageSquare,
  ShieldCheck,
  PlusCircle,
  Search,
  Filter,
  ArrowRight,
  Flame,
  Check,
  Sparkles,
} from 'lucide-react';

function QuestionsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const [questions, setQuestions] = useState<PostDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'unresolved' | 'resolved'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedUrgency, setSelectedUrgency] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050/api/v1';

  // Read URL params
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    const catParam = searchParams.get('category');
    if (tabParam === 'unresolved' || tabParam === 'resolved') {
      setActiveTab(tabParam);
    }
    if (catParam) {
      setSelectedCategory(catParam);
    }
  }, [searchParams]);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const queryParts: string[] = [];
      if (activeTab === 'unresolved') queryParts.push('resolved=false');
      if (activeTab === 'resolved') queryParts.push('resolved=true');
      if (selectedCategory !== 'ALL') queryParts.push(`category=${encodeURIComponent(selectedCategory)}`);
      if (selectedUrgency !== 'ALL') queryParts.push(`urgency=${selectedUrgency}`);
      if (searchQuery.trim()) queryParts.push(`search=${encodeURIComponent(searchQuery.trim())}`);

      const queryString = queryParts.length ? `?${queryParts.join('&')}` : '';

      const res = await fetch(`${apiUrl}/posts/questions/catalog${queryString}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setQuestions(data.data);
      }
    } catch {
      // Handled gracefully
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions();
  }, [activeTab, selectedCategory, selectedUrgency, searchQuery]);

  const unresolvedCount = questions.filter((q) => !q.isResolved).length;
  const resolvedCount = questions.filter((q) => q.isResolved).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-navy via-[#102d54] to-brand-blue text-white p-8 sm:p-10 shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-amber-300 text-xs font-bold uppercase tracking-wider mb-3 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-brand-orange" />
            Engineering Knowledge Network
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Construction Questions & Technical Answers
          </h1>
          <p className="mt-2 text-blue-100 text-sm sm:text-base leading-relaxed">
            Get your structural, foundation, waterproofing, and building compliance questions evaluated and answered by certified Sri Lankan engineers.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href="/questions/ask"
              className="btn-accent text-sm font-bold gap-2 shadow-lg"
            >
              <PlusCircle className="w-4 h-4" />
              Ask a Technical Question
            </Link>
            <Link
              href="/feed?type=QUESTION"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/25 text-white font-bold text-sm transition-colors shadow-sm"
            >
              <MessageSquare className="w-4 h-4" />
              View Feed Discussions
            </Link>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-brand-orange/20 blur-3xl pointer-events-none" />
        <div className="absolute right-40 top-0 w-60 h-60 rounded-full bg-brand-blue/30 blur-2xl pointer-events-none" />
      </div>

      {/* Main Grid: Filters + Catalog */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Sidebar: Controls */}
        <div className="lg:col-span-1 space-y-6">
          {/* Search Box */}
          <div className="bg-white p-5 rounded-2xl border border-brand-border shadow-sm space-y-3">
            <label className="block text-xs font-bold text-brand-navy uppercase tracking-wider">
              Search Questions
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cracks, foundation, roofing..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-brand-border text-xs text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
              <Search className="w-4 h-4 text-brand-muted absolute left-3 top-2.5" />
            </div>
          </div>

          {/* Urgency Filter */}
          <div className="bg-white p-5 rounded-2xl border border-brand-border shadow-sm space-y-2">
            <label className="block text-xs font-bold text-brand-navy uppercase tracking-wider flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-brand-orange" /> Urgency Level
            </label>
            <div className="space-y-1">
              {[
                { id: 'ALL', label: 'All Urgencies' },
                { id: 'NORMAL', label: 'Standard / Normal' },
                { id: 'URGENT', label: 'Urgent Attention' },
                { id: 'EMERGENCY', label: 'Critical / Emergency' },
              ].map((u) => (
                <button
                  key={u.id}
                  onClick={() => setSelectedUrgency(u.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    selectedUrgency === u.id
                      ? 'bg-brand-blue text-white font-bold'
                      : 'text-brand-text hover:bg-slate-50'
                  }`}
                >
                  {u.label}
                </button>
              ))}
            </div>
          </div>

          {/* Construction Categories */}
          <div className="bg-white p-5 rounded-2xl border border-brand-border shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-brand-navy uppercase tracking-wider">
                Categories
              </label>
              {selectedCategory !== 'ALL' && (
                <button
                  onClick={() => setSelectedCategory('ALL')}
                  className="text-[11px] text-brand-blue hover:underline font-semibold"
                >
                  Reset
                </button>
              )}
            </div>
            <div className="space-y-1 max-h-80 overflow-y-auto pr-1">
              <button
                onClick={() => setSelectedCategory('ALL')}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                  selectedCategory === 'ALL'
                    ? 'text-brand-blue font-bold bg-blue-50'
                    : 'text-brand-text hover:bg-slate-50'
                }`}
              >
                All Categories
              </button>
              {CONSTRUCTION_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors truncate ${
                    selectedCategory === cat
                      ? 'text-brand-blue font-bold bg-blue-50'
                      : 'text-brand-muted hover:text-brand-navy hover:bg-slate-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Content: Tabs & Question Cards */}
        <div className="lg:col-span-3 space-y-6">
          {/* Resolution Tabs */}
          <div className="flex items-center justify-between gap-4 border-b border-brand-border pb-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'all'
                    ? 'bg-brand-navy text-white shadow-sm'
                    : 'bg-white text-brand-muted hover:text-brand-navy border border-brand-border'
                }`}
              >
                All Questions
              </button>
              <button
                onClick={() => setActiveTab('unresolved')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 ${
                  activeTab === 'unresolved'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-white text-amber-700 hover:bg-amber-50 border border-brand-border'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                Needs Answer
              </button>
              <button
                onClick={() => setActiveTab('resolved')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 ${
                  activeTab === 'resolved'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-white text-emerald-700 hover:bg-emerald-50 border border-brand-border'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Solved & Accepted
              </button>
            </div>

            <span className="text-xs text-brand-muted hidden sm:inline">
              Showing {questions.length} questions
            </span>
          </div>

          {/* Questions Stream */}
          {loading ? (
            <div className="min-h-[40vh] flex items-center justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-blue" />
            </div>
          ) : questions.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-brand-border text-center space-y-4 shadow-sm">
              <HelpCircle className="w-14 h-14 text-slate-300 mx-auto" />
              <div>
                <h3 className="text-base font-bold text-brand-navy">No questions match your filter</h3>
                <p className="text-xs text-brand-muted max-w-sm mx-auto mt-1">
                  Have a construction challenge or question on your site? Post it to receive guidance from certified engineers.
                </p>
              </div>
              <Link
                href="/questions/ask"
                className="btn-primary text-xs inline-flex items-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                Ask a Technical Question
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((q) => {
                const authorInitials = q.author?.displayName
                  ?.split(' ')
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase() || 'BL';

                return (
                  <article
                    key={q.id}
                    className={`bg-white rounded-2xl border p-5 sm:p-6 transition-all hover:shadow-md ${
                      q.isResolved
                        ? 'border-emerald-200 bg-emerald-50/20'
                        : 'border-brand-border'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
                      {/* Urgency & Category Badges */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-brand-navy">
                          {q.category}
                        </span>

                        {q.isResolved ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-extrabold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Solved & Answered
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-800">
                            <Clock className="w-3.5 h-3.5" />
                            Awaiting Resolution
                          </span>
                        )}

                        {q.urgency === 'EMERGENCY' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-extrabold bg-red-100 text-red-700 animate-pulse">
                            <AlertTriangle className="w-3 h-3" /> Critical Emergency
                          </span>
                        )}
                        {q.urgency === 'URGENT' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 text-amber-800">
                            <Flame className="w-3 h-3 text-amber-600" /> Urgent
                          </span>
                        )}
                      </div>

                      <span className="text-[11px] text-brand-muted">
                        Asked on {new Date(q.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Question Title */}
                    <Link
                      href={`/feed?search=${encodeURIComponent(q.title)}`}
                      className="group block"
                    >
                      <h2 className="text-base sm:text-lg font-bold text-brand-navy group-hover:text-brand-blue transition-colors leading-snug">
                        {q.title}
                      </h2>
                    </Link>

                    {/* Problem Description Excerpt */}
                    <p className="text-xs sm:text-sm text-brand-text leading-relaxed mt-2 line-clamp-3">
                      {q.content}
                    </p>

                    {/* Media preview if any */}
                    {q.mediaUrls && q.mediaUrls.length > 0 && (
                      <div className="flex gap-2 mt-3">
                        {q.mediaUrls.slice(0, 3).map((url, i) => (
                          <div
                            key={i}
                            className="w-16 h-16 rounded-lg overflow-hidden border border-brand-border bg-slate-50"
                          >
                            <img
                              src={url}
                              alt="Attachment"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                        {q.mediaUrls.length > 3 && (
                          <div className="w-16 h-16 rounded-lg bg-slate-100 border border-brand-border flex items-center justify-center text-xs font-bold text-brand-muted">
                            +{q.mediaUrls.length - 3}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Footer Info */}
                    <div className="mt-4 pt-3 border-t border-brand-border flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-brand-navy text-white flex items-center justify-center text-[10px] font-bold">
                          {authorInitials}
                        </div>
                        <span className="text-xs font-medium text-brand-text">
                          {q.author?.displayName}
                        </span>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-navy">
                          <MessageSquare className="w-4 h-4 text-brand-blue" />
                          {q.commentsCount} {q.commentsCount === 1 ? 'Answer' : 'Answers'}
                        </span>

                        <Link
                          href={`/feed?search=${encodeURIComponent(q.title)}`}
                          className="inline-flex items-center gap-1 text-xs font-bold text-brand-blue hover:text-brand-navy transition-colors"
                        >
                          View Answers <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function QuestionsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue" />
        </div>
      }
    >
      <QuestionsContent />
    </Suspense>
  );
}
