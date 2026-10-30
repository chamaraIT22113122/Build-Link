'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { ConstructionGroupDto, PostDto, PostType, UserRole } from '@buildlink/shared';
import {
  Users,
  Search,
  PlusCircle,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  MapPin,
  Building2,
  Compass,
  MessageSquare,
  MessageCircle,
  UserPlus,
  Check,
  Send,
  Award,
  BookOpen,
  Sparkles,
  ThumbsUp,
} from 'lucide-react';

export default function GroupsPage() {
  const router = useRouter();
  const { user, token } = useAuth();
  const [groups, setGroups] = useState<ConstructionGroupDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [activeTab, setActiveTab] = useState<'discover' | 'my-groups'>('discover');

  // Active Group Community Hub State (Feature 5)
  const [selectedGroup, setSelectedGroup] = useState<ConstructionGroupDto | null>(null);
  const [groupHubTab, setGroupHubTab] = useState<'discussion' | 'mentors' | 'rules'>('discussion');
  const [groupPosts, setGroupPosts] = useState<PostDto[]>([]);
  const [loadingGroupPosts, setLoadingGroupPosts] = useState(false);
  const [groupEngineers, setGroupEngineers] = useState<any[]>([]);
  const [connectedIds, setConnectedIds] = useState<Set<string>>(new Set());

  // New Group Post Composer State
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostType, setNewPostType] = useState<PostType>(PostType.QUESTION);
  const [isPostingToGroup, setIsPostingToGroup] = useState(false);

  // Create New Construction Group Modal State (Batch C Item 3)
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupCategory, setNewGroupCategory] = useState('Residential');
  const [newGroupDistrict, setNewGroupDistrict] = useState('Colombo');
  const [newGroupIcon, setNewGroupIcon] = useState('🏗️');
  const [newGroupDescription, setNewGroupDescription] = useState('');

  const handleCreateGroupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim() || !newGroupDescription.trim()) return;

    const createdGroup: ConstructionGroupDto = {
      id: `grp-custom-${Date.now()}`,
      name: newGroupName.trim(),
      slug: newGroupName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: newGroupDescription.trim(),
      category: newGroupCategory,
      icon: newGroupIcon,
      coverImage:
        'https://images.unsplash.com/photo-1541888946425-d09bb18086f6?auto=format&fit=crop&w=1200&q=80',
      locationDistrict: newGroupDistrict,
      isPublic: true,
      membersCount: 1,
      postsCount: 0,
      isMember: true,
      createdAt: new Date().toISOString(),
    };

    setGroups((prev) => [createdGroup, ...prev]);
    setShowCreateGroupModal(false);
    setNewGroupName('');
    setNewGroupDescription('');
    setSelectedGroup(createdGroup);
  };

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050/api/v1';

  const loadGroupsAndEngineers = async () => {
    setLoading(true);
    try {
      const [groupsRes, engRes] = await Promise.all([
        fetch(`${apiUrl}/posts/groups`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }),
        fetch(`${apiUrl}/engineers`),
      ]);
      const groupsData = await groupsRes.json();
      const engData = await engRes.json();

      if (groupsData.success && Array.isArray(groupsData.data)) {
        setGroups(groupsData.data);
      }
      if (engData.success && Array.isArray(engData.data)) {
        setGroupEngineers(engData.data);
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
      // Handled silently
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroupsAndEngineers();
  }, [token]);

  // Load posts when a Group Hub is opened
  useEffect(() => {
    if (!selectedGroup) return;
    const fetchGroupDiscussion = async () => {
      setLoadingGroupPosts(true);
      try {
        const res = await fetch(`${apiUrl}/posts`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          const matching = data.data.filter(
            (p: PostDto) =>
              p.groupId === selectedGroup.id ||
              p.groupName === selectedGroup.name ||
              p.category?.toLowerCase().includes(selectedGroup.category.split(' ')[0].toLowerCase())
          );
          setGroupPosts(matching.length > 0 ? matching : data.data.slice(0, 4));
        }
      } catch {
        // ignore
      } finally {
        setLoadingGroupPosts(false);
      }
    };
    fetchGroupDiscussion();
  }, [selectedGroup, token]);

  const handleToggleJoin = async (groupId: string) => {
    if (!token || !user) {
      router.push('/login?redirect=/groups');
      return;
    }

    // Optimistic toggle
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id === groupId) {
          const willJoin = !g.isMember;
          const updated = {
            ...g,
            isMember: willJoin,
            membersCount: willJoin ? g.membersCount + 1 : Math.max(1, g.membersCount - 1),
          };
          if (selectedGroup?.id === groupId) setSelectedGroup(updated);
          return updated;
        }
        return g;
      })
    );

    try {
      const res = await fetch(`${apiUrl}/posts/groups/${groupId}/join`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.data) {
        setGroups((prev) =>
          prev.map((g) => {
            if (g.id === groupId) {
              const updated = {
                ...g,
                isMember: data.data.isMember,
                membersCount: data.data.membersCount,
              };
              if (selectedGroup?.id === groupId) setSelectedGroup(updated);
              return updated;
            }
            return g;
          })
        );
      }
    } catch {
      loadGroupsAndEngineers();
    }
  };

  const handleCreateGroupPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedGroup) {
      router.push('/login?redirect=/groups');
      return;
    }
    if (!newPostTitle.trim() || !newPostContent.trim()) return;

    setIsPostingToGroup(true);
    try {
      const res = await fetch(`${apiUrl}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newPostTitle.trim(),
          content: newPostContent.trim(),
          category: selectedGroup.category,
          postType: newPostType,
          locationTag: selectedGroup.locationDistrict || 'Colombo',
          groupId: selectedGroup.id,
          groupName: selectedGroup.name,
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setGroupPosts((prev) => [data.data, ...prev]);
        setNewPostTitle('');
        setNewPostContent('');
        setGroups((prev) =>
          prev.map((g) => (g.id === selectedGroup.id ? { ...g, postsCount: g.postsCount + 1 } : g))
        );
      }
    } catch {
      // ignore
    } finally {
      setIsPostingToGroup(false);
    }
  };

  const handleConnectEngineer = async (targetUserId: string) => {
    if (!token) {
      router.push('/login?redirect=/groups');
      return;
    }
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
    }
  };

  const categories = [
    'ALL',
    'Residential',
    'Structural Engineering',
    'Sustainable Construction',
    'Geotechnical & Landslides',
    'Electrical & Renewable',
  ];

  const filteredGroups = groups.filter((g) => {
    const matchesSearch =
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || g.category === selectedCategory;
    const matchesTab = activeTab === 'discover' || (activeTab === 'my-groups' && g.isMember);
    return matchesSearch && matchesCategory && matchesTab;
  });

  // ========================================================
  // DEDICATED GROUP COMMUNITY HUB VIEW (Facebook / LinkedIn Group)
  // ========================================================
  if (selectedGroup) {
    return (
      <div className="min-h-screen bg-slate-50/80 py-6 sm:py-8 px-4 sm:px-6 lg:px-8 animate-fadeIn">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Back Button */}
          <button
            type="button"
            onClick={() => setSelectedGroup(null)}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-brand-navy transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Construction Groups</span>
          </button>

          {/* Group Hub Hero Header Card */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="h-48 sm:h-64 relative overflow-hidden bg-slate-900">
              {selectedGroup.coverImage && (
                <img
                  src={selectedGroup.coverImage}
                  alt={selectedGroup.name}
                  className="w-full h-full object-cover opacity-85"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/40 to-transparent" />

              <div className="absolute bottom-5 left-6 right-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4 text-white">
                <div className="space-y-2 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="bg-white/95 text-slate-900 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                      <span>{selectedGroup.icon || '🏗️'}</span>
                      <span>{selectedGroup.category}</span>
                    </span>
                    {selectedGroup.locationDistrict && (
                      <span className="bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-emerald-300" />
                        <span>{selectedGroup.locationDistrict}</span>
                      </span>
                    )}
                    <span className="bg-blue-500/20 border border-blue-400/40 text-blue-200 text-xs font-bold px-3 py-1 rounded-full">
                      ✓ Free Engineer Mentorship Group
                    </span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                    {selectedGroup.name}
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                    {selectedGroup.description}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleToggleJoin(selectedGroup.id)}
                    className={`px-5 py-3 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all shadow-md ${
                      selectedGroup.isMember
                        ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                        : 'bg-brand-blue text-white hover:bg-blue-700'
                    }`}
                  >
                    {selectedGroup.isMember ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Joined Group</span>
                      </>
                    ) : (
                      <>
                        <PlusCircle className="w-4 h-4" />
                        <span>Join Community</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Stats & Group Navigation Tabs */}
            <div className="px-6 py-3 bg-white border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
                {[
                  { id: 'discussion', label: `💬 Discussion Wall (${groupPosts.length})` },
                  { id: 'mentors', label: `👷 Verified Engineer Mentors (${groupEngineers.length})` },
                  { id: 'rules', label: '📋 SLS Codes & Group Rules' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setGroupHubTab(tab.id as any)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                      groupHubTab === tab.id
                        ? 'bg-brand-navy text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-500 font-semibold">
                <span>
                  <strong className="text-slate-900">{selectedGroup.membersCount.toLocaleString()}</strong> members
                </span>
                <span>•</span>
                <span className="text-emerald-600 font-bold">
                  {groupEngineers.length} Verified Engineers Active
                </span>
              </div>
            </div>
          </div>

          {/* TAB 1: GROUP DISCUSSION WALL */}
          {groupHubTab === 'discussion' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Main Post Composer + Group Feed */}
              <div className="lg:col-span-8 space-y-5">
                {/* Post to Group Composer */}
                <form
                  onSubmit={handleCreateGroupPost}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3.5"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-extrabold text-brand-navy uppercase tracking-wider flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4 text-brand-blue" />
                      <span>Ask a Question or Share Site Update in {selectedGroup.name}</span>
                    </h3>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      100% Free Engineer Replies
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {[
                      { type: PostType.QUESTION, label: '❓ Ask Technical Question' },
                      { type: PostType.PROJECT_UPDATE, label: '🏗️ Share Site Milestone' },
                      { type: PostType.GENERAL, label: '💬 General Discussion' },
                    ].map((t) => (
                      <button
                        key={t.type}
                        type="button"
                        onClick={() => setNewPostType(t.type)}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${
                          newPostType === t.type
                            ? 'bg-brand-blue text-white border-brand-blue'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>

                  <input
                    type="text"
                    required
                    value={newPostTitle}
                    onChange={(e) => setNewPostTitle(e.target.value)}
                    placeholder={`Headline for ${selectedGroup.name}...`}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 focus:bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  />

                  <textarea
                    rows={3}
                    required
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    placeholder="Describe your site condition, dimensions, materials, or question for the verified engineers in this group..."
                    className="w-full p-3.5 rounded-xl bg-slate-50 focus:bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  />

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isPostingToGroup || !newPostTitle.trim() || !newPostContent.trim()}
                      className="btn-primary text-xs font-bold px-5 py-2.5 gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isPostingToGroup ? 'Posting...' : 'Post to Group'}</span>
                    </button>
                  </div>
                </form>

                {/* Group Posts List */}
                {loadingGroupPosts ? (
                  <div className="p-10 text-center text-xs text-slate-400">Loading group discussions...</div>
                ) : (
                  <div className="space-y-4">
                    {groupPosts.map((post) => (
                      <div
                        key={post.id}
                        className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <Link href={`/profile/${post.author.id}`} className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-full bg-brand-navy text-white font-bold text-xs flex items-center justify-center overflow-hidden">
                              {post.author.avatarUrl ? (
                                <img src={post.author.avatarUrl} alt={post.author.displayName} className="w-full h-full object-cover" />
                              ) : (
                                post.author.displayName.substring(0, 2).toUpperCase()
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-slate-900 hover:text-brand-blue">
                                  {post.author.displayName}
                                </span>
                                {post.author.isVerifiedEngineer && (
                                  <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-brand-blue bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                                    <ShieldCheck className="w-3 h-3" /> Verified Engineer
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-400">
                                {new Date(post.createdAt).toLocaleDateString()} • 📍 {post.locationTag || 'Sri Lanka'}
                              </p>
                            </div>
                          </Link>

                          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                            {post.category}
                          </span>
                        </div>

                        <h4 className="text-sm font-extrabold text-slate-900">{post.title}</h4>
                        <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                          {post.content}
                        </p>

                        {post.mediaUrls && post.mediaUrls.length > 0 && (
                          <img
                            src={post.mediaUrls[0]}
                            alt={post.title}
                            className="w-full max-h-80 object-cover rounded-xl border border-slate-100"
                          />
                        )}

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                          <span className="font-semibold">👍 {post.likesCount} reactions • 💬 {post.commentsCount} replies</span>
                          <Link
                            href={`/feed?category=${encodeURIComponent(selectedGroup.category)}`}
                            className="text-brand-blue font-bold hover:underline"
                          >
                            Open Full Thread →
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Group Engineer Mentors */}
              <div className="lg:col-span-4 space-y-4">
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3.5">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div>
                      <h4 className="text-xs font-extrabold text-brand-navy uppercase tracking-wider">
                        Group Engineer Mentors
                      </h4>
                      <p className="text-[10px] text-emerald-600 font-bold">
                        #OpenToHelp • Free Group Advice
                      </p>
                    </div>
                    <ShieldCheck className="w-5 h-5 text-brand-blue" />
                  </div>

                  <div className="space-y-3 divide-y divide-slate-100">
                    {groupEngineers.slice(0, 4).map((eng) => {
                      const isConnected = connectedIds.has(eng.userId);
                      return (
                        <div key={eng.id} className="pt-3 first:pt-0 flex items-center justify-between gap-2">
                          <Link href={`/profile/${eng.userId}`} className="flex items-center gap-2.5 min-w-0">
                            <img
                              src={
                                eng.avatarUrl ||
                                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
                              }
                              alt={eng.displayName}
                              className="w-10 h-10 rounded-xl object-cover shrink-0 border border-slate-200"
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-900 truncate hover:text-brand-blue">
                                {eng.displayName}
                              </p>
                              <p className="text-[10px] text-slate-500 truncate">{eng.title}</p>
                            </div>
                          </Link>

                          <button
                            type="button"
                            onClick={() => handleConnectEngineer(eng.userId)}
                            disabled={isConnected}
                            className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold shrink-0 border ${
                              isConnected
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-white text-brand-blue border-slate-200 hover:border-brand-blue'
                            }`}
                          >
                            {isConnected ? '✓ Connected' : '+ Connect'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: VERIFIED ENGINEER MENTORS IN THIS GROUP */}
          {groupHubTab === 'mentors' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {groupEngineers.map((eng) => {
                const isConnected = connectedIds.has(eng.userId);
                return (
                  <div
                    key={eng.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4"
                  >
                    <div className="flex items-start gap-3.5">
                      <img
                        src={
                          eng.avatarUrl ||
                          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
                        }
                        alt={eng.displayName}
                        className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <Link
                            href={`/profile/${eng.userId}`}
                            className="text-sm font-extrabold text-brand-navy hover:text-brand-blue truncate"
                          >
                            {eng.displayName}
                          </Link>
                          <ShieldCheck className="w-4 h-4 text-brand-blue shrink-0" />
                        </div>
                        <p className="text-xs font-semibold text-brand-blue line-clamp-2 mt-0.5">
                          {eng.title}
                        </p>
                        <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          ✓ #OpenToHelp • Free Mentor
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => handleConnectEngineer(eng.userId)}
                        disabled={isConnected}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1 ${
                          isConnected
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {isConnected ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" /> Connected
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-3.5 h-3.5 text-brand-blue" /> Connect
                          </>
                        )}
                      </button>

                      <Link
                        href={`/messages?userId=${eng.userId}`}
                        className="py-2 px-3 rounded-xl text-xs font-bold bg-brand-blue hover:bg-blue-700 text-white flex items-center justify-center gap-1"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Ask Free</span>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 3: GROUP SLS CODES & COMMUNITY RULES */}
          {groupHubTab === 'rules' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
              <h3 className="text-base font-extrabold text-brand-navy flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-brand-blue" />
                <span>Sri Lankan Construction Standards & Pro-Bono Community Rules</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-700">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <h4 className="font-bold text-slate-900">1. 100% Free Pro-Bono Technical Exchange</h4>
                  <p>
                    All discussions, blueprint reviews, and engineer advice in this group are shared freely to elevate construction safety across Sri Lanka. No commercial fee solicitation is permitted.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <h4 className="font-bold text-slate-900">2. Reference SLS, NBRO & CIDA Guidelines</h4>
                  <p>
                    When advising on structural concrete, slope stability, or electrical systems, reference relevant SLS 1253, NBRO hazard clearance, and CIDA specifications.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/70 py-6 sm:py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        {/* Header Banner */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-brand-navy via-slate-900 to-brand-blue text-white p-6 sm:p-10 lg:p-12 shadow-xl border border-slate-800">
          <div className="relative z-10 max-w-3xl space-y-3 sm:space-y-4">
            <div className="inline-flex items-center space-x-2 bg-white/10 border border-white/20 px-3.5 py-1.5 rounded-full text-xs font-bold text-amber-300">
              <Users className="w-4 h-4 text-brand-orange" />
              <span>Construction Communities & Free Engineer Mentorship Hubs</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
              Specialized Engineering & Builder Groups
            </h1>
            <p className="text-slate-200 text-xs sm:text-sm md:text-base leading-relaxed">
              Connect with fellow builders, homeowners, and verified structural engineers across Sri Lanka.
              Open any group hub below to post questions, share blueprints, and get free advice from group engineer mentors.
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setShowCreateGroupModal(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-orange hover:bg-orange-600 text-white text-xs sm:text-sm font-extrabold shadow-lg transition-all cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Create New Construction Group</span>
              </button>
              <span className="text-[11px] font-semibold text-emerald-300 bg-emerald-500/15 border border-emerald-400/30 px-3 py-1.5 rounded-xl">
                ✓ 100% Free Pro-Bono Engineer Mentorship
              </span>
            </div>
          </div>
          <div className="absolute right-0 bottom-0 opacity-10 translate-x-12 translate-y-12 pointer-events-none hidden md:block">
            <Building2 className="w-80 h-80 text-white" />
          </div>
        </div>

        {/* Create New Construction Group Modal (Batch C Item 3) */}
        {showCreateGroupModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-brand-blue bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                    <Sparkles className="w-3 h-3" /> Community Group Builder
                  </span>
                  <h3 className="text-lg font-extrabold text-slate-900 mt-1.5">
                    Create a Construction Community Group
                  </h3>
                  <p className="text-xs text-slate-500">
                    Launch a regional or specialty hub for homeowners and Verified Engineers to collaborate for free.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreateGroupModal(false)}
                  className="text-slate-400 hover:text-slate-700 text-sm font-bold px-2.5 py-1 rounded-lg hover:bg-slate-100"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateGroupSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Group Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="e.g., Gampaha & Negombo Coastal Home Builders"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Specialty Category
                    </label>
                    <select
                      value={newGroupCategory}
                      onChange={(e) => setNewGroupCategory(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
                    >
                      {categories
                        .filter((c) => c !== 'ALL')
                        .map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      District Focus
                    </label>
                    <select
                      value={newGroupDistrict}
                      onChange={(e) => setNewGroupDistrict(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
                    >
                      {[
                        'All Island',
                        'Colombo',
                        'Gampaha',
                        'Kandy',
                        'Galle',
                        'Kurunegala',
                        'Kalutara',
                        'Matara',
                        'Jaffna',
                        'Anuradhapura',
                      ].map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Badge Icon
                    </label>
                    <select
                      value={newGroupIcon}
                      onChange={(e) => setNewGroupIcon(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
                    >
                      {['🏗️', '🏡', '⛰️', '⚡', '🧱', '💧', '🌿', '📐'].map((ic) => (
                        <option key={ic} value={ic}>
                          {ic} Icon
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Community Purpose & SLS Topics *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={newGroupDescription}
                    onChange={(e) => setNewGroupDescription(e.target.value)}
                    placeholder="Describe what builders, homeowners, and pro-bono engineers will discuss and share in this hub..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowCreateGroupModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-brand-blue hover:bg-blue-700 text-white shadow-md flex items-center gap-1.5"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Launch Group Hub</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Navigation & Controls */}
        <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center space-x-2 w-full md:w-auto">
            <button
              onClick={() => setActiveTab('discover')}
              className={`flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'discover'
                  ? 'bg-brand-blue text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>Discover Groups ({groups.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('my-groups')}
              className={`flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'my-groups'
                  ? 'bg-brand-blue text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>My Groups</span>
              {groups.filter((g) => g.isMember).length > 0 && (
                <span className="w-5 h-5 rounded-full bg-brand-orange text-white text-[10px] flex items-center justify-center font-bold">
                  {groups.filter((g) => g.isMember).length}
                </span>
              )}
            </button>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search groups by keyword..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 focus:bg-white text-slate-900 placeholder:text-slate-400 rounded-xl text-xs border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all shadow-xs ${
                selectedCategory === cat
                  ? 'bg-brand-navy text-white shadow'
                  : 'bg-white text-slate-700 hover:text-brand-blue hover:border-brand-blue border border-slate-200'
              }`}
            >
              {cat === 'ALL' ? '🌐 All Categories' : cat}
            </button>
          ))}
        </div>

        {/* Groups Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-white border border-slate-200 rounded-2xl h-80 animate-pulse shadow-sm"
              />
            ))}
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-lg mx-auto space-y-3 shadow-sm">
            <Users className="w-12 h-12 text-slate-400 mx-auto" />
            <h3 className="font-bold text-base text-slate-900">No groups found</h3>
            <p className="text-xs text-slate-500">
              {activeTab === 'my-groups'
                ? "You haven't joined any construction groups yet. Browse the Discover tab to find communities!"
                : 'Try adjusting your search terms or filter category.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {filteredGroups.map((group) => (
              <div
                key={group.id}
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group"
              >
                {/* Cover Image */}
                <div
                  onClick={() => setSelectedGroup(group)}
                  className="h-36 bg-slate-100 relative overflow-hidden cursor-pointer"
                >
                  {group.coverImage ? (
                    <img
                      src={group.coverImage}
                      alt={group.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-brand-navy/80 to-brand-blue/80 flex items-center justify-center text-3xl">
                      {group.icon || '🏗️'}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

                  <span className="absolute top-3 left-3 bg-white/95 text-slate-900 text-[11px] font-bold px-3 py-1 rounded-full border border-slate-200 shadow-md flex items-center space-x-1.5">
                    <span>{group.icon || '🏗️'}</span>
                    <span>{group.category}</span>
                  </span>

                  {group.locationDistrict && (
                    <span className="absolute top-3 right-3 bg-slate-900/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-md flex items-center space-x-1 border border-white/20">
                      <MapPin className="w-3 h-3 text-emerald-400" />
                      <span>{group.locationDistrict}</span>
                    </span>
                  )}
                </div>

                {/* Body */}
                <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3
                      onClick={() => setSelectedGroup(group)}
                      className="text-base font-black text-slate-900 group-hover:text-brand-blue transition-colors line-clamp-1 cursor-pointer"
                    >
                      {group.name}
                    </h3>
                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                      {group.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center space-x-1.5">
                      <Users className="w-3.5 h-3.5 text-brand-blue" />
                      <span className="font-bold text-slate-900">
                        {group.membersCount.toLocaleString()}
                      </span>
                      <span>members</span>
                    </div>

                    <div className="flex items-center space-x-1 font-medium text-emerald-600">
                      <span>✓ Free Engineer Hub</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => handleToggleJoin(group.id)}
                      className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all active:scale-98 shadow-xs ${
                        group.isMember
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-red-50 hover:text-red-600 hover:border-red-300'
                          : 'bg-brand-blue hover:bg-blue-700 text-white shadow-sm'
                      }`}
                    >
                      {group.isMember ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Joined</span>
                        </>
                      ) : (
                        <>
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>Join Group</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedGroup(group)}
                      className="w-full py-2.5 px-3 rounded-xl text-xs font-bold bg-slate-100 hover:bg-brand-navy hover:text-white text-slate-800 border border-slate-200 flex items-center justify-center space-x-1 transition-all active:scale-98"
                    >
                      <span>Open Hub</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
