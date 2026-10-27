'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from './Logo';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '@buildlink/shared';
import {
  Menu,
  X,
  Compass,
  HelpCircle,
  Users,
  BookOpen,
  FolderGit2,
  LogIn,
  UserPlus,
  User as UserIcon,
  LogOut,
  HardHat,
  ChevronDown,
  MessageCircle,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navLinks = [
    { label: 'Feed', href: '/feed', icon: Compass },
    { label: 'Find Engineers', href: '/engineers', icon: Users },
    { label: 'Messages', href: '/messages', icon: MessageCircle },
  ];

  const getInitials = () => {
    if (user?.profile?.firstName && user?.profile?.lastName) {
      return `${user.profile.firstName[0]}${user.profile.lastName[0]}`.toUpperCase();
    }
    return user?.email?.substring(0, 2).toUpperCase() || 'BL';
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-brand-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand Logo */}
          <Logo />

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1 xl:space-x-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-brand-blue bg-blue-50 font-semibold'
                      : 'text-brand-text hover:text-brand-blue hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-4 h-4 text-brand-muted" />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Desktop User / Auth Area */}
          <div className="hidden lg:flex items-center space-x-3">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                  className="flex items-center gap-3 p-1.5 pr-3 rounded-full hover:bg-slate-100 transition-colors border border-transparent hover:border-brand-border focus:outline-none"
                >
                  <div className="w-9 h-9 rounded-full bg-brand-blue text-white flex items-center justify-center font-bold text-xs shadow-sm">
                    {getInitials()}
                  </div>
                  <div className="text-left hidden xl:block">
                    <p className="text-sm font-semibold text-brand-navy leading-none">
                      {user.profile?.firstName} {user.profile?.lastName}
                    </p>
                    <span className="text-[11px] font-medium inline-flex items-center gap-1 text-brand-orange mt-0.5">
                      {user.role === UserRole.ENGINEER ? (
                        <>
                          <HardHat className="w-3 h-3" /> Engineer
                        </>
                      ) : (
                        'Homeowner'
                      )}
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-brand-muted" />
                </button>

                {isUserDropdownOpen && (
                  <div
                    onMouseLeave={() => setIsUserDropdownOpen(false)}
                    className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-brand-border py-2 z-50 animate-fadeIn"
                  >
                    <div className="px-4 py-2 border-b border-brand-border">
                      <p className="text-xs text-brand-muted uppercase font-bold tracking-wider">
                        Signed in as
                      </p>
                      <p className="text-sm font-bold text-brand-navy truncate">
                        {user.email}
                      </p>
                    </div>

                    <Link
                      href="/profile"
                      onClick={() => setIsUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-brand-text hover:bg-slate-50 hover:text-brand-blue"
                    >
                      <UserIcon className="w-4 h-4 text-brand-muted" />
                      My Profile & Settings
                    </Link>

                    {user.role === UserRole.ENGINEER && (
                      <Link
                        href="/profile?tab=engineer"
                        onClick={() => setIsUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-brand-text hover:bg-slate-50 hover:text-brand-orange"
                      >
                        <HardHat className="w-4 h-4 text-brand-orange" />
                        Engineer Credentials
                      </Link>
                    )}

                    <div className="border-t border-brand-border mt-1 pt-1">
                      <button
                        onClick={() => {
                          setIsUserDropdownOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-brand-error hover:bg-red-50"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-brand-text hover:text-brand-blue hover:bg-slate-100 transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="btn-primary text-sm font-semibold gap-1.5"
                >
                  <UserPlus className="w-4 h-4" />
                  Join Now
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex lg:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              type="button"
              className="p-2 rounded-lg text-brand-text hover:text-brand-blue hover:bg-slate-100 focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-b border-brand-border bg-white px-4 pt-2 pb-6 space-y-3 shadow-lg">
          <div className="space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium ${
                    isActive
                      ? 'text-brand-blue bg-blue-50 font-semibold'
                      : 'text-brand-text hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-5 h-5 text-brand-muted" />
                  {link.label}
                </Link>
              );
            })}
          </div>

          <div className="pt-4 border-t border-brand-border flex flex-col gap-2">
            {user ? (
              <>
                <div className="px-3 py-2 bg-slate-50 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-brand-blue text-white flex items-center justify-center font-bold text-xs">
                      {getInitials()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-brand-navy leading-none">
                        {user.profile?.firstName} {user.profile?.lastName}
                      </p>
                      <p className="text-xs text-brand-muted mt-0.5">{user.email}</p>
                    </div>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-brand-blue font-semibold">
                    {user.role}
                  </span>
                </div>

                <Link
                  href="/profile"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full btn-secondary text-center justify-center gap-2"
                >
                  <UserIcon className="w-4 h-4" />
                  Manage Profile
                </Link>

                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    logout();
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-brand-error bg-red-50 hover:bg-red-100 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full btn-secondary text-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full btn-primary text-center justify-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  Join BuildLink
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
