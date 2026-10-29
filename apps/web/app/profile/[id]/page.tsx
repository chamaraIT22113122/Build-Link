'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';
import {
  UserDto,
  UserRole,
  VerificationStatus,
  PostDto,
  CommentDto,
  ReactionType,
} from '@buildlink/shared';
import {
  ShieldCheck,
  MapPin,
  Briefcase,
  CheckCircle2,
  Calendar,
  MessageCircle,
  UserPlus,
  Check,
  Share2,
  Camera,
  Grid,
  List,
  Heart,
  MessageSquare,
  ThumbsUp,
  Award,
  Globe,
  Building,
  MoreHorizontal,
  ExternalLink,
  Phone,
  Mail,
  GraduationCap,
  Sparkles,
  Send,
  X,
  Bookmark,
} from 'lucide-react';

const REACTION_CONFIG: Record<
  ReactionType,
  { label: string; emoji: string; color: string }
> = {
  [ReactionType.LIKE]: { label: 'Like', emoji: '👍', color: 'text-blue-500' },
  [ReactionType.LOVE]: { label: 'Love', emoji: '❤️', color: 'text-red-500' },
  [ReactionType.INSIGHT]: { label: 'Insight', emoji: '💡', color: 'text-amber-500' },
  [ReactionType.SOLID]: { label: 'Solid', emoji: '🏗️', color: 'text-emerald-500' },
  [ReactionType.CAUTION]: { label: 'Caution', emoji: '⚠️', color: 'text-orange-500' },
};

// Fallback demo profiles for standard seed IDs
const DEMO_PROFILES: Record<string, Partial<UserDto>> = {
  'eng-kasun': {
    id: 'eng-kasun',
    email: 'kasun@iesl.lk',
    role: UserRole.ENGINEER,
    profile: {
      id: 'p-kasun',
      userId: 'eng-kasun',
      firstName: 'Kasun',
      lastName: 'Perera',
      displayName: 'Eng. Kasun Perera',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      bio: 'Chartered Structural & Earthquake-Resistant Concrete Specialist. 14+ years designing high-rise and residential frameworks across Western Province.',
      city: 'Kandy',
      district: 'Kandy',
      phoneNumber: '+94 77 123 4567',
      coverPhotoUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb18f15f6?auto=format&fit=crop&w=1200&q=80',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    engineerProfile: {
      id: 'ep-kasun',
      userId: 'eng-kasun',
      title: 'Senior Chartered Structural Engineer (IESL)',
      registrationBody: 'IESL',
      registrationNumber: 'IESL-ST-1142',
      yearsOfExperience: 14,
      verificationStatus: VerificationStatus.VERIFIED,
      consultationFee: 7500,
      availableForConsultation: true,
      specializations: ['Structural Engineering', 'Foundations & Piling', 'Earthquake Resistance'],
      ratingAverage: 4.9,
      ratingCount: 52,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  },
  'arch-nimali': {
    id: 'arch-nimali',
    email: 'nimali@slia.lk',
    role: UserRole.ENGINEER,
    profile: {
      id: 'p-nimali',
      userId: 'arch-nimali',
      firstName: 'Nimali',
      lastName: 'Silva',
      displayName: 'Arch. Nimali Silva',
      avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80',
      bio: 'Chartered Architect specializing in tropical modernism, eco-friendly villa designs, and natural ventilation for coastal residences.',
      city: 'Galle',
      district: 'Galle',
      phoneNumber: '+94 71 987 6543',
      coverPhotoUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    engineerProfile: {
      id: 'ep-nimali',
      userId: 'arch-nimali',
      title: 'Chartered Architect (SLIA / RIBA)',
      registrationBody: 'SLIA',
      registrationNumber: 'SLIA-ARC-894',
      yearsOfExperience: 10,
      verificationStatus: VerificationStatus.VERIFIED,
      consultationFee: 6500,
      availableForConsultation: true,
      specializations: ['Architectural Design', 'Tropical Modernism', 'Interior Space Planning'],
      ratingAverage: 4.8,
      ratingCount: 38,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  },
};

export default function UserProfileTimelinePage() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser, token } = useAuth();
  const profileId = params?.id as string;

  const [profileUser, setProfileUser] = useState<UserDto | null>(null);
  const [posts, setPosts] = useState<PostDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'timeline' | 'photos' | 'about' | 'connections'>('timeline');
  const [isConnected, setIsConnected] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [peerConnections, setPeerConnections] = useState<
    Array<{ userId: string; name: string; title: string; district: string; avatarUrl?: string; isVerified?: boolean }>
  >([]);

  // Instagram Double-Tap Heart Animation
  const [doubleTapPostId, setDoubleTapPostId] = useState<string | null>(null);
  const lastTapRef = React.useRef<{ [key: string]: number }>({});

  // Lightbox Image Preview
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // Comments State
  const [expandedComments, setExpandedComments] = useState<Record<string, CommentDto[]>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [loadingComments, setLoadingComments] = useState<Record<string, boolean>>({});

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050/api/v1';
  const isOwnProfile = currentUser?.id === profileId;

  // 1. Fetch User Data
  useEffect(() => {
    if (!profileId) return;

    const fetchUserData = async () => {
      setLoading(true);
      try {
        // Check if demo profile exists first
        if (DEMO_PROFILES[profileId]) {
          setProfileUser(DEMO_PROFILES[profileId] as UserDto);
        } else {
          const res = await fetch(`${apiUrl}/users/${profileId}`);
          const data = await res.json();
          if (data.success && data.data) {
            setProfileUser(data.data);
          } else if (currentUser && currentUser.id === profileId) {
            setProfileUser(currentUser);
          }
        }
      } catch {
        if (DEMO_PROFILES[profileId]) {
          setProfileUser(DEMO_PROFILES[profileId] as UserDto);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [profileId, currentUser]);

  // 2. Fetch User's Posts
  useEffect(() => {
    if (!profileId) return;

    const fetchUserPosts = async () => {
      try {
        const res = await fetch(`${apiUrl}/posts?authorId=${profileId}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setPosts(data.data);
        }
      } catch {
        // Handled silently
      }
    };

    fetchUserPosts();
  }, [profileId]);

  // 3. Fetch Real Database Peer Engineers & Connections
  useEffect(() => {
    const fetchConnections = async () => {
      try {
        const res = await fetch(`${apiUrl}/engineers`);
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          const peers = data.data
            .filter((e: any) => e.userId !== profileId)
            .map((e: any) => ({
              userId: e.userId,
              name: e.displayName,
              title: e.title,
              district: e.district || 'Colombo',
              avatarUrl: e.avatarUrl,
              isVerified: e.isVerified,
            }));
          setPeerConnections(peers);
        }
      } catch {
        // Handled silently
      }
    };
    fetchConnections();
  }, [profileId]);

  // Handle Messenger Trigger
  const handleOpenMessenger = () => {
    if (!profileUser) return;
    const name = profileUser.profile?.displayName || `${profileUser.profile?.firstName || ''} ${profileUser.profile?.lastName || ''}`.trim() || 'User';
    const avatar = profileUser.profile?.avatarUrl;
    const role = profileUser.role;
    const isVerified = profileUser.engineerProfile?.verificationStatus === VerificationStatus.VERIFIED;
    const title = profileUser.engineerProfile?.title || 'Community Member';

    const event = new CustomEvent('buildlink:open-chat', {
      detail: {
        partnerId: profileUser.id,
        partnerName: name,
        partnerAvatar: avatar,
        partnerRole: role,
        isVerifiedEngineer: isVerified,
        partnerTitle: title,
      },
    });
    window.dispatchEvent(event);
  };

  // Toggle Reactions
  const handleReactToPost = async (postId: string, reaction: ReactionType) => {
    if (!currentUser || !token) {
      router.push('/login');
      return;
    }

    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const isCurrentSame = p.userReaction === reaction;
        const newLikesCount = isCurrentSame ? Math.max(0, p.likesCount - 1) : p.userReaction ? p.likesCount : p.likesCount + 1;
        return {
          ...p,
          userReaction: isCurrentSame ? null : reaction,
          isLikedByMe: !isCurrentSame,
          likesCount: newLikesCount,
        };
      })
    );

    try {
      await fetch(`${apiUrl}/posts/${postId}/react`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reaction }),
      });
    } catch {
      // Handled silently
    }
  };

  // Instagram Double Tap Like
  const handleMediaDoubleTap = (postId: string) => {
    const now = Date.now();
    const lastTap = lastTapRef.current[postId] || 0;
    if (now - lastTap < 350) {
      // Double tap detected!
      setDoubleTapPostId(postId);
      setTimeout(() => setDoubleTapPostId(null), 900);
      handleReactToPost(postId, ReactionType.LOVE);
    }
    lastTapRef.current[postId] = now;
  };

  // Comments
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

  const handleAddComment = async (postId: string) => {
    const content = commentInputs[postId]?.trim();
    if (!content || !token) {
      if (!token) router.push('/login');
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content }),
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

  // Collect all photos from posts for Instagram Grid
  const allMediaPhotos = posts.flatMap((p) =>
    (p.mediaUrls || []).map((url) => ({
      url,
      postId: p.id,
      title: p.title,
      likes: p.likesCount,
      comments: p.commentsCount,
    }))
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-bold text-slate-600">Loading Profile & Timeline...</p>
        </div>
      </div>
    );
  }

  const name =
    profileUser?.profile?.displayName ||
    `${profileUser?.profile?.firstName || ''} ${profileUser?.profile?.lastName || ''}`.trim() ||
    'Community Member';

  const isVerified =
    profileUser?.role === UserRole.ENGINEER &&
    profileUser?.engineerProfile?.verificationStatus === VerificationStatus.VERIFIED;

  const coverPhoto =
    profileUser?.profile?.coverPhotoUrl ||
    'https://images.unsplash.com/photo-1541888946425-d0fbb18f15f6?auto=format&fit=crop&w=1400&q=80';

  const avatar = profileUser?.profile?.avatarUrl;

  return (
    <div className="min-h-screen bg-slate-100 pb-12 select-none">
      
      {/* ========================================================
          1. FACEBOOK COVER PHOTO BANNER
         ======================================================== */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto">
          <div className="relative h-56 sm:h-80 md:h-96 w-full overflow-hidden bg-slate-900 rounded-b-2xl shadow-inner group">
            <img
              src={coverPhoto}
              alt="Cover"
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

            {/* If own profile: Edit Cover Button */}
            {isOwnProfile && (
              <button
                onClick={() => router.push('/profile')}
                className="absolute bottom-4 right-4 bg-white/95 hover:bg-white text-slate-800 text-xs font-bold px-3.5 py-2 rounded-xl shadow-lg flex items-center space-x-1.5 transition-all active:scale-95"
              >
                <Camera className="w-4 h-4 text-slate-600" />
                <span>Edit Cover Photo</span>
              </button>
            )}
          </div>

          {/* ========================================================
              2. PROFILE HEADER STRIP (Avatar, Name, Actions, Stats)
             ======================================================== */}
          <div className="px-4 sm:px-8 pb-4">
            <div className="flex flex-col md:flex-row items-center md:items-end justify-between -mt-16 sm:-mt-24 mb-4 gap-4">
              
              {/* Avatar & Identity */}
              <div className="flex flex-col md:flex-row items-center md:items-end space-y-3 md:space-y-0 md:space-x-5 text-center md:text-left">
                {/* Instagram Sunset Gradient Ring Avatar */}
                <div className="relative p-1 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 shadow-2xl">
                  <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full overflow-hidden bg-white ring-4 ring-white">
                    {avatar ? (
                      <img src={avatar} alt={name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-blue-600 text-white flex items-center justify-center font-bold text-3xl">
                        {name.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                  {isVerified && (
                    <div
                      className="absolute bottom-1 right-1 bg-blue-500 text-white p-1 rounded-full ring-2 ring-white shadow"
                      title="Verified Civil Engineer"
                    >
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                  )}
                </div>

                {/* Name, Headline & Location */}
                <div className="space-y-1">
                  <div className="flex items-center justify-center md:justify-start space-x-2">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                      {name}
                    </h1>
                    {isVerified && (
                      <span className="bg-blue-50 text-blue-600 text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center space-x-1 border border-blue-200">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Verified Pro</span>
                      </span>
                    )}
                  </div>

                  <p className="text-sm font-semibold text-slate-600">
                    {profileUser?.engineerProfile?.title ||
                      (profileUser?.role === UserRole.ENGINEER ? 'Chartered Engineer' : 'Homeowner & Builder')}
                  </p>

                  <div className="flex items-center justify-center md:justify-start space-x-3 text-xs text-slate-500">
                    {profileUser?.profile?.district && (
                      <span className="flex items-center space-x-1">
                        <MapPin className="w-3.5 h-3.5 text-rose-500" />
                        <span>{profileUser.profile.district}, Sri Lanka</span>
                      </span>
                    )}
                    <span>•</span>
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5 text-blue-500" />
                      <span>Joined 2024</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons (Facebook + Instagram style) */}
              <div className="flex items-center space-x-2.5 w-full md:w-auto justify-center">
                {isOwnProfile ? (
                  <>
                    <button
                      onClick={() => router.push('/profile')}
                      className="flex-1 md:flex-none px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-colors flex items-center justify-center space-x-1.5"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Edit Profile</span>
                    </button>
                    <button
                      onClick={() => {
                        window.dispatchEvent(new CustomEvent('buildlink:open-create-story'));
                        router.push('/feed');
                      }}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors flex items-center justify-center space-x-1.5"
                    >
                      <Camera className="w-4 h-4 text-purple-600" />
                      <span>Add to Story</span>
                    </button>
                  </>
                ) : (
                  <>
                    {/* Primary Messenger Blue Button */}
                    <button
                      onClick={handleOpenMessenger}
                      className="flex-1 md:flex-none px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-colors flex items-center justify-center space-x-2 active:scale-95"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Message</span>
                    </button>

                    {/* Connect / Add Friend Button */}
                    <button
                      onClick={async () => {
                        if (!currentUser || !token) {
                          router.push('/login');
                          return;
                        }
                        try {
                          await fetch(`${apiUrl}/messages/connect/${profileId}`, {
                            method: 'POST',
                            headers: { Authorization: `Bearer ${token}` },
                          });
                        } catch {}
                        setIsConnected(!isConnected);
                      }}
                      className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-colors flex items-center justify-center space-x-1.5 ${
                        isConnected
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                      }`}
                    >
                      {isConnected ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-600" />
                          <span>Connected</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4 text-blue-600" />
                          <span>Connect</span>
                        </>
                      )}
                    </button>

                    {/* Follow Button */}
                    <button
                      onClick={() => {
                        if (!currentUser) router.push('/login');
                        else setIsFollowing(!isFollowing);
                      }}
                      className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-colors ${
                        isFollowing
                          ? 'bg-slate-200 text-slate-700'
                          : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                      }`}
                    >
                      {isFollowing ? 'Following' : 'Follow'}
                    </button>

                    {/* Share Profile */}
                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText(window.location.href);
                        alert('Profile link copied to clipboard!');
                      }}
                      className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
                      title="Share Profile"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Instagram Stats Row */}
            <div className="pt-3 border-t border-slate-200/80 flex items-center justify-around sm:justify-start sm:space-x-8 text-center sm:text-left">
              <div>
                <span className="text-base sm:text-lg font-extrabold text-slate-900 block leading-tight">
                  {posts.length}
                </span>
                <span className="text-xs text-slate-500 font-medium">Posts</span>
              </div>
              <div className="w-[1px] h-6 bg-slate-200 sm:hidden" />
              <div>
                <span className="text-base sm:text-lg font-extrabold text-slate-900 block leading-tight">
                  {124 + posts.length * 15}
                </span>
                <span className="text-xs text-slate-500 font-medium">Followers</span>
              </div>
              <div className="w-[1px] h-6 bg-slate-200 sm:hidden" />
              <div>
                <span className="text-base sm:text-lg font-extrabold text-slate-900 block leading-tight">
                  84
                </span>
                <span className="text-xs text-slate-500 font-medium">Following</span>
              </div>
              {profileUser?.engineerProfile && (
                <>
                  <div className="w-[1px] h-6 bg-slate-200 sm:hidden" />
                  <div>
                    <span className="text-base sm:text-lg font-extrabold text-amber-500 flex items-center justify-center sm:justify-start space-x-1 leading-tight">
                      <span>⭐</span>
                      <span>{profileUser.engineerProfile.ratingAverage || 4.9}</span>
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      ({profileUser.engineerProfile.ratingCount || 28} Reviews)
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ========================================================
              3. PROFILE NAVIGATION TABS (Facebook & Instagram)
             ======================================================== */}
          <div className="px-4 sm:px-8 flex items-center space-x-2 border-t border-slate-100 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveTab('timeline')}
              className={`py-3.5 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-colors flex items-center space-x-2 ${
                activeTab === 'timeline'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-4 h-4" />
              <span>Timeline Posts</span>
            </button>

            <button
              onClick={() => setActiveTab('photos')}
              className={`py-3.5 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-colors flex items-center space-x-2 ${
                activeTab === 'photos'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Grid className="w-4 h-4" />
              <span>Instagram Photos ({allMediaPhotos.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('about')}
              className={`py-3.5 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-colors flex items-center space-x-2 ${
                activeTab === 'about'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span>About & Credentials</span>
            </button>

            <button
              onClick={() => setActiveTab('connections')}
              className={`py-3.5 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-colors flex items-center space-x-2 ${
                activeTab === 'connections'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Connections</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================
          4. TAB CONTENT
         ======================================================== */}
      <div className="max-w-6xl mx-auto px-3 sm:px-6 pt-6">
        
        {/* --- TAB 1: TIMELINE (Facebook 2-Column Layout) --- */}
        {activeTab === 'timeline' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Column: Facebook "Intro" Card */}
            <div className="col-span-1 lg:col-span-5 space-y-4">
              
              {/* Intro Card */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3.5">
                <h3 className="font-extrabold text-sm text-slate-900">Intro</h3>

                {profileUser?.profile?.bio ? (
                  <p className="text-xs text-slate-700 leading-relaxed text-center sm:text-left">
                    {profileUser.profile.bio}
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 italic">No bio added yet.</p>
                )}

                <div className="pt-2 border-t border-slate-100 space-y-2.5 text-xs text-slate-700">
                  {profileUser?.engineerProfile && (
                    <div className="flex items-center space-x-2.5">
                      <GraduationCap className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      <span>
                        Registered with <span className="font-bold">{profileUser.engineerProfile.registrationBody || 'IESL'}</span> (#{profileUser.engineerProfile.registrationNumber || 'Pending'})
                      </span>
                    </div>
                  )}

                  {profileUser?.engineerProfile?.yearsOfExperience !== undefined && (
                    <div className="flex items-center space-x-2.5">
                      <Briefcase className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>
                        <span className="font-bold">{profileUser.engineerProfile.yearsOfExperience} years</span> of active engineering practice
                      </span>
                    </div>
                  )}

                  {profileUser?.profile?.city && (
                    <div className="flex items-center space-x-2.5">
                      <MapPin className="w-4 h-4 text-rose-500 flex-shrink-0" />
                      <span>
                        Lives in <span className="font-bold">{profileUser.profile.city}, {profileUser.profile.district}</span>
                      </span>
                    </div>
                  )}

                  <div className="flex items-center space-x-2.5">
                    <Globe className="w-4 h-4 text-cyan-600 flex-shrink-0" />
                    <span>Member of BuildLink Verified Network</span>
                  </div>
                </div>

                {isOwnProfile && (
                  <button
                    onClick={() => router.push('/profile')}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors"
                  >
                    Edit Details
                  </button>
                )}
              </div>

              {/* Featured Photos Mini Grid (3x3 Facebook style) */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900">Photos</h4>
                    <span className="text-[11px] text-slate-400">{allMediaPhotos.length} site photos</span>
                  </div>
                  <button
                    onClick={() => setActiveTab('photos')}
                    className="text-xs font-bold text-blue-600 hover:underline"
                  >
                    See all
                  </button>
                </div>

                {allMediaPhotos.length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-4">No photos uploaded yet</p>
                ) : (
                  <div className="grid grid-cols-3 gap-1.5 rounded-xl overflow-hidden">
                    {allMediaPhotos.slice(0, 9).map((photo, i) => (
                      <div
                        key={i}
                        onClick={() => setPreviewImageUrl(photo.url)}
                        className="aspect-square bg-slate-100 overflow-hidden cursor-pointer group relative"
                      >
                        <img
                          src={photo.url}
                          alt="Thumbnail"
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Timeline Posts Feed */}
            <div className="col-span-1 lg:col-span-7 space-y-4">
              
              {/* If own profile: Quick Post Box */}
              {isOwnProfile && (
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                    {name.substring(0, 2).toUpperCase()}
                  </div>
                  <button
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('buildlink:open-create-post'));
                      router.push('/feed');
                    }}
                    className="flex-1 bg-slate-100 hover:bg-slate-200/80 text-left px-4 py-2.5 rounded-full text-xs text-slate-500 transition-colors"
                  >
                    Post an update to your timeline...
                  </button>
                </div>
              )}

              {/* Feed Header */}
              <div className="flex items-center justify-between px-1">
                <h3 className="font-extrabold text-sm text-slate-900">Posts</h3>
                <span className="text-xs text-slate-500 font-semibold">{posts.length} timeline updates</span>
              </div>

              {posts.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-3 shadow-sm">
                  <Building className="w-12 h-12 text-slate-300 mx-auto" />
                  <h4 className="font-bold text-slate-800 text-sm">No timeline posts yet</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    {isOwnProfile
                      ? 'Share your ongoing construction progress, site photos, or structural questions with the community!'
                      : `${name} has not posted on their timeline yet.`}
                  </p>
                </div>
              ) : (
                posts.map((post) => {
                  const activeReaction = post.userReaction;
                  const reactionInfo = activeReaction ? REACTION_CONFIG[activeReaction] : null;

                  return (
                    <article
                      key={post.id}
                      className="bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden space-y-3"
                    >
                      {/* Post Header */}
                      <div className="p-4 pb-0 flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-blue-600 text-white flex items-center justify-center font-bold text-xs ring-2 ring-slate-100 flex-shrink-0">
                            {post.author.avatarUrl ? (
                              <img src={post.author.avatarUrl} alt={name} className="w-full h-full object-cover" />
                            ) : (
                              post.author.displayName.substring(0, 2).toUpperCase()
                            )}
                          </div>
                          <div>
                            <div className="flex items-center space-x-1.5 flex-wrap">
                              <span className="text-xs font-bold text-slate-900">{post.author.displayName}</span>
                              {post.author.isVerifiedEngineer && (
                                <ShieldCheck className="w-3.5 h-3.5 text-blue-500 inline" />
                              )}
                              {post.groupName && (
                                <span className="text-slate-400 text-xs">▶ in {post.groupName}</span>
                              )}
                            </div>
                            <div className="flex items-center space-x-1.5 text-[11px] text-slate-400">
                              <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                              <span>•</span>
                              <span>{post.locationTag || 'Colombo, Sri Lanka'}</span>
                              <span>•</span>
                              <span className="px-1.5 py-0.2 bg-slate-100 rounded text-[10px] text-slate-600 font-semibold">
                                {post.category}
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            navigator.clipboard?.writeText(window.location.href);
                            alert('Post link copied to clipboard!');
                          }}
                          className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Content */}
                      <div className="px-4 space-y-1.5">
                        <h4 className="text-sm font-bold text-slate-900">{post.title}</h4>
                        <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                          {post.content}
                        </p>
                      </div>

                      {/* Media Display with Instagram Double Tap Heart */}
                      {post.mediaUrls && post.mediaUrls.length > 0 && (
                        <div
                          className="relative bg-black select-none cursor-pointer overflow-hidden"
                          onClick={() => handleMediaDoubleTap(post.id)}
                        >
                          {post.mediaUrls.length === 1 ? (
                            <img
                              src={post.mediaUrls[0]}
                              alt="Media"
                              className="w-full max-h-[500px] object-cover"
                            />
                          ) : (
                            <div className="grid grid-cols-2 gap-1">
                              {post.mediaUrls.slice(0, 4).map((url, idx) => (
                                <img
                                  key={idx}
                                  src={url}
                                  alt={`Media ${idx}`}
                                  className="w-full h-48 object-cover"
                                />
                              ))}
                            </div>
                          )}

                          {/* Instagram Heart Splash on Double Tap */}
                          {doubleTapPostId === post.id && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-in zoom-in-50 duration-200">
                              <Heart className="w-20 h-20 text-red-500 fill-red-500 drop-shadow-2xl animate-bounce" />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Counters */}
                      <div className="px-4 py-1.5 flex items-center justify-between text-xs text-slate-500 border-b border-slate-100">
                        <div className="flex items-center space-x-1.5">
                          <span className="flex items-center -space-x-1">
                            <span className="w-4 h-4 rounded-full bg-blue-500 text-white text-[9px] flex items-center justify-center">
                              👍
                            </span>
                            <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center">
                              ❤️
                            </span>
                          </span>
                          <span className="font-semibold text-slate-700 text-xs ml-1">
                            {post.likesCount}
                          </span>
                        </div>
                        <button onClick={() => toggleComments(post.id)} className="hover:underline text-[11px]">
                          {post.commentsCount} comments
                        </button>
                      </div>

                      {/* Action Bar (Like, Comment, Share) */}
                      <div className="px-4 pb-2 grid grid-cols-3 gap-1 text-xs font-semibold text-slate-600">
                        <button
                          onClick={() => handleReactToPost(post.id, activeReaction || ReactionType.LIKE)}
                          className={`py-2 rounded-xl flex items-center justify-center space-x-2 hover:bg-slate-100 transition-colors ${
                            reactionInfo ? `${reactionInfo.color} font-bold` : 'text-slate-600'
                          }`}
                        >
                          <span>{reactionInfo ? reactionInfo.emoji : '👍'}</span>
                          <span>{reactionInfo ? reactionInfo.label : 'Like'}</span>
                        </button>

                        <button
                          onClick={() => toggleComments(post.id)}
                          className="py-2 rounded-xl flex items-center justify-center space-x-2 hover:bg-slate-100 transition-colors"
                        >
                          <MessageSquare className="w-4 h-4" />
                          <span>Comment</span>
                        </button>

                        <button
                          onClick={() => {
                            navigator.clipboard?.writeText(window.location.href);
                            alert('Post link copied to clipboard!');
                          }}
                          className="py-2 rounded-xl flex items-center justify-center space-x-2 hover:bg-slate-100 transition-colors"
                        >
                          <Share2 className="w-4 h-4" />
                          <span>Share</span>
                        </button>
                      </div>

                      {/* Comments Drawer */}
                      {expandedComments[post.id] && (
                        <div className="px-4 pb-4 pt-2 border-t border-slate-100 space-y-2.5 bg-slate-50/50">
                          <div className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={commentInputs[post.id] || ''}
                              onChange={(e) =>
                                setCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }))
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleAddComment(post.id);
                              }}
                              placeholder="Write a comment..."
                              className="flex-1 bg-white border border-slate-200 rounded-full px-3.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                            />
                            <button
                              onClick={() => handleAddComment(post.id)}
                              className="p-1.5 rounded-full bg-blue-600 text-white disabled:opacity-40"
                              disabled={!commentInputs[post.id]?.trim()}
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="space-y-2 max-h-60 overflow-y-auto">
                            {loadingComments[post.id] ? (
                              <p className="text-center text-xs text-slate-400 py-1">Loading...</p>
                            ) : expandedComments[post.id].length === 0 ? (
                              <p className="text-center text-xs text-slate-400 py-1">No comments yet.</p>
                            ) : (
                              expandedComments[post.id].map((c) => (
                                <div key={c.id} className="flex items-start space-x-2 text-xs">
                                  <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[9px] flex-shrink-0 mt-0.5">
                                    {c.author.displayName.substring(0, 2).toUpperCase()}
                                  </div>
                                  <div className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 flex-1 space-y-0.5">
                                    <span className="font-bold text-slate-900">{c.author.displayName}</span>
                                    <p className="text-slate-700 text-xs">{c.content}</p>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* --- TAB 2: INSTAGRAM PHOTOS 3-COLUMN GRID --- */}
        {activeTab === 'photos' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Instagram Project Gallery</h3>
                <p className="text-xs text-slate-500">All high-resolution photos and site inspections</p>
              </div>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                {allMediaPhotos.length} Photos
              </span>
            </div>

            {allMediaPhotos.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3">
                <Camera className="w-12 h-12 text-slate-300 mx-auto" />
                <h4 className="font-bold text-slate-800 text-sm">No photos uploaded</h4>
                <p className="text-xs text-slate-500">Photos attached to site posts will appear here in the Instagram grid.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
                {allMediaPhotos.map((photo, i) => (
                  <div
                    key={i}
                    onClick={() => setPreviewImageUrl(photo.url)}
                    className="aspect-square bg-slate-100 rounded-2xl overflow-hidden cursor-pointer relative group shadow-sm hover:shadow-lg transition-all"
                  >
                    <img
                      src={photo.url}
                      alt={photo.title || 'Photo'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    
                    {/* Instagram Dark Hover Overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-6 text-white font-bold text-sm">
                      <div className="flex items-center space-x-1.5">
                        <Heart className="w-5 h-5 fill-white" />
                        <span>{photo.likes}</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <MessageSquare className="w-5 h-5 fill-white" />
                        <span>{photo.comments}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* --- TAB 3: ABOUT & CREDENTIALS --- */}
        {activeTab === 'about' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">About & Engineering Credentials</h3>
              <p className="text-xs text-slate-500">Verified credentials and background records</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Professional Credentials Card */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3">
                <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>Professional Credentials</span>
                </h4>

                <div className="space-y-2 text-xs text-slate-700">
                  <div className="flex justify-between py-1.5 border-b border-slate-200">
                    <span className="text-slate-500">Registration Body:</span>
                    <span className="font-bold">{profileUser?.engineerProfile?.registrationBody || 'IESL'}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-200">
                    <span className="text-slate-500">Registration Number:</span>
                    <span className="font-bold">{profileUser?.engineerProfile?.registrationNumber || 'Pending'}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-200">
                    <span className="text-slate-500">Years in Practice:</span>
                    <span className="font-bold">{profileUser?.engineerProfile?.yearsOfExperience || 10} Years</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-200">
                    <span className="text-slate-500">Audit Status:</span>
                    <span className="font-bold text-emerald-600">
                      {profileUser?.engineerProfile?.verificationStatus === VerificationStatus.VERIFIED
                        ? 'Verified Official'
                        : 'Active Member'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Specializations Card */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3">
                <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider flex items-center space-x-2">
                  <Award className="w-4 h-4 text-amber-500" />
                  <span>Specializations</span>
                </h4>

                <div className="flex flex-wrap gap-2">
                  {(profileUser?.engineerProfile?.specializations || [
                    'Structural Design',
                    'Foundation Engineering',
                    'Building Approval Submissions',
                  ]).map((spec, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-semibold text-slate-800 shadow-sm"
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- TAB 4: CONNECTIONS --- */}
        {activeTab === 'connections' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900">Connections & Peer Engineers</h3>
              <span className="text-xs font-semibold text-slate-500">
                {peerConnections.length} Verified Network Peers
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {peerConnections.map((conn, idx) => (
                <div
                  key={conn.userId || idx}
                  className="p-3 border border-slate-200 rounded-xl flex items-center space-x-3 hover:bg-slate-50 transition-colors"
                >
                  <Link href={`/profile/${conn.userId}`} className="flex-shrink-0">
                    {conn.avatarUrl ? (
                      <img
                        src={conn.avatarUrl}
                        alt={conn.name}
                        className="w-11 h-11 rounded-full object-cover border border-slate-200"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                        {conn.name.substring(0, 2)}
                      </div>
                    )}
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/profile/${conn.userId}`}
                      className="text-xs font-bold text-slate-900 hover:text-blue-600 truncate flex items-center space-x-1"
                    >
                      <span className="truncate">{conn.name}</span>
                      {conn.isVerified && <ShieldCheck className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />}
                    </Link>
                    <p className="text-[11px] text-slate-500 truncate">{conn.title}</p>
                    <p className="text-[10px] text-slate-400">{conn.district}</p>
                  </div>
                  <button
                    onClick={() => {
                      const event = new CustomEvent('buildlink:open-chat', {
                        detail: {
                          partnerId: conn.userId,
                          partnerName: conn.name,
                          partnerAvatar: conn.avatarUrl,
                          partnerRole: UserRole.ENGINEER,
                          isVerifiedEngineer: Boolean(conn.isVerified),
                          partnerTitle: conn.title,
                        },
                      });
                      window.dispatchEvent(event);
                    }}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    title="Send Message"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* ========================================================
          5. LIGHTBOX IMAGE PREVIEW MODAL
         ======================================================== */}
      {previewImageUrl && (
        <div
          onClick={() => setPreviewImageUrl(null)}
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 animate-fadeIn"
        >
          <button
            onClick={() => setPreviewImageUrl(null)}
            className="absolute top-4 right-4 text-white hover:text-slate-300 p-2"
          >
            <X className="w-8 h-8" />
          </button>
          <img
            src={previewImageUrl}
            alt="Enlarged preview"
            className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
          />
        </div>
      )}

    </div>
  );
}
