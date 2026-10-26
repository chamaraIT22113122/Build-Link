'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  HelpCircle,
  Users,
  BookOpen,
  FolderGit2,
  AlertTriangle,
  ChevronDown,
  Building,
  Sparkles,
  Droplets,
  Wrench,
  Search,
} from 'lucide-react';

export default function HomePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const commonIssues = [
    {
      title: 'Bathroom Waterproofing Failures',
      category: 'Waterproofing',
      desc: 'Persistent moisture leaking into adjoining walls, grout deterioration, and membrane failure.',
      icon: Droplets,
      color: 'text-sky-600 bg-sky-50',
    },
    {
      title: 'Structural Wall & Beam Cracks',
      category: 'Structural Engineering',
      desc: 'Diagonal settlement cracks, thermal expansion fractures, and concrete spalling diagnosis.',
      icon: AlertTriangle,
      color: 'text-amber-600 bg-amber-50',
    },
    {
      title: 'Roofing Leaks & Slab Seepage',
      category: 'Roofing',
      desc: 'Water pooling on flat concrete slabs, flashing defects, and monsoon rain penetration.',
      icon: Building,
      color: 'text-blue-600 bg-blue-50',
    },
    {
      title: 'Plumbing & Pressure Deficiencies',
      category: 'Plumbing & Drainage',
      desc: 'Subsurface pipe leaks, concealed drainage blockages, and sanitary stack venting issues.',
      icon: Wrench,
      color: 'text-emerald-600 bg-emerald-50',
    },
  ];

  const steps = [
    {
      number: '01',
      title: 'Describe Your Issue',
      desc: 'Post your construction question with photos, site details, and category tags to tap into our community network.',
    },
    {
      number: '02',
      title: 'Receive Community & Expert Insights',
      desc: 'Get firsthand experiences from fellow homeowners alongside educational advice from verified engineers.',
    },
    {
      number: '03',
      title: 'Consult a Verified Professional',
      desc: 'Browse verified credentials, ratings, and specialties to request a formal 1-on-1 consultation.',
    },
    {
      number: '04',
      title: 'Execute & Document Progress',
      desc: 'Apply sound engineering solutions, update your project timeline, and share results to help others.',
    },
  ];

  const faqs = [
    {
      q: 'How does BuildLink verify engineers and construction professionals?',
      a: 'Engineers submit accredited degree certificates, professional registration licenses (e.g., IESL in Sri Lanka), and career portfolios. Each application is manually reviewed and audited by platform administrators before a Verified badge is awarded.',
    },
    {
      q: 'Is it free to ask questions and browse the community?',
      a: 'Yes. Asking construction questions, sharing photographs, browsing discussions, and exploring the Knowledge Hub is completely free for homeowners and builders.',
    },
    {
      q: 'Can community responses replace official engineering approvals?',
      a: 'No. Community discussions and educational replies provide valuable insights and guidance, but do not replace certified on-site structural inspections or statutory regulatory approvals. For critical structural defects, we urge consulting a verified engineer directly.',
    },
    {
      q: 'What consultation methods are supported on BuildLink?',
      a: 'BuildLink supports structured text-based consultations, appointment scheduling for detailed assessments, and formal on-site consultation requests with verified professionals.',
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-brand-navy text-white pt-16 pb-24 lg:pt-24 lg:pb-32">
        {/* Abstract Architectural Grid Background */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            {/* Tagline Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-brand-orange text-xs font-semibold tracking-wider uppercase mb-6 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-brand-orange" />
              <span>Connect. Build. Grow.</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight mb-6">
              Your Projects. Your Experts.{' '}
              <span className="text-brand-orange">One Community.</span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-300 font-normal leading-relaxed mb-8">
              Encountering cracks, leaks, or construction dilemmas? BuildLink unites
              homeowners, builders, and verified engineers to diagnose building problems,
              share knowledge, and book reliable professional consultations.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/register"
                className="btn-primary text-base font-semibold py-3.5 px-8 gap-2 shadow-lg"
              >
                Join the Community
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/engineers"
                className="inline-flex items-center justify-center px-8 py-3.5 rounded-lg font-semibold text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-600 transition-colors gap-2"
              >
                <Search className="w-4 h-4 text-slate-400" />
                Find an Engineer
              </Link>
            </div>

            {/* Trust highlights */}
            <div className="mt-12 pt-8 border-t border-slate-800 flex flex-wrap items-center gap-6 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Admin-Verified Engineer Credentials</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-brand-orange" />
                <span>Transparent Q&A with Photo Uploads</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-brand-blue" />
                <span>Zero Fabricated Ratings or Reviews</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Real-World Problems Section */}
      <section className="py-20 bg-white border-b border-brand-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-xs font-bold text-brand-blue uppercase tracking-widest mb-2">
              Common Construction Dilemmas
            </h2>
            <p className="text-3xl font-extrabold text-brand-navy">
              Have You Encountered These Issues?
            </p>
            <p className="text-brand-muted mt-3 text-base">
              Construction defects can cause compounding structural damage if misdiagnosed.
              BuildLink gives you verified advice before costly mistakes happen.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {commonIssues.map((issue, idx) => {
              const Icon = issue.icon;
              return (
                <div
                  key={idx}
                  className="card-base flex flex-col justify-between hover:-translate-y-1 transition-all duration-200"
                >
                  <div>
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${issue.color}`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-brand-blue">
                      {issue.category}
                    </span>
                    <h3 className="text-lg font-bold text-brand-navy mt-1 mb-2">
                      {issue.title}
                    </h3>
                    <p className="text-sm text-brand-muted leading-relaxed">
                      {issue.desc}
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-brand-border">
                    <Link
                      href={`/feed?category=${encodeURIComponent(issue.category)}`}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-navy hover:text-brand-orange transition-colors"
                    >
                      Explore discussions
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How BuildLink Works */}
      <section className="py-20 bg-brand-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-brand-orange uppercase tracking-widest mb-2">
              Streamlined Process
            </h2>
            <p className="text-3xl font-extrabold text-brand-navy">
              How BuildLink Works
            </p>
            <p className="text-brand-muted mt-3 text-base">
              From asking your first question to completing an engineer consultation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, idx) => (
              <div key={idx} className="relative bg-white rounded-xl p-6 border border-brand-border shadow-sm">
                <span className="text-3xl font-extrabold text-brand-blue/20">
                  {step.number}
                </span>
                <h3 className="text-lg font-bold text-brand-navy mt-2 mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-brand-muted leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Verified Professional Assurance */}
      <section className="py-20 bg-brand-navy text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-900/60 border border-emerald-700/50 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-4">
                <ShieldCheck className="w-4 h-4" />
                <span>Verification Process</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-snug mb-6">
                Engineers You Can Confidently Rely On
              </h2>
              <p className="text-slate-300 text-base leading-relaxed mb-6">
                On BuildLink, a verified badge is not a bought badge. Our administrators
                verify every professional credential against official licensing boards,
                academic degrees, and recognized practice standards.
              </p>
              <ul className="space-y-3 text-sm text-slate-300">
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <span>Manual inspection of professional licenses and academic degrees</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <span>Transparent reviews tied strictly to verified consultations</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <span>Categorized by discipline: Structural, Geotechnical, Services & Costing</span>
                </li>
              </ul>
              <div className="mt-8 flex gap-4">
                <Link href="/engineers" className="btn-primary text-sm font-semibold">
                  Browse Verified Engineers
                </Link>
                <Link
                  href="/register?role=ENGINEER"
                  className="btn-secondary text-sm font-semibold bg-transparent text-white border-slate-600 hover:bg-slate-800"
                >
                  Apply for Verification
                </Link>
              </div>
            </div>

            <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-6 sm:p-8 backdrop-blur-sm">
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-700">
                <div className="w-14 h-14 rounded-full bg-brand-blue flex items-center justify-center text-xl font-bold text-white">
                  CE
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-lg font-bold text-white">Eng. K. Perera</h4>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-900/80 text-emerald-300 border border-emerald-600">
                      <ShieldCheck className="w-3 h-3" />
                      Verified
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">Chartered Civil & Structural Engineer (12+ Yrs)</p>
                </div>
              </div>

              <div className="space-y-3 text-xs text-slate-300">
                <div className="flex justify-between py-1.5 border-b border-slate-700/60">
                  <span className="text-slate-400">Specializations</span>
                  <span className="font-semibold text-white">Foundations, Structural Concrete</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-700/60">
                  <span className="text-slate-400">Primary Location</span>
                  <span className="font-semibold text-white">Western Province, Sri Lanka</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-700/60">
                  <span className="text-slate-400">Languages</span>
                  <span className="font-semibold text-white">English, Sinhala</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">Consultation Modes</span>
                  <span className="font-semibold text-brand-orange">Text Assessment, On-Site Visit</span>
                </div>
              </div>

              <div className="mt-6">
                <button
                  type="button"
                  className="w-full py-2.5 rounded-lg bg-brand-blue hover:bg-blue-600 text-white font-semibold text-sm transition-colors"
                >
                  Request Consultation Preview
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-xs font-bold text-brand-blue uppercase tracking-widest mb-2">
              Got Questions?
            </h2>
            <p className="text-3xl font-extrabold text-brand-navy">
              Frequently Asked Questions
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="border border-brand-border rounded-xl overflow-hidden transition-colors"
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full flex items-center justify-between p-5 text-left font-bold text-brand-navy hover:bg-slate-50 transition-colors"
                    aria-expanded={isOpen}
                  >
                    <span className="text-base sm:text-lg">{faq.q}</span>
                    <ChevronDown
                      className={`w-5 h-5 text-brand-muted transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-brand-blue' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-sm text-brand-muted leading-relaxed border-t border-slate-100 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="bg-brand-blue text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
            Ready to Build Better, Safer Homes?
          </h2>
          <p className="text-blue-100 max-w-xl mx-auto text-base mb-8">
            Join thousands of homeowners and verified construction specialists on BuildLink today.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/register"
              className="btn-primary text-base font-semibold py-3 px-8 shadow-md"
            >
              Get Started for Free
            </Link>
            <Link
              href="/questions/ask"
              className="inline-flex items-center justify-center px-8 py-3 rounded-lg font-semibold bg-white text-brand-blue hover:bg-slate-100 transition-colors"
            >
              Ask a Construction Question
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
