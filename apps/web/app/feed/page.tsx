'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import {
  PostDto,
  CommentDto,
  PostType,
  UserRole,
  CONSTRUCTION_CATEGORIES,
} from '@buildlink/shared';
import {
  MessageSquare,
  Heart,
  Share2,
  HardHat,
  ShieldCheck,
  Send,
  PlusCircle,
  HelpCircle,
  Lightbulb,
  Building,
  UploadCloud,
  X,
  Search,
  Filter,
  Trash2,
  Calendar,
} from 'lucide-react';
import Link from 'next/link';

function FeedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, token } = useAuth();

  const [posts, setPosts] = useState<PostDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // New Post Form State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postCategory, setPostCategory] = useState<string>(CONSTRUCTION_CATEGORIES[0]);
  const [postType, setPostType] = useState<PostType>(PostType.GENERAL);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);

  // Active Expanded Comments: Map of postId -> CommentDto[]
  const [expandedComments, setExpandedComments] = useState<Record<string, CommentDto[]>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [loadingComments, setLoadingComments] = useState<Record<string, boolean>>({});

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050/api/v1';

  // Read URL params
  useEffect(() => {
    const typeParam = searchParams.get('type');
    const catParam = searchParams.get('category');
    if (typeParam) setSelectedType(typeParam);
    if (catParam) setSelectedCategory(catParam);
  }, [searchParams]);

  // Load feed
  const loadPosts = async () => {
    setLoading(true);
    try {
      const queryParts: string[] = [];
      if (selectedType !== 'ALL') queryParts.push(`postType=${selectedType}`);
      if (selectedCategory !== 'ALL') queryParts.push(`category=${encodeURIComponent(selectedCategory)}`);
      if (searchQuery.trim()) queryParts.push(`search=${encodeURIComponent(searchQuery.trim())}`);

      const queryString = queryParts.length ? `?${queryParts.join('&')}` : '';

      const res = await fetch(`${apiUrl}/posts${queryString}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setPosts(data.data);
      }
    } catch {
      // Handled silently
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, [selectedType, selectedCategory, searchQuery, token]);

  // Handle Image Upload for New Post
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    setIsUploadingMedia(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch(`${apiUrl}/posts/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.data?.fileUrl) {
        setMediaUrls((prev) => [...prev, data.data.fileUrl]);
      }
    } catch {
      alert('Failed to upload image. Please ensure file is an image under 10MB.');
    } finally {
      setIsUploadingMedia(false);
      e.target.value = '';
    }
  };

  // Submit New Post
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      router.push('/login?redirect=/feed');
      return;
    }

    if (!postTitle.trim() || !postContent.trim()) {
      alert('Please fill in title and content.');
      return;
    }

    setIsSubmittingPost(true);

    try {
      const res = await fetch(`${apiUrl}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: postTitle,
          content: postContent,
          category: postCategory,
          postType,
          mediaUrls,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setPostTitle('');
        setPostContent('');
        setMediaUrls([]);
        setShowCreateModal(false);
        loadPosts();
      } else {
        alert(data?.error?.message || 'Failed to publish post.');
      }
    } catch {
      alert('Error publishing post.');
    } finally {
      setIsSubmittingPost(false);
    }
  };

  // Toggle Like
  const handleToggleLike = async (postId: string) => {
    if (!token) {
      router.push('/login?redirect=/feed');
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/posts/${postId}/like`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId
              ? {
                  ...p,
                  isLikedByMe: data.data.isLiked,
                  likesCount: data.data.likesCount,
                }
              : p
          )
        );
      }
    } catch {
      // Handled silently
    }
  };

  // Expand / Fetch Comments
  const handleToggleComments = async (postId: string) => {
    if (expandedComments[postId]) {
      // Collapse
      const copy = { ...expandedComments };
      delete copy[postId];
      setExpandedComments(copy);
      return;
    }

    setLoadingComments((prev) => ({ ...prev, [postId]: true }));
    try {
      const res = await fetch(`${apiUrl}/posts/${postId}/comments`);
      const data = await res.json();
      if (data.success) {
        setExpandedComments((prev) => ({ ...prev, [postId]: data.data || [] }));
      }
    } catch {
      // Handled silently
    } finally {
      setLoadingComments((prev) => ({ ...prev, [postId]: false }));
    }
  };

  // Add Comment
  const handleAddComment = async (postId: string) => {
    const text = commentInputs[postId]?.trim();
    if (!text) return;
    if (!token) {
      router.push('/login?redirect=/feed');
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: text }),
      });
      const data = await res.json();
      if (data.success) {
        setExpandedComments((prev) => ({
          ...prev,
          [postId]: [...(prev[postId] || []), data.data],
        }));
        setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId ? { ...p, commentsCount: p.commentsCount + 1 } : p
          )
        );
      }
    } catch {
      alert('Failed to post comment.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Banner / Feed Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8 bg-gradient-to-r from-brand-navy via-[#16355e] to-brand-blue p-6 rounded-3xl text-white shadow-lg">
        <div>
          <span className="text-brand-orange text-xs font-bold uppercase tracking-wider">
            Community Hub
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-0.5">
            Construction & Engineering Feed
          </h1>
          <p className="text-blue-100 text-xs sm:text-sm mt-1 max-w-xl">
            Ask construction questions, share site progress, and receive verified answers from registered Sri Lankan engineers.
          </p>
        </div>

        <button
          onClick={() => {
            if (!token) router.push('/login?redirect=/feed');
            else setShowCreateModal(true);
          }}
          className="btn-accent text-sm font-bold gap-2 whitespace-nowrap shadow-md"
        >
          <PlusCircle className="w-4 h-4" />
          Create Community Post
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Sidebar: Filters */}
        <div className="lg:col-span-1 space-y-6">
          {/* Search Box */}
          <div className="bg-white p-4 rounded-2xl border border-brand-border shadow-sm">
            <label className="block text-xs font-bold text-brand-navy uppercase mb-2">
              Search Discussions
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Keywords, cracks, tiles..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-brand-border text-xs text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
              <Search className="w-4 h-4 text-brand-muted absolute left-3 top-2.5" />
            </div>
          </div>

          {/* Post Type Filter */}
          <div className="bg-white p-4 rounded-2xl border border-brand-border shadow-sm space-y-1.5">
            <label className="block text-xs font-bold text-brand-navy uppercase mb-2 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-brand-blue" /> Post Type
            </label>
            {[
              { id: 'ALL', label: 'All Discussions' },
              { id: PostType.QUESTION, label: 'Questions & Answers' },
              { id: PostType.TIP, label: 'Practical Tips' },
              { id: PostType.PROJECT_UPDATE, label: 'Project Updates' },
              { id: PostType.GENERAL, label: 'General Discussions' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedType(t.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  selectedType === t.id
                    ? 'bg-brand-blue text-white font-bold'
                    : 'text-brand-text hover:bg-slate-50'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Construction Categories */}
          <div className="bg-white p-4 rounded-2xl border border-brand-border shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-brand-navy uppercase">
                Categories
              </label>
              {selectedCategory !== 'ALL' && (
                <button
                  onClick={() => setSelectedCategory('ALL')}
                  className="text-[11px] text-brand-blue hover:underline"
                >
                  Reset
                </button>
              )}
            </div>
            <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
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

        {/* Right Area: Feed Stream */}
        <div className="lg:col-span-3 space-y-6">
          {loading ? (
            <div className="min-h-[40vh] flex items-center justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-blue"></div>
            </div>
          ) : posts.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-brand-border text-center text-brand-muted space-y-3">
              <MessageSquare className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-brand-navy">No community posts yet</h3>
              <p className="text-xs max-w-md mx-auto">
                Be the first to ask a question or share a construction tip with the BuildLink community!
              </p>
              <button
                onClick={() => {
                  if (!token) router.push('/login?redirect=/feed');
                  else setShowCreateModal(true);
                }}
                className="btn-primary text-xs mt-2"
              >
                Start a Discussion
              </button>
            </div>
          ) : (
            posts.map((post) => {
              const authorInitials = post.author?.displayName
                ?.split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')
                .toUpperCase() || 'BL';

              const isCommentsOpen = Boolean(expandedComments[post.id]);
              const commentsList = expandedComments[post.id] || [];
              const isLoadingPostComments = loadingComments[post.id];

              return (
                <article
                  key={post.id}
                  className="bg-white rounded-2xl border border-brand-border shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Post Header */}
                  <div className="p-5 sm:p-6 pb-3">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-brand-navy text-white flex items-center justify-center font-bold text-xs shadow-sm">
                          {authorInitials}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-sm font-bold text-brand-navy">
                              {post.author.displayName}
                            </span>
                            {post.author.isVerifiedEngineer && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-brand-blue">
                                <ShieldCheck className="w-3 h-3 text-brand-blue" />
                                Verified Engineer
                              </span>
                            )}
                            {post.author.role === UserRole.ENGINEER && !post.author.isVerifiedEngineer && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700">
                                <HardHat className="w-3 h-3" />
                                Engineer
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-brand-muted flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3" />
                            {new Date(post.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-brand-text">
                          {post.category}
                        </span>
                        {post.postType === PostType.QUESTION && (
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
                            <HelpCircle className="w-3 h-3" /> Question
                          </span>
                        )}
                        {post.postType === PostType.TIP && (
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                            <Lightbulb className="w-3 h-3" /> Tip
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Post Title & Content */}
                    <h2 className="text-base sm:text-lg font-bold text-brand-navy mb-2 leading-snug">
                      {post.title}
                    </h2>
                    <p className="text-xs sm:text-sm text-brand-text leading-relaxed whitespace-pre-line">
                      {post.content}
                    </p>

                    {/* Media Gallery Grid */}
                    {post.mediaUrls && post.mediaUrls.length > 0 && (
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        {post.mediaUrls.map((url, idx) => (
                          <a
                            key={idx}
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="block rounded-xl overflow-hidden border border-brand-border bg-slate-50 aspect-video relative group"
                          >
                            <img
                              src={url}
                              alt="Post attachment"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Post Action Bar */}
                  <div className="px-5 sm:px-6 py-3 bg-slate-50/70 border-t border-brand-border flex items-center justify-between text-xs font-semibold text-brand-muted">
                    <div className="flex items-center gap-4">
                      {/* Like Button */}
                      <button
                        onClick={() => handleToggleLike(post.id)}
                        className={`inline-flex items-center gap-1.5 transition-colors ${
                          post.isLikedByMe
                            ? 'text-red-500 font-bold'
                            : 'hover:text-red-500 text-brand-text'
                        }`}
                      >
                        <Heart
                          className={`w-4 h-4 ${
                            post.isLikedByMe ? 'fill-red-500 text-red-500' : ''
                          }`}
                        />
                        <span>{post.likesCount} {post.likesCount === 1 ? 'Like' : 'Likes'}</span>
                      </button>

                      {/* Comments Toggle */}
                      <button
                        onClick={() => handleToggleComments(post.id)}
                        className="inline-flex items-center gap-1.5 hover:text-brand-blue text-brand-text transition-colors"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>{post.commentsCount} {post.commentsCount === 1 ? 'Comment' : 'Comments'}</span>
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText(window.location.href);
                        alert('Post link copied to clipboard!');
                      }}
                      className="inline-flex items-center gap-1.5 hover:text-brand-navy transition-colors"
                    >
                      <Share2 className="w-4 h-4" /> Share
                    </button>
                  </div>

                  {/* Expandable Comments Section */}
                  {isCommentsOpen && (
                    <div className="p-5 sm:p-6 bg-slate-50 border-t border-brand-border space-y-4">
                      <h4 className="text-xs font-bold text-brand-navy uppercase tracking-wider">
                        Discussion ({commentsList.length})
                      </h4>

                      {isLoadingPostComments ? (
                        <div className="text-center py-4 text-xs text-brand-muted">
                          Loading comments...
                        </div>
                      ) : commentsList.length === 0 ? (
                        <p className="text-xs text-brand-muted italic">
                          No replies yet. Share your experience or advice below.
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {commentsList.map((comm) => (
                            <div
                              key={comm.id}
                              className={`p-3.5 rounded-xl border text-xs ${
                                comm.isProfessionalAnswer
                                  ? 'bg-blue-50/70 border-brand-blue/40 shadow-sm'
                                  : 'bg-white border-brand-border'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-brand-navy">
                                    {comm.author.displayName}
                                  </span>
                                  {comm.isProfessionalAnswer && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-brand-blue text-white shadow-xs">
                                      <ShieldCheck className="w-3 h-3" /> Verified Engineer Answer
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-brand-muted">
                                  {new Date(comm.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-brand-text leading-relaxed mt-1">
                                {comm.content}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Comment Input Box */}
                      <div className="flex items-center gap-2 pt-2">
                        <input
                          type="text"
                          value={commentInputs[post.id] || ''}
                          onChange={(e) =>
                            setCommentInputs((prev) => ({
                              ...prev,
                              [post.id]: e.target.value,
                            }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddComment(post.id);
                          }}
                          placeholder={
                            token
                              ? 'Write a helpful reply or professional advice...'
                              : 'Sign in to reply...'
                          }
                          className="flex-grow px-3.5 py-2.5 rounded-xl border border-brand-border bg-white text-xs text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-blue"
                        />
                        <button
                          onClick={() => handleAddComment(post.id)}
                          className="btn-primary p-2.5 rounded-xl"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              );
            })
          )}
        </div>
      </div>

      {/* Create Post Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-brand-border max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-brand-border">
              <div>
                <h3 className="text-lg font-bold text-brand-navy">Create Community Post</h3>
                <p className="text-xs text-brand-muted">Share with homeowners and verified engineers</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-brand-muted hover:text-brand-navy font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-brand-navy mb-1">
                  Discussion Title
                </label>
                <input
                  type="text"
                  required
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  placeholder="e.g. Recommended waterproof membrane for exposed concrete roof terrace in Kandy"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border text-xs text-brand-navy focus:ring-2 focus:ring-brand-blue focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-brand-navy mb-1">
                    Post Type
                  </label>
                  <select
                    value={postType}
                    onChange={(e) => setPostType(e.target.value as PostType)}
                    className="w-full px-3 py-2 rounded-xl border border-brand-border text-xs text-brand-navy bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  >
                    <option value={PostType.QUESTION}>Question & Problem</option>
                    <option value={PostType.TIP}>Construction Tip</option>
                    <option value={PostType.PROJECT_UPDATE}>Project Update</option>
                    <option value={PostType.GENERAL}>General Discussion</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-navy mb-1">
                    Category
                  </label>
                  <select
                    value={postCategory}
                    onChange={(e) => setPostCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-brand-border text-xs text-brand-navy bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  >
                    {CONSTRUCTION_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-navy mb-1">
                  Content & Details
                </label>
                <textarea
                  rows={5}
                  required
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  placeholder="Describe your construction situation, materials being used, dimensions, and specific questions..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border text-xs text-brand-navy focus:ring-2 focus:ring-brand-blue focus:outline-none"
                />
              </div>

              {/* Photo Upload */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-brand-navy">
                  Attach Site Photos (Optional)
                </label>
                <label className="flex items-center justify-center gap-2 p-3 bg-slate-50 border border-brand-border border-dashed rounded-xl cursor-pointer hover:border-brand-blue transition-colors">
                  <UploadCloud className="w-4 h-4 text-brand-blue" />
                  <span className="text-xs font-medium text-brand-text">
                    {isUploadingMedia ? 'Uploading image...' : 'Upload Image (PNG, JPG)'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={isUploadingMedia}
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>

                {mediaUrls.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto py-1">
                    {mediaUrls.map((url, i) => (
                      <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border">
                        <img src={url} alt="upload preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setMediaUrls(mediaUrls.filter((_, idx) => idx !== i))}
                          className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-brand-border">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPost || isUploadingMedia}
                  className="btn-accent text-xs font-bold"
                >
                  {isSubmittingPost ? 'Publishing...' : 'Publish Post'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function FeedPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue"></div>
        </div>
      }
    >
      <FeedContent />
    </Suspense>
  );
}
