'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Logo } from './Logo';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '@buildlink/shared';
import {
  Menu,
  X,
  Home,
  Users,
  Compass,
  FolderKanban,
  MessageCircle,
  Plus,
  Bell,
  Search,
  LogIn,
  UserPlus,
  User as UserIcon,
  LogOut,
  HardHat,
  ChevronDown,
  Camera,
  FolderGit2,
  CheckCircle2,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isCreateDropdownOpen, setIsCreateDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const navLinks = [
    { label: 'Feed', href: '/feed', icon: Home, tooltip: 'Home Feed' },
    { label: 'Groups', href: '/groups', icon: Users, tooltip: 'Construction Groups' },
    { label: 'Engineers', href: '/engineers', icon: Compass, tooltip: 'Find Engineers' },
    { label: 'Projects', href: '/projects', icon: FolderKanban, tooltip: 'Project Workspaces' },
    { label: 'Messages', href: '/messages', icon: MessageCircle, tooltip: 'Messenger' },
  ];

  const getInitials = () => {
    if (user?.profile?.firstName && user?.profile?.lastName) {
      return `${user.profile.firstName[0]}${user.profile.lastName[0]}`.toUpperCase();
    }
    return user?.email?.substring(0, 2).toUpperCase() || 'BL';
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/feed?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  const handleCreatePost = () => {
    setIsCreateDropdownOpen(false);
    window.dispatchEvent(new CustomEvent('buildlink:open-create-post'));
    if (pathname !== '/feed') {
      router.push('/feed');
    }
  };

  const handleAddStory = () => {
    setIsCreateDropdownOpen(false);
    window.dispatchEvent(new CustomEvent('buildlink:open-create-story'));
    if (pathname !== '/feed') {
      router.push('/feed');
    }
  };

  const handleMessengerClick = () => {
    // If we're already on /messages, stay there; otherwise toggle docked messenger
    const event = new CustomEvent('buildlink:toggle-docked-messenger');
    window.dispatchEvent(event);
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm select-none">
      <div className="max-w-[1920px] mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16">
          
          {/* =========================================================
              ZONE 1: LEFT - BRAND LOGO & FACEBOOK SEARCH BAR
             ========================================================= */}
          <div className="flex items-center space-x-2.5 sm:space-x-4">
            <Logo />

            {/* Facebook-style search bar */}
            <form onSubmit={handleSearchSubmit} className="relative hidden md:block">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search BuildLink (posts, engineers, groups)..."
                  className="bg-slate-100 hover:bg-slate-200/80 focus:bg-white text-slate-800 placeholder-slate-400 text-xs rounded-full pl-9 pr-4 py-2 w-48 lg:w-64 focus:w-80 transition-all border border-transparent focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </form>
          </div>

          {/* =========================================================
              ZONE 2: CENTER - FACEBOOK NAVIGATION ICON TABS
             ========================================================= */}
          <nav className="hidden md:flex items-center h-full space-x-1 sm:space-x-2 lg:space-x-4">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  title={link.tooltip}
                  className={`relative flex items-center justify-center px-4 lg:px-7 h-full text-sm font-semibold transition-colors group ${
                    isActive
                      ? 'text-blue-600'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/70 rounded-xl my-1'
                  }`}
                >
                  <Icon
                    className={`w-6 h-6 transition-transform group-hover:scale-105 ${
                      isActive ? 'stroke-[2.5px]' : 'stroke-[1.75px]'
                    }`}
                  />
                  {/* Bottom Active Indicator Bar */}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full shadow-sm" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* =========================================================
              ZONE 3: RIGHT - FACEBOOK ACTION CIRCLES & USER PROFILE
             ========================================================= */}
          <div className="flex items-center space-x-2 sm:space-x-2.5">
            {user ? (
              <>
                {/* 1. (+) Quick Create Button */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setIsCreateDropdownOpen(!isCreateDropdownOpen);
                      setIsNotificationsOpen(false);
                      setIsUserDropdownOpen(false);
                    }}
                    title="Create (Post, Story, Project)"
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-colors ${
                      isCreateDropdownOpen
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <Plus className="w-5 h-5 stroke-[2.2px]" />
                  </button>

                  {isCreateDropdownOpen && (
                    <div
                      onMouseLeave={() => setIsCreateDropdownOpen(false)}
                      className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-fadeIn"
                    >
                      <div className="px-4 py-2 border-b border-slate-100">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Create</p>
                      </div>

                      <button
                        onClick={handleCreatePost}
                        className="w-full flex items-center space-x-3 px-4 py-2.5 text-left text-sm text-slate-800 hover:bg-slate-50 transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                          <Home className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-xs text-slate-900 leading-tight">Post</p>
                          <p className="text-[11px] text-slate-500">Share a site update or question</p>
                        </div>
                      </button>

                      <button
                        onClick={handleAddStory}
                        className="w-full flex items-center space-x-3 px-4 py-2.5 text-left text-sm text-slate-800 hover:bg-slate-50 transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white flex items-center justify-center group-hover:scale-105 transition-transform">
                          <Camera className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-xs text-slate-900 leading-tight">Story</p>
                          <p className="text-[11px] text-slate-500">24-hour site snap or video</p>
                        </div>
                      </button>

                      <Link
                        href="/projects"
                        onClick={() => setIsCreateDropdownOpen(false)}
                        className="w-full flex items-center space-x-3 px-4 py-2.5 text-left text-sm text-slate-800 hover:bg-slate-50 transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                          <FolderKanban className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-xs text-slate-900 leading-tight">Project</p>
                          <p className="text-[11px] text-slate-500">Start new construction milestone</p>
                        </div>
                      </Link>

                      <Link
                        href="/groups"
                        onClick={() => setIsCreateDropdownOpen(false)}
                        className="w-full flex items-center space-x-3 px-4 py-2.5 text-left text-sm text-slate-800 hover:bg-slate-50 transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                          <Users className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-xs text-slate-900 leading-tight">Group</p>
                          <p className="text-[11px] text-slate-500">Connect with regional builders</p>
                        </div>
                      </Link>
                    </div>
                  )}
                </div>

                {/* 2. Messenger Circle Button */}
                <button
                  onClick={handleMessengerClick}
                  title="Messenger"
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors relative"
                >
                  <MessageCircle className="w-5 h-5 stroke-[2px]" />
                  <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-blue-600 rounded-full ring-2 ring-white" />
                </button>

                {/* 3. Notifications Bell Button */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setIsNotificationsOpen(!isNotificationsOpen);
                      setIsCreateDropdownOpen(false);
                      setIsUserDropdownOpen(false);
                    }}
                    title="Notifications"
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-colors relative ${
                      isNotificationsOpen
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <Bell className="w-5 h-5 stroke-[2px]" />
                    <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white">
                      3
                    </span>
                  </button>

                  {isNotificationsOpen && (
                    <div
                      onMouseLeave={() => setIsNotificationsOpen(false)}
                      className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 py-3 z-50 animate-fadeIn"
                    >
                      <div className="px-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                        <p className="text-sm font-bold text-slate-900">Notifications</p>
                        <span className="text-[11px] text-blue-600 font-semibold cursor-pointer hover:underline">
                          Mark all as read
                        </span>
                      </div>

                      <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                        <div className="p-3 hover:bg-slate-50 transition-colors flex items-start space-x-3 cursor-pointer">
                          <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs flex-shrink-0">
                            KP
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-slate-800 leading-snug">
                              <span className="font-bold">Eng. Kasun Perera</span> reacted ❤️ to your site milestone.
                            </p>
                            <span className="text-[10px] text-slate-400 mt-0.5 block">10m ago</span>
                          </div>
                        </div>

                        <div className="p-3 hover:bg-slate-50 transition-colors flex items-start space-x-3 cursor-pointer">
                          <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs flex-shrink-0">
                            🏗️
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-slate-800 leading-snug">
                              New post in <span className="font-bold">Colombo Civil Builders & Contractors</span>.
                            </p>
                            <span className="text-[10px] text-slate-400 mt-0.5 block">1h ago</span>
                          </div>
                        </div>

                        <div className="p-3 hover:bg-slate-50 transition-colors flex items-start space-x-3 cursor-pointer">
                          <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center font-bold text-xs flex-shrink-0">
                            ⭐
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-slate-800 leading-snug">
                              Your engineer verification audit status was marked <span className="font-bold text-emerald-600">Active</span>.
                            </p>
                            <span className="text-[10px] text-slate-400 mt-0.5 block">Yesterday</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. User Profile Avatar & Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setIsUserDropdownOpen(!isUserDropdownOpen);
                      setIsCreateDropdownOpen(false);
                      setIsNotificationsOpen(false);
                    }}
                    className="flex items-center space-x-2 p-1 rounded-full hover:bg-slate-100 transition-colors focus:outline-none"
                  >
                    <div className="relative">
                      {user.profile?.avatarUrl ? (
                        <img
                          src={user.profile.avatarUrl}
                          alt={user.profile.displayName || 'Profile'}
                          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover ring-2 ring-slate-200"
                        />
                      ) : (
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                          {getInitials()}
                        </div>
                      )}
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white" />
                    </div>
                    <ChevronDown className="w-4 h-4 text-slate-500 hidden sm:block" />
                  </button>

                  {isUserDropdownOpen && (
                    <div
                      onMouseLeave={() => setIsUserDropdownOpen(false)}
                      className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-fadeIn"
                    >
                      {/* User Top Card - Facebook Profile Header */}
                      <Link
                        href="/profile"
                        onClick={() => setIsUserDropdownOpen(false)}
                        className="flex items-center space-x-3 px-4 py-3 hover:bg-slate-50 border-b border-slate-100 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                          {user.profile?.avatarUrl ? (
                            <img
                              src={user.profile.avatarUrl}
                              alt="Profile"
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            getInitials()
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-900 truncate">
                            {user.profile?.firstName} {user.profile?.lastName}
                          </p>
                          <p className="text-[11px] text-blue-600 font-semibold hover:underline">
                            See your profile & timeline
                          </p>
                        </div>
                      </Link>

                      <div className="py-1">
                        <Link
                          href="/profile"
                          onClick={() => setIsUserDropdownOpen(false)}
                          className="flex items-center space-x-3 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <UserIcon className="w-4 h-4 text-slate-400" />
                          <span>Timeline & Photos</span>
                        </Link>

                        {user.role === UserRole.ENGINEER && (
                          <Link
                            href="/profile?tab=about"
                            onClick={() => setIsUserDropdownOpen(false)}
                            className="flex items-center space-x-3 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                          >
                            <HardHat className="w-4 h-4 text-amber-500" />
                            <span>Engineer Credentials</span>
                          </Link>
                        )}

                        <Link
                          href="/projects"
                          onClick={() => setIsUserDropdownOpen(false)}
                          className="flex items-center space-x-3 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <FolderKanban className="w-4 h-4 text-indigo-500" />
                          <span>My Construction Projects</span>
                        </Link>
                      </div>

                      <div className="border-t border-slate-100 pt-1">
                        <button
                          onClick={() => {
                            setIsUserDropdownOpen(false);
                            logout();
                          }}
                          className="w-full flex items-center space-x-3 px-4 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Log Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  href="/login"
                  className="px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-full transition-colors flex items-center space-x-1"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Log In</span>
                </Link>
                <Link
                  href="/register"
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-full shadow-sm transition-colors flex items-center space-x-1"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Sign Up</span>
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <div className="flex md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-1.5 rounded-lg text-slate-700 hover:bg-slate-100 focus:outline-none"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-5 space-y-3 shadow-xl">
          <form onSubmit={handleSearchSubmit} className="relative pt-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search posts, engineers, topics..."
              className="w-full bg-slate-100 text-slate-800 text-xs rounded-full pl-9 pr-4 py-2 border border-slate-200 focus:outline-none focus:border-blue-500"
            />
          </form>

          <div className="space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-semibold ${
                    isActive ? 'bg-blue-50 text-blue-600' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="border-t border-slate-100 pt-3">
            {user ? (
              <div className="space-y-2">
                <Link
                  href="/profile"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center space-x-3 p-2 bg-slate-50 rounded-xl"
                >
                  <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                    {getInitials()}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">{user.profile?.displayName || user.email}</p>
                    <p className="text-[10px] text-blue-600">View your Facebook/IG profile</p>
                  </div>
                </Link>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    logout();
                  }}
                  className="w-full py-2 text-center text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl"
                >
                  Log Out
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="py-2 text-center text-xs font-bold text-slate-700 bg-slate-100 rounded-xl"
                >
                  Log In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="py-2 text-center text-xs font-bold text-white bg-blue-600 rounded-xl"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
