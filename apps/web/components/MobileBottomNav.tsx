'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import {
  Home,
  Compass,
  PlusSquare,
  MessageCircle,
  User,
  Users,
} from 'lucide-react';

export const MobileBottomNav: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

  const handleCreateClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      router.push('/login?redirect=/feed');
      return;
    }
    // Trigger create post modal event across app
    window.dispatchEvent(new CustomEvent('buildlink:open-create-post'));
    if (pathname !== '/feed') {
      router.push('/feed');
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-3 py-2 flex items-center justify-around sm:hidden shadow-lg select-none">
      {/* 1. Home / Feed */}
      <Link
        href="/feed"
        className={`flex flex-col items-center justify-center py-1 px-2.5 transition-transform active:scale-90 ${
          pathname === '/feed' ? 'text-blue-600' : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        <Home className={`w-6 h-6 ${pathname === '/feed' ? 'stroke-[2.5px]' : 'stroke-[1.75px]'}`} />
        <span className="text-[10px] font-semibold mt-0.5">Feed</span>
      </Link>

      {/* 2. Explore / Engineers */}
      <Link
        href="/engineers"
        className={`flex flex-col items-center justify-center py-1 px-2.5 transition-transform active:scale-90 ${
          pathname === '/engineers' ? 'text-blue-600' : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        <Compass className={`w-6 h-6 ${pathname === '/engineers' ? 'stroke-[2.5px]' : 'stroke-[1.75px]'}`} />
        <span className="text-[10px] font-semibold mt-0.5">Explore</span>
      </Link>

      {/* 3. Instagram-style Create (+) Button */}
      <button
        onClick={handleCreateClick}
        aria-label="Create Post"
        className="flex flex-col items-center justify-center py-1 px-2.5 transition-transform active:scale-90 group"
      >
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md group-hover:shadow-blue-500/25">
          <PlusSquare className="w-5 h-5 stroke-[2.2px]" />
        </div>
      </button>

      {/* 4. Messages / Messenger */}
      <Link
        href="/messages"
        className={`flex flex-col items-center justify-center py-1 px-2.5 transition-transform active:scale-90 relative ${
          pathname === '/messages' ? 'text-blue-600' : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        <div className="relative">
          <MessageCircle className={`w-6 h-6 ${pathname === '/messages' ? 'stroke-[2.5px]' : 'stroke-[1.75px]'}`} />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white" />
        </div>
        <span className="text-[10px] font-semibold mt-0.5">Chat</span>
      </Link>

      {/* 5. Profile */}
      <Link
        href={user ? '/profile' : '/login?redirect=/profile'}
        className={`flex flex-col items-center justify-center py-1 px-2.5 transition-transform active:scale-90 ${
          pathname?.startsWith('/profile') ? 'text-blue-600' : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        {user?.profile?.avatarUrl ? (
          <div className={`w-6 h-6 rounded-full overflow-hidden ring-2 ${
            pathname?.startsWith('/profile') ? 'ring-blue-600' : 'ring-transparent'
          }`}>
            <img
              src={user.profile.avatarUrl}
              alt={user.profile.displayName || 'Profile'}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <User className={`w-6 h-6 ${pathname?.startsWith('/profile') ? 'stroke-[2.5px]' : 'stroke-[1.75px]'}`} />
        )}
        <span className="text-[10px] font-semibold mt-0.5">Profile</span>
      </Link>
    </nav>
  );
};
