'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from './Logo';
import { ShieldCheck, MapPin } from 'lucide-react';

export const Footer: React.FC = () => {
  const pathname = usePathname();

  // Hide the marketing footer on full-screen chat/messenger pages
  if (pathname?.startsWith('/messages')) {
    return null;
  }
  return (
    <footer className="bg-brand-navy text-slate-300 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <Logo variant="dark" />
            <p className="text-slate-400 text-sm max-w-sm leading-relaxed">
              BuildLink is the dedicated construction platform connecting homeowners,
              builders, and industry practitioners with verified engineers and specialists.
            </p>
            <div className="flex items-center gap-2 text-xs text-brand-orange font-semibold tracking-wide">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Verified Professional Community</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <MapPin className="w-3.5 h-3.5 text-slate-500" />
              <span>Sri Lanka Market & Regional Coverage</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-4">
              Explore
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/feed" className="hover:text-white transition-colors">
                  Community Feed
                </Link>
              </li>
              <li>
                <Link href="/questions/ask" className="hover:text-white transition-colors">
                  Ask a Question
                </Link>
              </li>
              <li>
                <Link href="/engineers" className="hover:text-white transition-colors">
                  Find Verified Engineers
                </Link>
              </li>
              <li>
                <Link href="/knowledge" className="hover:text-white transition-colors">
                  Knowledge Hub
                </Link>
              </li>
              <li>
                <Link href="/projects" className="hover:text-white transition-colors">
                  Construction Projects
                </Link>
              </li>
            </ul>
          </div>

          {/* Common Topics */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-4">
              Categories
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/feed?category=Waterproofing" className="hover:text-white transition-colors">
                  Waterproofing
                </Link>
              </li>
              <li>
                <Link href="/feed?category=Structural" className="hover:text-white transition-colors">
                  Structural & Foundations
                </Link>
              </li>
              <li>
                <Link href="/feed?category=Roofing" className="hover:text-white transition-colors">
                  Roofing & Leaks
                </Link>
              </li>
              <li>
                <Link href="/feed?category=Plumbing" className="hover:text-white transition-colors">
                  Plumbing & Drainage
                </Link>
              </li>
              <li>
                <Link href="/feed?category=Materials" className="hover:text-white transition-colors">
                  Construction Materials
                </Link>
              </li>
            </ul>
          </div>

          {/* Trust & Legal */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-4">
              Trust & Legal
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/safety" className="hover:text-white transition-colors">
                  Safety & Disclaimers
                </Link>
              </li>
              <li>
                <Link href="/verification-process" className="hover:text-white transition-colors">
                  Verification Process
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  Contact & Support
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>© {new Date().getFullYear()} BuildLink. All rights reserved. Building stronger communities for better homes.</p>
          <p className="text-slate-500">
            Engineered with Next.js, Express & Microsoft SQL Server
          </p>
        </div>
      </div>
    </footer>
  );
};
