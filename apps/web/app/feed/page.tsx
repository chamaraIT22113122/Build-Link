'use client';

import React, { useState, useEffect, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import {
  PostDto,
  CommentDto,
  PostType,
  UserRole,
  ReactionType,
  StoryDto,
  ConstructionGroupDto,
  CONSTRUCTION_CATEGORIES,
  SRI_LANKAN_DISTRICTS,
} from '@buildlink/shared';
import {
  MessageSquare,
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
  CheckCircle2,
  ThumbsUp,
  Award,
  RotateCcw,
  MapPin,
  Users,
  Compass,
  Bookmark,
  TrendingUp,
  MoreHorizontal,
  ChevronRight,
  Eye,
  Smile,
  ImageIcon,
  FolderKanban,
  BookOpen,
  MessageCircle,
  Heart,
  UserPlus,
  Check,
  Briefcase,
} from 'lucide-react';
import Link from 'next/link';

// Facebook-style Multi-Reaction emojis and metadata
const REACTION_CONFIG: Record<
  ReactionType,
  { label: string; emoji: string; color: string; bg: string }
> = {
  [ReactionType.LIKE]: { label: 'Like', emoji: '👍', color: 'text-blue-500', bg: 'bg-blue-500/10' },
  [ReactionType.LOVE]: { label: 'Love', emoji: '❤️', color: 'text-red-500', bg: 'bg-red-500/10' },
  [ReactionType.INSIGHT]: { label: 'Insight', emoji: '💡', color: 'text-amber-500', bg: 'bg-amber-500/10' },
  [ReactionType.SOLID]: { label: 'Solid', emoji: '🏗️', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  [ReactionType.CAUTION]: { label: 'Caution', emoji: '⚠️', color: 'text-orange-500', bg: 'bg-orange-500/10' },
};

function FeedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, token } = useAuth();

  const [posts, setPosts] = useState<PostDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Stories (Facebook Site Snaps)
  const [stories, setStories] = useState<StoryDto[]>([]);
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [showStoryUploadModal, setShowStoryUploadModal] = useState(false);
  const [storyMediaUrl, setStoryMediaUrl] = useState('');
  const [storyCaption, setStoryCaption] = useState('');
  const [storyLocation, setStoryLocation] = useState('Colombo');
  const [isUploadingStory, setIsUploadingStory] = useState(false);

  // Groups list for sidebar & selector
  const [groups, setGroups] = useState<ConstructionGroupDto[]>([]);

  // Real Database Engineers for Right Sidebar
  const [onlineContacts, setOnlineContacts] = useState<
    Array<{
      id: string;
      engineerProfileId?: string;
      name: string;
      avatar: string;
      title: string;
      role: UserRole;
      isVerified: boolean;
      district: string;
      yearsOfExperience?: number;
      registrationBody?: string;
    }>
  >([]);
  const [connectedIds, setConnectedIds] = useState<Set<string>>(new Set());
  const [connectingId, setConnectingId] = useState<string | null>(null);

  // New Post Form State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postCategory, setPostCategory] = useState<string>(CONSTRUCTION_CATEGORIES[0]);
  const [postType, setPostType] = useState<PostType>(PostType.GENERAL);
  const [postLocationTag, setPostLocationTag] = useState<string>('Colombo');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [taggedEngineerSpecialty, setTaggedEngineerSpecialty] = useState<string>('');
  const [includePoll, setIncludePoll] = useState<boolean>(false);
  const [pollOption1, setPollOption1] = useState<string>('Ready-Mix Concrete (SLS 1253 Grade 30)');
  const [pollOption2, setPollOption2] = useState<string>('Site-Mixed Concrete with Waterproof Admixture');
  const [pollOption3, setPollOption3] = useState<string>('Consult Structural Engineer Before Pouring');
  const [userPollVotes, setUserPollVotes] = useState<Record<string, number>>({});
  const [featuredPollVote, setFeaturedPollVote] = useState<number | null>(null);
  const [repostTargetPost, setRepostTargetPost] = useState<PostDto | null>(null);
  const [repostComment, setRepostComment] = useState<string>('');
  const [isReposting, setIsReposting] = useState<boolean>(false);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);

  // Active Expanded Comments: Map of postId -> CommentDto[]
  const [expandedComments, setExpandedComments] = useState<Record<string, CommentDto[]>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [loadingComments, setLoadingComments] = useState<Record<string, boolean>>({});
  const [endorsedComments, setEndorsedComments] = useState<Set<string>>(new Set());

  // Active hover reaction dock popover: postId
  const [hoveredReactionPostId, setHoveredReactionPostId] = useState<string | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Instagram Double-Tap Heart Animation
  const [doubleTapPostId, setDoubleTapPostId] = useState<string | null>(null);
  const lastTapRef = useRef<{ [key: string]: number }>({});

  // Bookmarked posts set
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Set<string>>(new Set());

  // LinkedIn Live / Audio Q&A Events RSVP State (Batch C Item 4)
  const [rsvpedSessions, setRsvpedSessions] = useState<Set<string>>(new Set());
  const toggleRsvpSession = (sessionId: string) => {
    setRsvpedSessions((prev) => {
      const next = new Set(prev);
      if (next.has(sessionId)) next.delete(sessionId);
      else next.add(sessionId);
      return next;
    });
  };

  // Listen for global navbar & bottom nav create events
  useEffect(() => {
    const handleOpenCreatePost = () => setShowCreateModal(true);
    const handleOpenCreateStory = () => setShowStoryUploadModal(true);

    window.addEventListener('buildlink:open-create-post', handleOpenCreatePost);
    window.addEventListener('buildlink:open-create-story', handleOpenCreateStory);

    return () => {
      window.removeEventListener('buildlink:open-create-post', handleOpenCreatePost);
      window.removeEventListener('buildlink:open-create-story', handleOpenCreateStory);
    };
  }, []);

  const handleMediaDoubleTap = (postId: string) => {
    const now = Date.now();
    const lastTap = lastTapRef.current[postId] || 0;
    if (now - lastTap < 350) {
      setDoubleTapPostId(postId);
      setTimeout(() => setDoubleTapPostId(null), 900);
      handleReactToPost(postId, ReactionType.LOVE);
    }
    lastTapRef.current[postId] = now;
  };

  const toggleBookmark = (postId: string) => {
    setBookmarkedPosts((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) {
        next.delete(postId);
      } else {
        next.add(postId);
      }
      return next;
    });
  };

  const toggleEndorseComment = (commentId: string) => {
    setEndorsedComments((prev) => {
      const next = new Set(prev);
      if (next.has(commentId)) {
        next.delete(commentId);
      } else {
        next.add(commentId);
      }
      return next;
    });
  };

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
      if (selectedType !== 'ALL' && selectedType !== 'SAVED') queryParts.push(`postType=${selectedType}`);
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

  // Load Stories, Groups & Real Database Engineers
  useEffect(() => {
    const fetchStoriesAndGroups = async () => {
      try {
        const [storiesRes, groupsRes, engRes] = await Promise.all([
          fetch(`${apiUrl}/posts/stories`, { headers: token ? { Authorization: `Bearer ${token}` } : {} }),
          fetch(`${apiUrl}/posts/groups`, { headers: token ? { Authorization: `Bearer ${token}` } : {} }),
          fetch(`${apiUrl}/engineers`),
        ]);
        const storiesData = await storiesRes.json();
        const groupsData = await groupsRes.json();
        const engData = await engRes.json();
        if (storiesData.success && Array.isArray(storiesData.data)) {
          setStories(storiesData.data);
        }
        if (groupsData.success && Array.isArray(groupsData.data)) {
          setGroups(groupsData.data);
        }
        if (engData.success && Array.isArray(engData.data)) {
          setOnlineContacts(
            engData.data.map((e: any) => ({
              id: e.userId,
              engineerProfileId: e.id,
              name: e.displayName,
              avatar:
                e.avatarUrl ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
              title: e.title || 'Chartered Construction Engineer',
              role: UserRole.ENGINEER,
              isVerified: Boolean(e.isVerified),
              district: e.district || 'Colombo',
              yearsOfExperience: e.yearsOfExperience || 10,
              registrationBody: e.registrationBody || 'IESL',
            }))
          );
        }
        if (token) {
          const connRes = await fetch(`${apiUrl}/messages/connections`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const connData = await connRes.json();
          if (connData.success && Array.isArray(connData.data)) {
            setConnectedIds(new Set(connData.data.map((c: any) => c.connectedUserId)));
          }
        }
      } catch {
        // Retry once after 3s if backend is still initializing
        setTimeout(fetchStoriesAndGroups, 3000);
      }
    };

    fetchStoriesAndGroups();
  }, [token]);

  useEffect(() => {
    loadPosts();
  }, [selectedType, selectedCategory, searchQuery, token]);

  // Trigger Chat from Sidebar
  const handleOpenContactChat = (contact: (typeof onlineContacts)[0]) => {
    const event = new CustomEvent('buildlink:open-chat', {
      detail: {
        partnerId: contact.id,
        partnerName: contact.name,
        partnerAvatar: contact.avatar,
        partnerRole: contact.role,
        isVerifiedEngineer: contact.isVerified,
        partnerTitle: contact.title,
      },
    });
    window.dispatchEvent(event);
  };

  // LinkedIn-style 1-Click Connect from Sidebar
  const handleConnectContact = async (targetUserId: string) => {
    if (!token) {
      router.push('/login?redirect=/feed');
      return;
    }
    setConnectingId(targetUserId);
    try {
      const res = await fetch(`${apiUrl}/messages/connect/${targetUserId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setConnectedIds((prev) => new Set(prev).add(targetUserId));
      }
    } catch {
      // ignore
    } finally {
      setConnectingId(null);
    }
  };

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
      const selectedGroup = groups.find((g) => g.id === selectedGroupId);
      const pollTag =
        includePoll && pollOption1.trim() && pollOption2.trim()
          ? `\n\n[POLL: ${[pollOption1.trim(), pollOption2.trim(), pollOption3.trim()].filter(Boolean).join(' | ')}]`
          : '';
      const baseWithPoll = `${postContent.trim()}${pollTag}`;
      const finalContent = taggedEngineerSpecialty
        ? `🔔 [Tagged for Free Engineer Review: ${taggedEngineerSpecialty}]\n\n${baseWithPoll}`
        : baseWithPoll;

      const res = await fetch(`${apiUrl}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: postTitle.trim(),
          content: finalContent,
          category: postCategory,
          postType,
          mediaUrls,
          locationTag: postLocationTag,
          groupId: selectedGroupId || undefined,
          groupName: selectedGroup?.name || undefined,
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        setPosts((prev) => [data.data, ...prev]);
        setShowCreateModal(false);
        setPostTitle('');
        setPostContent('');
        setMediaUrls([]);
        setSelectedGroupId('');
        setTaggedEngineerSpecialty('');
        setIncludePoll(false);
      } else {
        alert(data.error?.message || 'Failed to create post.');
      }
    } catch {
      alert('Network error while publishing post.');
    } finally {
      setIsSubmittingPost(false);
    }
  };

  // LinkedIn-style Repost to Feed
  const handleRepostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repostTargetPost) return;
    if (!token) {
      router.push('/login?redirect=/feed');
      return;
    }

    setIsReposting(true);
    try {
      const cleanOriginal = repostTargetPost.content
        .replace(/🔔\s*\[Tagged for Free Engineer Review:[^\]]+\]\n\n/, '')
        .replace(/\[POLL:[^\]]+\]/, '')
        .trim();
      const repostBody = `🔁 [Reposted from ${repostTargetPost.author.displayName}]\n${
        repostComment.trim() ? `${repostComment.trim()}\n\n` : ''
      }❝ ${repostTargetPost.title} — ${cleanOriginal} ❞`;

      const res = await fetch(`${apiUrl}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: `Repost: ${repostTargetPost.title}`,
          content: repostBody,
          category: repostTargetPost.category,
          postType: repostTargetPost.postType,
          mediaUrls: repostTargetPost.mediaUrls || [],
          locationTag: repostTargetPost.locationTag || 'Colombo',
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setPosts((prev) => [data.data, ...prev]);
        setRepostTargetPost(null);
        setRepostComment('');
      }
    } catch {
      alert('Failed to repost.');
    } finally {
      setIsReposting(false);
    }
  };

  // Submit Story
  const handleCreateStory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      router.push('/login?redirect=/feed');
      return;
    }
    if (!storyMediaUrl.trim()) {
      alert('Please enter or select a photo URL for your site snap.');
      return;
    }

    setIsUploadingStory(true);
    try {
      const res = await fetch(`${apiUrl}/posts/stories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          mediaUrl: storyMediaUrl.trim(),
          caption: storyCaption.trim() || undefined,
          locationTag: storyLocation,
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setStories((prev) => [data.data, ...prev]);
        setShowStoryUploadModal(false);
        setStoryMediaUrl('');
        setStoryCaption('');
      }
    } catch {
      alert('Failed to post story.');
    } finally {
      setIsUploadingStory(false);
    }
  };

  // Facebook Reaction Handler
  const handleReactToPost = async (postId: string, reactionType: ReactionType) => {
    if (!token) {
      router.push('/login?redirect=/feed');
      return;
    }

    // Optimistic UI update
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const wasActive = p.userReaction === reactionType;
          const nextReaction = wasActive ? null : reactionType;
          const currentCount = p.likesCount;
          const nextCount = wasActive ? Math.max(0, currentCount - 1) : p.userReaction ? currentCount : currentCount + 1;

          return {
            ...p,
            isLikedByMe: !wasActive,
            userReaction: nextReaction,
            likesCount: nextCount,
          };
        }
        return p;
      })
    );

    setHoveredReactionPostId(null);

    try {
      const res = await fetch(`${apiUrl}/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reaction: reactionType }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId
              ? {
                  ...p,
                  isLikedByMe: data.data.isLiked,
                  likesCount: data.data.likesCount,
                  userReaction: data.data.userReaction,
                  reactionBreakdown: data.data.reactionBreakdown,
                }
              : p
          )
        );
      }
    } catch {
      loadPosts();
    }
  };

  // Toggle Comments Drawer
  const toggleComments = async (postId: string) => {
    if (expandedComments[postId]) {
      setExpandedComments((prev) => {
        const next = { ...prev };
        delete next[postId];
        return next;
      });
      return;
    }

    setLoadingComments((prev) => ({ ...prev, [postId]: true }));
    try {
      const res = await fetch(`${apiUrl}/posts/${postId}/comments`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setExpandedComments((prev) => ({ ...prev, [postId]: data.data }));
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
    if (!text || !token) return;

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
      if (data.success && data.data) {
        setExpandedComments((prev) => ({
          ...prev,
          [postId]: [...(prev[postId] || []), data.data],
        }));
        setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
        setPosts((prev) =>
          prev.map((p) => (p.id === postId ? { ...p, commentsCount: p.commentsCount + 1 } : p))
        );
      }
    } catch {
      alert('Failed to post comment.');
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg py-6 px-3 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ========================================================
            LEFT SIDEBAR (Facebook Navigation & Shortcuts)
           ======================================================== */}
        <aside className="hidden lg:block lg:col-span-3 space-y-4 sticky top-20 self-start">
          {/* LinkedIn-Style User Profile Card */}
          <div className="bg-brand-surface border border-brand-border rounded-2xl overflow-hidden shadow-sm">
            <div className="h-14 bg-gradient-to-r from-brand-navy via-slate-800 to-brand-blue relative">
              <span className="absolute top-2.5 right-3 text-[10px] font-bold text-emerald-300 bg-white/10 border border-white/15 px-2 py-0.5 rounded-full">
                Free Network
              </span>
            </div>

            <div className="px-4 pb-4 -mt-7">
              <div className="flex items-end justify-between mb-2">
                <Link href="/profile" className="relative inline-block">
                  <div className="w-14 h-14 rounded-2xl bg-brand-primary/20 text-brand-primary ring-4 ring-white shadow-md overflow-hidden flex items-center justify-center font-bold text-base bg-white">
                    {user?.profile?.avatarUrl ? (
                      <img
                        src={user.profile.avatarUrl}
                        alt={user.profile.displayName || 'User'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      (user?.profile?.displayName || 'User').substring(0, 2).toUpperCase()
                    )}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                </Link>

                {user?.role === UserRole.ENGINEER ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-brand-blue border border-blue-200">
                    <ShieldCheck className="w-3 h-3" /> Verified Pro
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" /> Member
                  </span>
                )}
              </div>

              <Link
                href="/profile"
                className="text-sm font-extrabold text-brand-text hover:text-brand-primary transition-colors truncate block"
              >
                {user ? user.profile?.displayName || 'My Profile' : 'Guest Home Builder'}
              </Link>
              <p className="text-[11px] text-brand-muted line-clamp-1 mt-0.5">
                {user?.engineerProfile?.title ||
                  (user?.role === UserRole.ENGINEER ? 'Chartered Construction Engineer' : 'Homeowner & Construction Builder')}
              </p>
              {user?.profile?.district && (
                <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-1">
                  <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                  <span>{user.profile.district}, Sri Lanka</span>
                </p>
              )}

              <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-center">
                <Link href="/engineers" className="p-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                  <span className="block text-xs font-extrabold text-brand-navy">{onlineContacts.length}</span>
                  <span className="text-[10px] text-brand-muted">Verified Engineers</span>
                </Link>
                <Link href="/groups" className="p-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                  <span className="block text-xs font-extrabold text-brand-navy">{groups.length}</span>
                  <span className="text-[10px] text-brand-muted">Expert Groups</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Facebook Shortcuts Menu */}
          <div className="bg-brand-surface border border-brand-border rounded-2xl p-2.5 shadow-sm space-y-1 text-xs">
            <Link
              href="/feed"
              className="flex items-center space-x-3 px-3 py-2.5 rounded-xl bg-brand-primary/10 text-brand-primary font-semibold transition-colors"
            >
              <Building className="w-4 h-4" />
              <span>News Feed</span>
            </Link>

            <Link
              href="/groups"
              className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-brand-text hover:bg-brand-card transition-colors font-medium"
            >
              <Users className="w-4 h-4 text-emerald-500" />
              <div className="flex-1 flex items-center justify-between">
                <span>Construction Groups</span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-600 px-1.5 py-0.5 rounded font-bold">
                  {groups.length}
                </span>
              </div>
            </Link>

            <Link
              href="/engineers"
              className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-brand-text hover:bg-brand-card transition-colors font-medium"
            >
              <HardHat className="w-4 h-4 text-amber-500" />
              <span>Verified Engineers</span>
            </Link>

            <Link
              href="/projects"
              className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-brand-text hover:bg-brand-card transition-colors font-medium"
            >
              <FolderKanban className="w-4 h-4 text-indigo-500" />
              <span>Project Workspaces</span>
            </Link>

            <Link
              href="/questions"
              className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-brand-text hover:bg-brand-card transition-colors font-medium"
            >
              <HelpCircle className="w-4 h-4 text-rose-500" />
              <span>Questions Hub</span>
            </Link>

            <Link
              href="/knowledge"
              className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-brand-text hover:bg-brand-card transition-colors font-medium"
            >
              <BookOpen className="w-4 h-4 text-cyan-500" />
              <span>Building Codes & SLS</span>
            </Link>

            <Link
              href="/messages"
              className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-brand-text hover:bg-brand-card transition-colors font-medium"
            >
              <MessageCircle className="w-4 h-4 text-purple-500" />
              <span>Full Messenger</span>
            </Link>
          </div>

          {/* Quick Communities Widget */}
          <div className="bg-brand-surface border border-brand-border rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-brand-text uppercase tracking-wider">
                Popular Groups
              </h4>
              <Link href="/groups" className="text-[11px] text-brand-primary font-semibold hover:underline">
                See all
              </Link>
            </div>
            <div className="space-y-2">
              {groups.slice(0, 3).map((g) => (
                <Link
                  key={g.id}
                  href={`/feed?category=${encodeURIComponent(g.category)}`}
                  className="flex items-center space-x-2.5 p-1.5 rounded-lg hover:bg-brand-card text-xs text-brand-text transition-colors group"
                >
                  <span className="text-base p-1.5 rounded-lg bg-brand-bg border border-brand-border group-hover:scale-105 transition-transform">
                    {g.icon || '🏗️'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate group-hover:text-brand-primary transition-colors">
                      {g.name}
                    </p>
                    <p className="text-[10px] text-brand-muted truncate">
                      {g.membersCount.toLocaleString()} members
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </aside>

        {/* ========================================================
            CENTER FEED (Stories, Composer & Rich Post Cards)
           ======================================================== */}
        <main className="col-span-1 lg:col-span-6 space-y-5">
          
          {/* --- 1. STORIES BAR (Facebook & Instagram Stories) --- */}
          <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between mb-2.5 px-1">
              <span className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                <span>📸</span>
                <span>Site Stories & Daily Snaps</span>
              </span>
              <span className="text-[11px] text-slate-500 font-medium">24h site updates</span>
            </div>

            <div className="flex items-center space-x-3 overflow-x-auto pb-1 scrollbar-none">
              {/* Add Story Card (Facebook style) */}
              <button
                onClick={() => {
                  if (!token) router.push('/login?redirect=/feed');
                  else setShowStoryUploadModal(true);
                }}
                className="w-28 h-44 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 flex flex-col justify-between overflow-hidden flex-shrink-0 transition-all shadow-xs group relative select-none"
              >
                <div className="h-28 w-full bg-slate-100 overflow-hidden flex items-center justify-center">
                  {user?.profile?.avatarUrl ? (
                    <img src={user.profile.avatarUrl} alt="Me" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-2xl">
                      {user?.profile?.displayName?.substring(0, 2).toUpperCase() || 'BL'}
                    </div>
                  )}
                </div>
                <div className="absolute top-24 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center ring-4 ring-white shadow-md group-hover:scale-110 transition-transform">
                  <PlusCircle className="w-5 h-5 stroke-[2.2px]" />
                </div>
                <div className="pb-2.5 pt-4 text-center px-1">
                  <p className="text-[11px] font-bold text-slate-900 leading-tight">Create story</p>
                </div>
              </button>

              {/* Story Items */}
              {stories.map((story, idx) => (
                <div
                  key={story.id}
                  onClick={() => setActiveStoryIndex(idx)}
                  className="w-28 h-44 rounded-2xl relative overflow-hidden flex-shrink-0 cursor-pointer shadow-xs group select-none hover:shadow-lg transition-all"
                >
                  <img
                    src={story.mediaUrl}
                    alt={story.caption || 'Site story'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/30" />
                  
                  {/* Top Avatar with Instagram Sunset Gradient Ring */}
                  <div className="absolute top-2.5 left-2.5">
                    <div className="p-[2px] rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 shadow-md">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-white ring-2 ring-white">
                        {story.authorAvatar ? (
                          <img src={story.authorAvatar} alt={story.authorName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                            {story.authorName.substring(0, 1)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Text */}
                  <div className="absolute bottom-2.5 left-2.5 right-2.5 text-white">
                    <p className="text-xs font-bold truncate leading-tight drop-shadow">{story.authorName}</p>
                    {story.locationTag && (
                      <p className="text-[9px] text-white/90 truncate flex items-center space-x-0.5 drop-shadow mt-0.5 font-medium">
                        <MapPin className="w-2.5 h-2.5 text-emerald-400 inline" />
                        <span>{story.locationTag}</span>
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* --- 2. FACEBOOK COMPOSER BAR --- */}
          <div className="bg-brand-surface border border-brand-border rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-brand-primary/20 text-brand-primary flex items-center justify-center font-bold text-xs flex-shrink-0">
                {user?.profile?.avatarUrl ? (
                  <img
                    src={user.profile.avatarUrl}
                    alt={user.profile.displayName || 'User'}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  (user?.profile?.displayName || 'User').substring(0, 2).toUpperCase()
                )}
              </div>

              <button
                onClick={() => {
                  if (!token) router.push('/login?redirect=/feed');
                  else setShowCreateModal(true);
                }}
                className="flex-1 bg-brand-bg hover:bg-brand-card text-left px-4 py-2.5 rounded-full text-xs text-brand-muted border border-brand-border transition-colors flex items-center justify-between"
              >
                <span>
                  {user ? `What are you building today, ${user.profile?.firstName || 'friend'}?` : "What's on your mind? Share site progress..."}
                </span>
                <Smile className="w-4 h-4 text-brand-muted/70" />
              </button>
            </div>

            <div className="pt-2 border-t border-brand-border/60 grid grid-cols-4 gap-1 text-center">
              <button
                onClick={() => {
                  if (!token) router.push('/login?redirect=/feed');
                  else {
                    setPostType(PostType.GENERAL);
                    setShowCreateModal(true);
                  }
                }}
                className="flex items-center justify-center space-x-1.5 py-1.5 rounded-xl hover:bg-brand-card text-xs font-semibold text-brand-text transition-colors"
              >
                <ImageIcon className="w-4 h-4 text-emerald-500" />
                <span className="hidden sm:inline">Photo/Video</span>
              </button>

              <button
                onClick={() => {
                  if (!token) router.push('/login?redirect=/feed');
                  else {
                    setPostType(PostType.QUESTION);
                    setShowCreateModal(true);
                  }
                }}
                className="flex items-center justify-center space-x-1.5 py-1.5 rounded-xl hover:bg-brand-card text-xs font-semibold text-brand-text transition-colors"
              >
                <HelpCircle className="w-4 h-4 text-rose-500" />
                <span className="hidden sm:inline">Ask Question</span>
              </button>

              <button
                onClick={() => {
                  if (!token) router.push('/login?redirect=/feed');
                  else {
                    setPostType(PostType.QUESTION);
                    setIncludePoll(true);
                    setShowCreateModal(true);
                  }
                }}
                className="flex items-center justify-center space-x-1.5 py-1.5 rounded-xl hover:bg-brand-card text-xs font-semibold text-brand-text transition-colors"
              >
                <Award className="w-4 h-4 text-amber-500" />
                <span className="hidden sm:inline">Create Poll</span>
              </button>

              <button
                onClick={() => {
                  if (!token) router.push('/login?redirect=/feed');
                  else {
                    setPostType(PostType.QUESTION);
                    setTaggedEngineerSpecialty('@Structural & Civil Engineers');
                    setShowCreateModal(true);
                  }
                }}
                className="flex items-center justify-center space-x-1.5 py-1.5 rounded-xl hover:bg-brand-card text-xs font-semibold text-brand-text transition-colors"
              >
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span className="hidden sm:inline">Tag Engineer</span>
              </button>
            </div>
          </div>

          {/* --- Filter Pills (Including Saved Bookmarks Tab) --- */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
            {['ALL', 'GENERAL', 'QUESTION', 'PROJECT_UPDATE', 'PROFESSIONAL_ADVICE', 'SAVED'].map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedType === type
                    ? 'bg-brand-text text-brand-bg'
                    : 'bg-brand-surface text-brand-muted hover:text-brand-text border border-brand-border'
                }`}
              >
                {type === 'ALL'
                  ? 'All Posts'
                  : type === 'PROJECT_UPDATE'
                  ? '🏗️ Site Milestones'
                  : type === 'QUESTION'
                  ? '❓ Questions'
                  : type === 'PROFESSIONAL_ADVICE'
                  ? '💡 Pro Advice'
                  : type === 'SAVED'
                  ? `🔖 Saved (${bookmarkedPosts.size})`
                  : 'General'}
              </button>
            ))}
          </div>

          {/* --- INTERACTIVE LINKEDIN-STYLE CONSTRUCTION POLL CARD --- */}
          {selectedType === 'ALL' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
                    📊 LIVE COMMUNITY POLL
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Sri Lankan Home Builders & IESL Engineers
                  </span>
                </div>
                <span className="text-[11px] font-bold text-brand-blue">
                  {148 + (featuredPollVote !== null ? 1 : 0)} votes
                </span>
              </div>

              <h3 className="text-sm font-extrabold text-slate-900">
                What is your preferred waterproofing system for flat concrete roof slabs in Sri Lanka&apos;s monsoon climate?
              </h3>

              <div className="space-y-2">
                {[
                  { label: '2-Coat Cementitious Polymer + Screed Slope (SLS Certified)', baseVotes: 68 },
                  { label: 'PU (Polyurethane) Liquid Membrane + UV Topcoat', baseVotes: 46 },
                  { label: 'Torch-On Bituminous Membrane Sheet + Protective Tiles', baseVotes: 24 },
                  { label: 'Add Lightweight Zn/Al Roof Over Concrete Slab', baseVotes: 10 },
                ].map((opt, idx) => {
                  const totalVotes = 148 + (featuredPollVote !== null ? 1 : 0);
                  const optVotes = opt.baseVotes + (featuredPollVote === idx ? 1 : 0);
                  const pct = Math.round((optVotes / totalVotes) * 100);
                  const isChosen = featuredPollVote === idx;

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setFeaturedPollVote(idx)}
                      className={`w-full text-left relative overflow-hidden rounded-xl border p-2.5 transition-all ${
                        isChosen
                          ? 'border-brand-blue bg-blue-50/30 ring-1 ring-brand-blue'
                          : 'border-slate-200 hover:border-brand-blue/60 bg-slate-50/50'
                      }`}
                    >
                      <div
                        className={`absolute inset-y-0 left-0 transition-all duration-500 ${
                          isChosen ? 'bg-brand-blue/15' : 'bg-slate-200/60'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                      <div className="relative z-10 flex items-center justify-between gap-2 text-xs">
                        <span className={`font-semibold ${isChosen ? 'text-brand-blue font-bold' : 'text-slate-800'}`}>
                          {isChosen && '✓ '}
                          {opt.label}
                        </span>
                        <span className="font-extrabold text-slate-900 shrink-0">{pct}%</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <p className="text-[11px] text-slate-400">
                Click any option to vote • Create your own poll using the <span className="font-bold text-slate-600">Create Poll</span> button above
              </p>
            </div>
          )}

          {/* --- 3. POSTS FEED --- */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-brand-surface border border-brand-border rounded-2xl h-64 animate-pulse" />
              ))}
            </div>
          ) : (selectedType === 'SAVED' ? posts.filter((p) => bookmarkedPosts.has(p.id)) : posts).length === 0 ? (
            <div className="bg-brand-surface border border-brand-border rounded-2xl p-12 text-center space-y-3">
              <Building className="w-12 h-12 text-brand-muted mx-auto" />
              <h3 className="font-bold text-base text-brand-text">
                {selectedType === 'SAVED' ? 'No saved posts yet' : 'No posts yet'}
              </h3>
              <p className="text-xs text-brand-muted">
                {selectedType === 'SAVED'
                  ? 'Click the bookmark icon on any engineering post or blueprint to save it here for quick site reference!'
                  : 'Be the first to share your construction project or ask a question!'}
              </p>
            </div>
          ) : (
            (selectedType === 'SAVED' ? posts.filter((p) => bookmarkedPosts.has(p.id)) : posts).map((post) => {
              const activeReaction = post.userReaction;
              const reactionInfo = activeReaction ? REACTION_CONFIG[activeReaction] : null;
              const pollMatch = post.content.match(/\[POLL:\s*([^\]]+)\]/);
              const pollChoices = pollMatch
                ? pollMatch[1].split('|').map((s) => s.trim()).filter(Boolean)
                : [];
              const repostMatch = post.content.match(/🔁\s*\[Reposted from\s*([^\]]+)\]/);

              return (
                <article
                  key={post.id}
                  className="bg-white border border-slate-200 rounded-2xl shadow-xs hover:shadow-md transition-shadow overflow-hidden space-y-3.5 select-none"
                >
                  {/* Post Header */}
                  <div className="p-4 pb-0 flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      {/* Author Avatar with Instagram Sunset Gradient Ring */}
                      <Link href={`/profile/${post.author.id}`} className="relative group/avatar block">
                        <div className="p-[2px] rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 shadow-xs group-hover/avatar:scale-105 transition-transform">
                          <div className="w-10 h-10 rounded-full bg-white ring-2 ring-white overflow-hidden flex items-center justify-center font-bold text-xs text-blue-600">
                            {post.author.avatarUrl ? (
                              <img
                                src={post.author.avatarUrl}
                                alt={post.author.displayName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              post.author.displayName.substring(0, 2).toUpperCase()
                            )}
                          </div>
                        </div>
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                      </Link>

                      <div>
                        <div className="flex items-center space-x-1.5 flex-wrap">
                          <Link
                            href={`/profile/${post.author.id}`}
                            className="text-xs font-bold text-slate-900 hover:underline cursor-pointer"
                          >
                            {post.author.displayName}
                          </Link>
                          {post.author.isVerifiedEngineer ? (
                            <>
                              <span className="inline-flex items-center space-x-0.5 text-blue-600 text-[11px] font-semibold" title="Verified Engineer">
                                <ShieldCheck className="w-4 h-4 text-blue-600" />
                                <span>Verified</span>
                              </span>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                🏆 Top Engineering Voice
                              </span>
                            </>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              🏡 Active Builder
                            </span>
                          )}
                          {post.groupName && (
                            <span className="text-slate-400 text-xs flex items-center space-x-1">
                              <span>▶ in</span>
                              <Link
                                href={`/feed?category=${encodeURIComponent(post.category)}`}
                                className="font-semibold text-blue-600 hover:underline truncate max-w-[150px]"
                              >
                                {post.groupName}
                              </Link>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center space-x-1.5 text-[11px] text-slate-500">
                          <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                          <span>•</span>
                          {post.locationTag ? (
                            <span className="flex items-center space-x-0.5 text-slate-700 font-medium">
                              <MapPin className="w-3 h-3 text-rose-500" />
                              <span>{post.locationTag}</span>
                            </span>
                          ) : (
                            <span>🌐 Public</span>
                          )}
                          <span>•</span>
                          <span className="px-1.5 py-0.2 rounded bg-slate-100 text-[10px] font-semibold text-slate-600 border border-slate-200">
                            {post.category}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="relative">
                      <button
                        onClick={() => {
                          navigator.clipboard?.writeText(window.location.origin + `/profile/${post.author.id}`);
                          alert('Post & Profile link copied to clipboard!');
                        }}
                        className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100"
                        title="Copy link"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Post Content */}
                  <div className="px-4 space-y-2.5">
                    {/* LinkedIn "Tagged for Free Engineer Review" Banner */}
                    {(post.postType === PostType.QUESTION || post.content.includes('[Tagged for Free Engineer Review:')) && (
                      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-blue-50 via-indigo-50/70 to-emerald-50 border border-blue-200/80">
                        <div className="flex items-center gap-2 text-[11px] font-bold text-brand-navy">
                          <ShieldCheck className="w-4 h-4 text-brand-blue shrink-0" />
                          <span>
                            {post.content.match(/\[Tagged for Free Engineer Review:\s*([^\]]+)\]/)?.[1]
                              ? `Tagged for Free Engineer Review: ${post.content.match(/\[Tagged for Free Engineer Review:\s*([^\]]+)\]/)?.[1]}`
                              : `Open for Free Engineer Review • @${post.category} Specialists`}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (!expandedComments[post.id]) toggleComments(post.id);
                          }}
                          className="text-[10px] font-extrabold text-emerald-700 bg-white hover:bg-emerald-600 hover:text-white px-2.5 py-1 rounded-lg border border-emerald-200 transition-colors shadow-2xs"
                        >
                          {user?.role === UserRole.ENGINEER ? '✍️ Write Pro-Bono Answer' : 'View Engineer Answers'}
                        </button>
                      </div>
                    )}

                    <h3 className="text-sm font-bold text-slate-900 leading-snug">{post.title}</h3>
                    {repostMatch && (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-bold border border-slate-200">
                        <RotateCcw className="w-3 h-3 text-brand-blue" />
                        <span>Reposted from {repostMatch[1]}</span>
                      </div>
                    )}
                    <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                      {post.content
                        .replace(/🔔\s*\[Tagged for Free Engineer Review:[^\]]+\]\n\n/, '')
                        .replace(/🔁\s*\[Reposted from[^\]]+\]\n?/, '')
                        .replace(/\[POLL:[^\]]+\]/, '')
                        .trim()}
                    </p>

                    {/* Embedded Interactive Post Poll (if attached) */}
                    {pollChoices.length >= 2 && (
                      <div className="mt-2 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                          <span>📊 Community Poll</span>
                          <span>{24 + (userPollVotes[post.id] !== undefined ? 1 : 0)} votes</span>
                        </div>
                        {pollChoices.map((choice, cIdx) => {
                          const baseV = (cIdx === 0 ? 12 : cIdx === 1 ? 8 : 4) + (userPollVotes[post.id] === cIdx ? 1 : 0);
                          const totV = 24 + (userPollVotes[post.id] !== undefined ? 1 : 0);
                          const pct = Math.round((baseV / totV) * 100);
                          const isVoted = userPollVotes[post.id] === cIdx;
                          return (
                            <button
                              key={cIdx}
                              type="button"
                              onClick={() => setUserPollVotes((prev) => ({ ...prev, [post.id]: cIdx }))}
                              className={`w-full text-left relative overflow-hidden rounded-xl border p-2 transition-all ${
                                isVoted
                                  ? 'border-brand-blue bg-blue-50/40'
                                  : 'border-slate-200 bg-white hover:border-brand-blue/50'
                              }`}
                            >
                              <div
                                className={`absolute inset-y-0 left-0 transition-all duration-500 ${
                                  isVoted ? 'bg-brand-blue/15' : 'bg-slate-200/60'
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                              <div className="relative z-10 flex items-center justify-between text-xs">
                                <span className={`font-semibold ${isVoted ? 'text-brand-blue font-bold' : 'text-slate-800'}`}>
                                  {isVoted && '✓ '}
                                  {choice}
                                </span>
                                <span className="font-bold text-slate-900">{pct}%</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Facebook Multi-Image Gallery with Instagram Double-Tap Like */}
                  {post.mediaUrls && post.mediaUrls.length > 0 && (
                    <div
                      className="mt-2 bg-black relative select-none cursor-pointer overflow-hidden"
                      onClick={() => handleMediaDoubleTap(post.id)}
                    >
                      {post.mediaUrls.length === 1 ? (
                        <div className="max-h-[460px] overflow-hidden flex items-center justify-center bg-black">
                          <img
                            src={post.mediaUrls[0]}
                            alt={post.title}
                            className="w-full object-contain max-h-[460px]"
                          />
                        </div>
                      ) : post.mediaUrls.length === 2 ? (
                        <div className="grid grid-cols-2 gap-1 max-h-[360px]">
                          <img src={post.mediaUrls[0]} alt="Media 1" className="w-full h-72 object-cover" />
                          <img src={post.mediaUrls[1]} alt="Media 2" className="w-full h-72 object-cover" />
                        </div>
                      ) : post.mediaUrls.length === 3 ? (
                        <div className="grid grid-cols-3 gap-1 max-h-[320px]">
                          <img src={post.mediaUrls[0]} alt="Media 1" className="col-span-2 w-full h-72 object-cover" />
                          <div className="flex flex-col gap-1">
                            <img src={post.mediaUrls[1]} alt="Media 2" className="w-full h-36 object-cover" />
                            <img src={post.mediaUrls[2]} alt="Media 3" className="w-full h-36 object-cover" />
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-1 max-h-[360px]">
                          <img src={post.mediaUrls[0]} alt="Media 1" className="w-full h-40 object-cover" />
                          <img src={post.mediaUrls[1]} alt="Media 2" className="w-full h-40 object-cover" />
                          <img src={post.mediaUrls[2]} alt="Media 3" className="w-full h-40 object-cover" />
                          <div className="relative w-full h-40">
                            <img src={post.mediaUrls[3]} alt="Media 4" className="w-full h-full object-cover" />
                            {post.mediaUrls.length > 4 && (
                              <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-bold text-lg">
                                +{post.mediaUrls.length - 4} more
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Instagram Bursting Heart Animation on Double-Tap */}
                      {doubleTapPostId === post.id && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20 animate-in zoom-in-50 duration-200">
                          <Heart className="w-24 h-24 text-red-500 fill-red-500 drop-shadow-2xl animate-bounce" />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Reaction Summary Counters Row */}
                  <div className="px-4 py-1.5 flex items-center justify-between text-xs text-slate-500 border-b border-slate-100 select-none">
                    <div className="flex items-center space-x-1.5">
                      {post.likesCount > 0 ? (
                        <>
                          <div className="flex items-center -space-x-1">
                            <span className="w-5 h-5 rounded-full bg-blue-500 text-white text-[10px] flex items-center justify-center shadow-xs">
                              👍
                            </span>
                            <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center shadow-xs">
                              ❤️
                            </span>
                            <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-[10px] flex items-center justify-center shadow-xs">
                              🏗️
                            </span>
                          </div>
                          <span className="font-semibold text-slate-800 ml-1">
                            {post.likesCount}
                          </span>
                        </>
                      ) : (
                        <span>Be the first to react</span>
                      )}
                    </div>

                    <div className="flex items-center space-x-3 text-[11px]">
                      <button onClick={() => toggleComments(post.id)} className="hover:underline">
                        {post.commentsCount} comments
                      </button>
                      <span>•</span>
                      <span>14 shares</span>
                    </div>
                  </div>

                  {/* Action Bar (Like with Facebook Hover Dock, Comment, Share, Instagram Bookmark) */}
                  <div className="px-4 pb-2 relative flex items-center justify-between text-xs font-semibold text-slate-600 gap-1">
                    
                    {/* Hover Reaction Popover Dock */}
                    {hoveredReactionPostId === post.id && (
                      <div
                        onMouseEnter={() => {
                          if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
                        }}
                        onMouseLeave={() => setHoveredReactionPostId(null)}
                        className="absolute bottom-10 left-4 bg-white border border-slate-200 rounded-full shadow-2xl px-2.5 py-1.5 flex items-center space-x-2 z-30 animate-in fade-in zoom-in-95 duration-150"
                      >
                        {(Object.keys(REACTION_CONFIG) as ReactionType[]).map((rKey) => {
                          const conf = REACTION_CONFIG[rKey];
                          return (
                            <button
                              key={rKey}
                              onClick={() => handleReactToPost(post.id, rKey)}
                              className="hover:scale-125 transition-transform duration-150 p-1 flex flex-col items-center group/btn"
                              title={conf.label}
                            >
                              <span className="text-xl">{conf.emoji}</span>
                              <span className="text-[9px] font-bold text-slate-500 group-hover/btn:text-slate-900">
                                {conf.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Main Like Button */}
                    <div
                      className="relative flex-1"
                      onMouseEnter={() => {
                        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
                        setHoveredReactionPostId(post.id);
                      }}
                      onMouseLeave={() => {
                        hoverTimeoutRef.current = setTimeout(() => {
                          setHoveredReactionPostId(null);
                        }, 400);
                      }}
                    >
                      <button
                        onClick={() => handleReactToPost(post.id, activeReaction || ReactionType.LIKE)}
                        className={`w-full py-2 rounded-xl flex items-center justify-center space-x-2 transition-colors hover:bg-slate-100 ${
                          reactionInfo ? `${reactionInfo.color} font-bold` : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <span className="text-base">{reactionInfo ? reactionInfo.emoji : '👍'}</span>
                        <span>{reactionInfo ? reactionInfo.label : 'Like'}</span>
                      </button>
                    </div>

                    {/* Comment Button */}
                    <button
                      onClick={() => toggleComments(post.id)}
                      className="flex-1 py-2 rounded-xl flex items-center justify-center space-x-2 transition-colors hover:bg-slate-100 hover:text-slate-900 text-slate-600"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Comment</span>
                    </button>

                    {/* LinkedIn Repost / Share Button */}
                    <button
                      onClick={() => {
                        if (!token) {
                          router.push('/login?redirect=/feed');
                          return;
                        }
                        setRepostTargetPost(post);
                      }}
                      className="flex-1 py-2 rounded-xl flex items-center justify-center space-x-2 transition-colors hover:bg-slate-100 hover:text-brand-blue text-slate-600"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Repost</span>
                    </button>

                    {/* Instagram Bookmark Button */}
                    <button
                      onClick={() => toggleBookmark(post.id)}
                      className={`p-2 rounded-xl flex items-center justify-center transition-colors hover:bg-slate-100 ${
                        bookmarkedPosts.has(post.id) ? 'text-amber-500' : 'text-slate-400 hover:text-slate-700'
                      }`}
                      title={bookmarkedPosts.has(post.id) ? 'Saved to bookmarks' : 'Save post'}
                    >
                      <Bookmark className={`w-4 h-4 ${bookmarkedPosts.has(post.id) ? 'fill-amber-500' : ''}`} />
                    </button>
                  </div>

                  {/* Expanded Comments Section */}
                  {expandedComments[post.id] && (
                    <div className="px-4 pb-4 pt-2 border-t border-slate-100 space-y-3 bg-slate-50/60">
                      {/* Comment Input */}
                      <div className="flex items-start space-x-2.5">
                        <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
                          {user?.profile?.displayName ? user.profile.displayName.substring(0, 2).toUpperCase() : 'ME'}
                        </div>
                        <div className="flex-1 flex items-center space-x-2">
                          <input
                            type="text"
                            value={commentInputs[post.id] || ''}
                            onChange={(e) =>
                              setCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleAddComment(post.id);
                            }}
                            placeholder="Write a comment or advice..."
                            className="flex-1 bg-white border border-slate-200 rounded-full px-3.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                          />
                          <button
                            onClick={() => handleAddComment(post.id)}
                            disabled={!commentInputs[post.id]?.trim()}
                            className="p-1.5 rounded-full bg-blue-600 text-white disabled:opacity-40 hover:bg-blue-700 transition-colors"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Comments Thread */}
                      <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                        {loadingComments[post.id] ? (
                          <p className="text-center text-xs text-slate-400 py-2">Loading comments...</p>
                        ) : expandedComments[post.id].length === 0 ? (
                          <p className="text-center text-xs text-slate-400 py-2">No comments yet. Start the conversation!</p>
                        ) : (
                          expandedComments[post.id].map((comm) => {
                            const isEndorsed = endorsedComments.has(comm.id);
                            const baseEndorsements = comm.author.isVerifiedEngineer
                              ? (comm.id.charCodeAt(0) % 5) + 3
                              : 0;
                            const totalEndorsements = baseEndorsements + (isEndorsed ? 1 : 0);

                            return (
                              <div key={comm.id} className="flex items-start space-x-2.5 text-xs">
                                <Link
                                  href={`/profile/${comm.author.id}`}
                                  className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 border border-slate-300 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5 hover:opacity-80"
                                >
                                  {comm.author.displayName.substring(0, 2).toUpperCase()}
                                </Link>
                                <div className="flex-1 space-y-1">
                                  <div
                                    className={`rounded-2xl px-3.5 py-2.5 space-y-1 shadow-xs ${
                                      comm.author.isVerifiedEngineer
                                        ? 'bg-gradient-to-r from-emerald-50/60 via-white to-blue-50/40 border-l-4 border-l-emerald-500 border border-emerald-200/80'
                                        : 'bg-white border border-slate-200'
                                    }`}
                                  >
                                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                                      <div className="flex items-center space-x-1.5">
                                        <Link href={`/profile/${comm.author.id}`} className="font-bold text-slate-900 hover:underline">
                                          {comm.author.displayName}
                                        </Link>
                                        {comm.author.isVerifiedEngineer && (
                                          <span className="bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded-full text-[10px] font-bold flex items-center">
                                            <ShieldCheck className="w-3 h-3 mr-0.5 text-blue-600" />
                                            <span>IESL Verified Solution</span>
                                          </span>
                                        )}
                                      </div>

                                      {comm.author.isVerifiedEngineer && (
                                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                                          ✓ Pro-Bono Guidance
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-slate-800 leading-relaxed">{comm.content}</p>
                                  </div>

                                  <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-500 px-2 font-medium">
                                    <span>{new Date(comm.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>

                                    {comm.author.isVerifiedEngineer && (
                                      <button
                                        type="button"
                                        onClick={() => toggleEndorseComment(comm.id)}
                                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold transition-all ${
                                          isEndorsed
                                            ? 'bg-emerald-600 text-white shadow-2xs'
                                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                                        }`}
                                      >
                                        <Award className="w-3 h-3" />
                                        <span>
                                          {isEndorsed ? 'Endorsed Solution' : 'Endorse Technical Solution'} ({totalEndorsements})
                                        </span>
                                      </button>
                                    )}

                                    <button className="hover:underline font-semibold text-slate-700">Helpful</button>
                                    <button className="hover:underline font-semibold text-slate-700">Reply</button>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </article>
              );
            })
          )}
        </main>

        {/* ========================================================
            RIGHT SIDEBAR (Contacts & Instant Docked Chat)
           ======================================================== */}
        <aside className="hidden lg:block lg:col-span-3 space-y-4 sticky top-20 self-start">
          
          {/* LinkedIn-Style Verified Engineers & Free Consultation Directory */}
          <div className="bg-brand-surface border border-brand-border rounded-2xl p-4 shadow-sm space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <h4 className="text-xs font-extrabold text-brand-navy uppercase tracking-wider">
                    Verified Engineers
                  </h4>
                </div>
                <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                  100% Free Community Advice & Q&A
                </p>
              </div>
              <Link
                href="/engineers"
                className="text-[11px] font-bold text-brand-blue hover:underline shrink-0"
              >
                View all ({onlineContacts.length})
              </Link>
            </div>

            <div className="space-y-3 divide-y divide-slate-100">
              {onlineContacts.map((contact) => {
                const isConnected = connectedIds.has(contact.id);
                return (
                  <div
                    key={contact.id}
                    className="pt-3 first:pt-0 space-y-2.5"
                  >
                    <div className="flex items-start space-x-2.5 min-w-0">
                      <Link href={`/profile/${contact.id}`} className="relative flex-shrink-0 group">
                        <img
                          src={contact.avatar}
                          alt={contact.name}
                          className="w-10 h-10 rounded-xl object-cover ring-1 ring-slate-200 group-hover:ring-brand-blue transition-all"
                        />
                        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                      </Link>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1 min-w-0">
                          <Link
                            href={`/profile/${contact.id}`}
                            className="text-xs font-extrabold text-slate-900 hover:text-brand-blue truncate transition-colors"
                          >
                            {contact.name}
                          </Link>
                          {contact.isVerified && (
                            <ShieldCheck
                              className="w-3.5 h-3.5 text-brand-blue shrink-0"
                              title="Verified IESL / CIDA Engineer"
                            />
                          )}
                        </div>

                        <p className="text-[11px] text-slate-600 font-medium line-clamp-1 leading-snug">
                          {contact.title}
                        </p>

                        <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                          <span className="flex items-center gap-0.5 text-slate-500 font-medium">
                            <MapPin className="w-2.5 h-2.5 text-rose-500 shrink-0" />
                            {contact.district}
                          </span>
                          <span>•</span>
                          <span className="text-emerald-600 font-bold">Free Advice</span>
                        </div>
                      </div>
                    </div>

                    {/* LinkedIn Action Row: Connect + Free Chat */}
                    <div className="grid grid-cols-2 gap-1.5 pl-12">
                      <button
                        type="button"
                        onClick={() => handleConnectContact(contact.id)}
                        disabled={isConnected || connectingId === contact.id}
                        className={`py-1.5 px-2.5 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 border transition-all ${
                          isConnected
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700 cursor-default'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-brand-blue hover:text-brand-blue'
                        }`}
                      >
                        {isConnected ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span>Connected</span>
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-3 h-3 text-brand-blue shrink-0" />
                            <span>Connect</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenContactChat(contact)}
                        className="py-1.5 px-2.5 rounded-lg text-[11px] font-bold bg-blue-50 hover:bg-brand-blue text-brand-blue hover:text-white border border-blue-100 flex items-center justify-center gap-1 transition-all"
                      >
                        <MessageCircle className="w-3 h-3 shrink-0" />
                        <span>Ask Free</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* LinkedIn "Top Engineering Voices" Weekly Leaderboard */}
          <div className="bg-brand-surface border border-brand-border rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center space-x-1.5 text-xs font-extrabold text-brand-navy uppercase tracking-wider">
                <Award className="w-4 h-4 text-amber-500" />
                <span>Top Engineering Voices</span>
              </div>
              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                This Week
              </span>
            </div>

            <div className="space-y-2.5">
              {onlineContacts.slice(0, 3).map((eng, idx) => (
                <div
                  key={eng.id}
                  className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-50/70 border border-slate-100 hover:border-amber-300 transition-all"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`w-5 h-5 rounded-full text-[10px] font-extrabold flex items-center justify-center shrink-0 ${
                        idx === 0
                          ? 'bg-amber-400 text-slate-950'
                          : idx === 1
                          ? 'bg-slate-300 text-slate-900'
                          : 'bg-amber-700/80 text-white'
                      }`}
                    >
                      #{idx + 1}
                    </span>
                    <img
                      src={eng.avatar}
                      alt={eng.name}
                      className="w-8 h-8 rounded-lg object-cover shrink-0 ring-1 ring-slate-200"
                    />
                    <div className="min-w-0">
                      <Link
                        href={`/profile/${eng.id}`}
                        className="text-xs font-bold text-slate-900 hover:text-brand-blue truncate block"
                      >
                        {eng.name}
                      </Link>
                      <p className="text-[10px] text-emerald-700 font-semibold truncate">
                        🏆 {48 - idx * 11} Free Solutions • 99% Helpful
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenContactChat(eng)}
                    className="px-2 py-1 rounded-lg bg-white hover:bg-brand-blue text-brand-blue hover:text-white border border-slate-200 text-[10px] font-bold shrink-0 transition-colors"
                  >
                    Ask
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* LinkedIn Live Audio / Free Engineer Q&A Sessions Widget (Batch C Item 4) */}
          <div className="bg-brand-surface border border-brand-border rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <div className="flex items-center space-x-1.5 text-xs font-extrabold text-brand-navy uppercase tracking-wider">
                  <span className="text-sm">🎙️</span>
                  <span>Free Live Q&A Sessions</span>
                </div>
                <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                  LinkedIn-style live sessions by IESL Engineers
                </p>
              </div>
              <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                100% Free
              </span>
            </div>

            <div className="space-y-2.5">
              {[
                {
                  id: 'live-nbro-slope',
                  title: 'NBRO Retaining Wall & Slope Drainage Clinic',
                  host: onlineContacts[0]?.name || 'Eng. Anura Wickramasinghe',
                  time: 'Sat, 6:00 PM IST • Live Audio',
                  attendees: 142,
                },
                {
                  id: 'live-slab-waterproof',
                  title: 'Monsoon Roof Slab Curing & Waterproofing Q&A',
                  host: onlineContacts[1]?.name || 'Eng. Kamal Silva',
                  time: 'Sun, 5:30 PM IST • Live Q&A',
                  attendees: 198,
                },
              ].map((sess) => {
                const isRsvped = rsvpedSessions.has(sess.id);
                const count = sess.attendees + (isRsvped ? 1 : 0);
                return (
                  <div
                    key={sess.id}
                    className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-2 hover:border-brand-blue/40 transition-all"
                  >
                    <div className="flex items-center justify-between text-[10px] font-bold">
                      <span className="text-brand-blue">{sess.time}</span>
                      <span className="text-slate-500">{count} builders attending</span>
                    </div>
                    <h5 className="text-xs font-extrabold text-slate-900 leading-snug">
                      {sess.title}
                    </h5>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] font-semibold text-slate-600 truncate max-w-[140px]">
                        Host: {sess.host}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleRsvpSession(sess.id)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer ${
                          isRsvped
                            ? 'bg-emerald-600 text-white shadow-2xs'
                            : 'bg-white text-brand-blue border border-blue-200 hover:bg-brand-blue hover:text-white'
                        }`}
                      >
                        {isRsvped ? '✓ Registered Free' : '+ RSVP Free'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Trending Sri Lankan Construction Topics */}
          <div className="bg-brand-surface border border-brand-border rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center space-x-2 text-xs font-bold text-brand-text uppercase tracking-wider">
              <TrendingUp className="w-4 h-4 text-brand-primary" />
              <span>Trending in Construction</span>
            </div>

            <div className="space-y-2.5 text-xs">
              {[
                { tag: '#ConcreteCuring', count: '1.4k posts', desc: 'SLS 1253 water immersion codes' },
                { tag: '#RoofSlabCasting', count: '890 posts', desc: 'Monsoon waterproofing techniques' },
                { tag: '#RetainingWalls', count: '540 posts', desc: 'NBRO slope safety in Kandy & Badulla' },
                { tag: '#SolarNetMetering', count: '760 posts', desc: 'CEB hybrid battery systems 2026' },
                { tag: '#CIDA_GradeBuilders', count: '420 posts', desc: 'Contractor vetting checklist' },
              ].map((item) => (
                <div
                  key={item.tag}
                  onClick={() => setSearchQuery(item.tag.replace('#', ''))}
                  className="p-2 rounded-xl hover:bg-brand-card cursor-pointer transition-colors"
                >
                  <p className="font-bold text-brand-text hover:text-brand-primary transition-colors">
                    {item.tag}
                  </p>
                  <p className="text-[10px] text-brand-muted">{item.desc}</p>
                  <span className="text-[9px] text-brand-primary font-semibold">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

      </div>

      {/* ========================================================
          FULL SCREEN / MODAL STORY VIEWER (Instagram & Facebook Stories Player)
         ======================================================== */}
      {activeStoryIndex !== null && stories[activeStoryIndex] && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-2 sm:p-4 select-none animate-fadeIn">
          {/* Close Story Button */}
          <button
            onClick={() => setActiveStoryIndex(null)}
            className="absolute top-4 right-4 text-white hover:text-slate-300 p-2.5 rounded-full bg-slate-900/80 hover:bg-slate-900 border border-white/20 z-30 transition-colors shadow-lg"
            title="Close Story"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Left Arrow (Previous) */}
          {activeStoryIndex > 0 && (
            <button
              onClick={() => setActiveStoryIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : prev))}
              className="hidden sm:flex absolute left-8 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 text-white items-center justify-center z-30 transition-all text-xl font-bold"
            >
              ‹
            </button>
          )}

          {/* Right Arrow (Next) */}
          {activeStoryIndex < stories.length - 1 && (
            <button
              onClick={() => setActiveStoryIndex((prev) => (prev !== null && prev < stories.length - 1 ? prev + 1 : prev))}
              className="hidden sm:flex absolute right-8 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 text-white items-center justify-center z-30 transition-all text-xl font-bold"
            >
              ›
            </button>
          )}

          <div className="relative w-full max-w-sm h-[680px] bg-slate-950 rounded-2xl overflow-hidden shadow-2xl flex flex-col justify-between">
            {/* Story Media */}
            <img
              src={stories[activeStoryIndex].mediaUrl}
              alt={stories[activeStoryIndex].caption || 'Story'}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-transparent to-black/70 pointer-events-none" />

            {/* Tap areas for mobile stories navigation */}
            <div
              onClick={() => {
                if (activeStoryIndex > 0) setActiveStoryIndex(activeStoryIndex - 1);
              }}
              className="absolute left-0 top-16 bottom-28 w-1/3 z-10 cursor-pointer"
            />
            <div
              onClick={() => {
                if (activeStoryIndex < stories.length - 1) setActiveStoryIndex(activeStoryIndex + 1);
                else setActiveStoryIndex(null);
              }}
              className="absolute right-0 top-16 bottom-28 w-2/3 z-10 cursor-pointer"
            />

            {/* Top Bar with Segmented Stories Progress Bars */}
            <div className="relative z-20 p-3.5 space-y-2.5">
              <div className="flex items-center space-x-1.5 w-full">
                {stories.map((_, sIdx) => (
                  <div key={sIdx} className="flex-1 bg-white/30 h-1 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-white transition-all duration-300 ${
                        sIdx < activeStoryIndex ? 'w-full' : sIdx === activeStoryIndex ? 'w-full animate-pulse' : 'w-0'
                      }`}
                    />
                  </div>
                ))}
              </div>

              {/* Author Row */}
              <div className="flex items-center space-x-2.5 text-white">
                <div className="p-[2px] rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-white ring-1 ring-white">
                    {stories[activeStoryIndex].authorAvatar ? (
                      <img
                        src={stories[activeStoryIndex].authorAvatar}
                        alt={stories[activeStoryIndex].authorName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                        {stories[activeStoryIndex].authorName.substring(0, 1)}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold leading-tight drop-shadow truncate">{stories[activeStoryIndex].authorName}</p>
                  <p className="text-[10px] text-white/80 drop-shadow">
                    {stories[activeStoryIndex].locationTag && `📍 ${stories[activeStoryIndex].locationTag} • `}
                    {new Date(stories[activeStoryIndex].createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Section: Caption, Quick Reactions & Reply */}
            <div className="relative z-20 p-4 text-white space-y-3">
              {stories[activeStoryIndex].caption && (
                <p className="text-xs font-medium leading-relaxed drop-shadow bg-black/50 backdrop-blur-md p-2.5 rounded-xl border border-white/10">
                  {stories[activeStoryIndex].caption}
                </p>
              )}

              {/* Instagram Quick Reaction Emojis */}
              <div className="flex items-center justify-around py-1">
                {['❤️', '😂', '😮', '😢', '👏', '🔥'].map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      alert(`Reacted ${emoji} to ${stories[activeStoryIndex].authorName}'s story!`);
                    }}
                    className="text-2xl hover:scale-130 transition-transform active:scale-95 drop-shadow"
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              {/* Reply Input Box */}
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder={`Reply to ${stories[activeStoryIndex].authorName}...`}
                  className="flex-1 bg-black/60 border border-white/30 rounded-full px-4 py-2 text-xs text-white placeholder:text-white/70 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => {
                    alert('Story reply sent to Messenger!');
                    setActiveStoryIndex(null);
                  }}
                  className="p-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          CREATE POST MODAL (Rich Facebook Composer)
         ======================================================== */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white text-slate-900 border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900">Create Construction Post</h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="p-5 overflow-y-auto space-y-4 text-xs bg-white">
              {/* Post Type Selector */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { type: PostType.GENERAL, label: 'General' },
                  { type: PostType.PROJECT_UPDATE, label: 'Site Milestone' },
                  { type: PostType.QUESTION, label: 'Question' },
                ].map((item) => (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => setPostType(item.type)}
                    className={`py-2 px-2.5 rounded-xl font-bold text-center border transition-all ${
                      postType === item.type
                        ? 'bg-brand-blue text-white border-brand-blue shadow-xs'
                        : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Title */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Title / Headline
                </label>
                <input
                  type="text"
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  placeholder="e.g., Concrete raft foundation casting in Kandy..."
                  className="w-full bg-slate-50 focus:bg-white text-slate-900 placeholder:text-slate-400 rounded-xl px-3.5 py-2.5 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  required
                />
              </div>

              {/* Group & Location Check-in Selectors */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Check-in Location
                  </label>
                  <select
                    value={postLocationTag}
                    onChange={(e) => setPostLocationTag(e.target.value)}
                    className="w-full bg-slate-50 focus:bg-white text-slate-900 rounded-xl px-3 py-2.5 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  >
                    {SRI_LANKAN_DISTRICTS.map((d) => (
                      <option key={d} value={d}>
                        📍 {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Post to Group (Optional)
                  </label>
                  <select
                    value={selectedGroupId}
                    onChange={(e) => setSelectedGroupId(e.target.value)}
                    className="w-full bg-slate-50 focus:bg-white text-slate-900 rounded-xl px-3 py-2.5 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  >
                    <option value="">No Group (Public Feed)</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.icon} {g.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Category & Tag Engineer for Free Review */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Construction Category
                  </label>
                  <select
                    value={postCategory}
                    onChange={(e) => setPostCategory(e.target.value)}
                    className="w-full bg-slate-50 focus:bg-white text-slate-900 rounded-xl px-3 py-2.5 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  >
                    {CONSTRUCTION_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-emerald-700 uppercase mb-1">
                    🔔 Tag Engineer for Free Review
                  </label>
                  <select
                    value={taggedEngineerSpecialty}
                    onChange={(e) => setTaggedEngineerSpecialty(e.target.value)}
                    className="w-full bg-emerald-50/60 focus:bg-white text-slate-900 rounded-xl px-3 py-2.5 border border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  >
                    <option value="">No Tag (General Community)</option>
                    <option value="@Structural & Foundation Engineers">@Structural & Foundation Engineers</option>
                    <option value="@NBRO Geotechnical & Slope Specialists">@NBRO Geotechnical & Slope Specialists</option>
                    <option value="@Chartered Quantity Surveyors (BOQ)">@Chartered Quantity Surveyors (BOQ)</option>
                    <option value="@MEP & Solar PV Systems Engineers">@MEP & Solar PV Systems Engineers</option>
                    <option value="@Waterproofing & Concrete Specialists">@Waterproofing & Concrete Specialists</option>
                    {onlineContacts.map((eng) => (
                      <option key={eng.id} value={`@${eng.name} (${eng.district})`}>
                        @{eng.name} ({eng.district})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Content */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Description / Site Details
                </label>
                <textarea
                  rows={4}
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  placeholder="Detail the materials used, challenges faced, or technical questions for verified engineers..."
                  className="w-full bg-slate-50 focus:bg-white text-slate-900 placeholder:text-slate-400 rounded-xl p-3 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  required
                />
              </div>

              {/* Optional Interactive Poll Builder */}
              <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-200/80 space-y-2.5">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-[11px] font-extrabold text-amber-900 uppercase flex items-center gap-1.5">
                    <span>📊 Attach Interactive Construction Poll</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={includePoll}
                    onChange={(e) => setIncludePoll(e.target.checked)}
                    className="w-4 h-4 accent-brand-blue rounded"
                  />
                </label>

                {includePoll && (
                  <div className="space-y-2 pt-1">
                    <input
                      type="text"
                      value={pollOption1}
                      onChange={(e) => setPollOption1(e.target.value)}
                      placeholder="Poll Option 1 (e.g., Ready-Mix Concrete Grade 30)"
                      className="w-full bg-white text-slate-900 rounded-lg px-3 py-2 border border-amber-300 text-xs"
                    />
                    <input
                      type="text"
                      value={pollOption2}
                      onChange={(e) => setPollOption2(e.target.value)}
                      placeholder="Poll Option 2 (e.g., Site-Mixed with Waterproof Admixture)"
                      className="w-full bg-white text-slate-900 rounded-lg px-3 py-2 border border-amber-300 text-xs"
                    />
                    <input
                      type="text"
                      value={pollOption3}
                      onChange={(e) => setPollOption3(e.target.value)}
                      placeholder="Poll Option 3 (Optional)"
                      className="w-full bg-white text-slate-900 rounded-lg px-3 py-2 border border-amber-300 text-xs"
                    />
                  </div>
                )}
              </div>

              {/* Photo Upload & Previews */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-slate-700 uppercase">
                  Attach Site Photos
                </label>
                <div className="flex flex-wrap gap-2">
                  {mediaUrls.map((url, i) => (
                    <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 group">
                      <img src={url} alt={`Preview ${i}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setMediaUrls((prev) => prev.filter((_, idx) => idx !== i))}
                        className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}

                  <label className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-300 hover:border-brand-blue flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50 hover:bg-slate-100">
                    <UploadCloud className="w-5 h-5 text-slate-500" />
                    <span className="text-[9px] text-slate-500 font-bold mt-1">Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={isUploadingMedia}
                      className="hidden"
                    />
                  </label>
                </div>
                {isUploadingMedia && <p className="text-[10px] text-brand-blue font-bold animate-pulse">Uploading photo...</p>}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPost || !postTitle.trim() || !postContent.trim()}
                  className="px-5 py-2.5 rounded-xl bg-brand-blue hover:bg-blue-700 text-white font-bold text-xs shadow-md disabled:opacity-40 transition-colors"
                >
                  {isSubmittingPost ? 'Publishing...' : 'Publish Post'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          CREATE STORY MODAL
         ======================================================== */}
      {showStoryUploadModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white text-slate-900 border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-sm text-slate-900">Post a Site Story Snap</h3>
              <button
                type="button"
                onClick={() => setShowStoryUploadModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateStory} className="space-y-3 bg-white">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Site Photo URL</label>
                <input
                  type="url"
                  value={storyMediaUrl}
                  onChange={(e) => setStoryMediaUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/... or paste image URL"
                  className="w-full bg-slate-50 focus:bg-white text-slate-900 placeholder:text-slate-400 rounded-xl px-3.5 py-2.5 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Location Check-in</label>
                <select
                  value={storyLocation}
                  onChange={(e) => setStoryLocation(e.target.value)}
                  className="w-full bg-slate-50 focus:bg-white text-slate-900 rounded-xl px-3.5 py-2.5 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                >
                  {SRI_LANKAN_DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      📍 {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Quick Caption</label>
                <input
                  type="text"
                  value={storyCaption}
                  onChange={(e) => setStoryCaption(e.target.value)}
                  placeholder="e.g., Concrete slab reinforcement ready for inspection!"
                  className="w-full bg-slate-50 focus:bg-white text-slate-900 placeholder:text-slate-400 rounded-xl px-3.5 py-2.5 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowStoryUploadModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploadingStory || !storyMediaUrl.trim()}
                  className="px-5 py-2.5 rounded-xl bg-brand-blue hover:bg-blue-700 text-white font-bold shadow-md disabled:opacity-40"
                >
                  {isUploadingStory ? 'Sharing...' : 'Share to Story'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          LINKEDIN-STYLE REPOST WITH THOUGHTS MODAL
         ======================================================== */}
      {repostTargetPost && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white text-slate-900 border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-brand-blue" />
                <h3 className="font-bold text-sm text-slate-900">Repost to BuildLink Feed</h3>
              </div>
              <button
                type="button"
                onClick={() => setRepostTargetPost(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRepostSubmit} className="space-y-3.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Add your thoughts (Optional)
                </label>
                <textarea
                  rows={3}
                  value={repostComment}
                  onChange={(e) => setRepostComment(e.target.value)}
                  placeholder="Share why this engineering insight or site milestone is useful for fellow builders..."
                  className="w-full bg-slate-50 focus:bg-white text-slate-900 rounded-xl p-3 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <p className="font-bold text-slate-900">
                  Original by {repostTargetPost.author.displayName}
                </p>
                <p className="font-semibold text-brand-blue line-clamp-1">
                  {repostTargetPost.title}
                </p>
                <p className="text-slate-600 line-clamp-2">
                  {repostTargetPost.content}
                </p>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setRepostTargetPost(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isReposting}
                  className="px-5 py-2.5 rounded-xl bg-brand-blue hover:bg-blue-700 text-white font-bold shadow-md disabled:opacity-40"
                >
                  {isReposting ? 'Reposting...' : '🔁 Repost Now'}
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
    <Suspense fallback={<div className="p-8 text-center text-xs text-brand-muted">Loading feed...</div>}>
      <FeedContent />
    </Suspense>
  );
}
