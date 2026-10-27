'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import {
  ProjectDto,
  ProjectStage,
} from '@buildlink/shared';
import {
  FolderGit2,
  PlusCircle,
  Clock,
  CheckCircle2,
  ShieldCheck,
  Building,
  MapPin,
  TrendingUp,
  DollarSign,
  ArrowRight,
  HardHat,
  Calendar,
  AlertCircle,
  X,
  Sparkles,
} from 'lucide-react';

const SRI_LANKA_DISTRICTS = [
  'Colombo',
  'Gampaha',
  'Kalutara',
  'Kandy',
  'Matale',
  'Nuwara Eliya',
  'Galle',
  'Matara',
  'Hambantota',
  'Jaffna',
  'Kilinochchi',
  'Mannar',
  'Vavuniya',
  'Mullaitivu',
  'Batticaloa',
  'Ampara',
  'Trincomalee',
  'Kurunegala',
  'Puttalam',
  'Anuradhapura',
  'Polonnaruwa',
  'Badulla',
  'Monaragala',
  'Ratnapura',
  'Kegalle',
];

function ProjectsContent() {
  const router = useRouter();
  const { user, token } = useAuth();

  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [loading, setLoading] = useState(true);

  // New Project Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [district, setDistrict] = useState(SRI_LANKA_DISTRICTS[0]);
  const [estimatedBudget, setEstimatedBudget] = useState('');
  const [targetCompletionDate, setTargetCompletionDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createError, setCreateError] = useState('');

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050/api/v1';

  const loadProjects = async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/projects`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setProjects(data.data);
      }
    } catch {
      // Handled silently
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, [token]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      router.push('/login?redirect=/projects');
      return;
    }

    if (!title.trim() || !description.trim() || !location.trim()) {
      setCreateError('Please fill in title, description, and location.');
      return;
    }

    setIsSubmitting(true);
    setCreateError('');

    try {
      const res = await fetch(`${apiUrl}/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          description,
          location,
          district,
          stage: ProjectStage.PLANNING,
          estimatedBudget: Number(estimatedBudget) || 0,
          targetCompletionDate: targetCompletionDate ? new Date(targetCompletionDate).toISOString() : undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setTitle('');
        setDescription('');
        setLocation('');
        setEstimatedBudget('');
        setTargetCompletionDate('');
        setShowCreateModal(false);
        loadProjects();
      } else {
        setCreateError(data?.error?.message || 'Failed to create project.');
      }
    } catch {
      setCreateError('Network error while creating project.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-navy via-[#102d53] to-brand-blue text-white p-8 sm:p-10 shadow-xl">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-amber-300 text-xs font-bold uppercase tracking-wider mb-3 shadow-xs">
            <FolderGit2 className="w-4 h-4 text-brand-orange" />
            Project Tracker & Stage Milestones
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Construction Project Workspace
          </h1>
          <p className="mt-2 text-blue-100 text-sm sm:text-base leading-relaxed">
            Track site milestones from foundation to final inspection, monitor budgets, and receive certified engineering inspection sign-offs.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                if (!token) router.push('/login?redirect=/projects');
                else setShowCreateModal(true);
              }}
              className="btn-accent text-sm font-bold gap-2 shadow-lg"
            >
              <PlusCircle className="w-4 h-4" />
              Start New Construction Project
            </button>
            <Link
              href="/engineers"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/25 text-white font-bold text-sm transition-colors shadow-sm"
            >
              <HardHat className="w-4 h-4" />
              Find Project Engineer
            </Link>
          </div>
        </div>

        {/* Decorative backdrop shapes */}
        <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-brand-orange/20 blur-3xl pointer-events-none" />
      </div>

      {/* Projects Grid / Empty State */}
      {!token ? (
        <div className="bg-white rounded-3xl border border-brand-border p-12 text-center space-y-4 shadow-sm">
          <FolderGit2 className="w-14 h-14 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-brand-navy">Sign In to Track Projects</h3>
          <p className="text-xs text-brand-muted max-w-md mx-auto">
            Manage your home construction timeline, site photos, stage inspections, and engineer milestone certifications.
          </p>
          <Link href="/login?redirect=/projects" className="btn-primary text-xs inline-flex items-center gap-2">
            Sign In to BuildLink
          </Link>
        </div>
      ) : loading ? (
        <div className="min-h-[40vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue" />
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-white rounded-3xl border border-brand-border p-12 text-center space-y-4 shadow-sm">
          <FolderGit2 className="w-14 h-14 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-brand-navy">No construction projects yet</h3>
          <p className="text-xs text-brand-muted max-w-md mx-auto">
            Create your first construction project to automatically scaffold standard Sri Lankan building stages from soil testing to final inspection.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary text-xs inline-flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" /> Start Your Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((proj) => {
            return (
              <div
                key={proj.id}
                className="bg-white rounded-3xl border border-brand-border p-6 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Stage & District Header */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-blue-100 text-brand-blue uppercase tracking-wider">
                      {proj.stage.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs font-semibold text-brand-muted flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> {proj.district}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <Link href={`/projects/${proj.id}`} className="block group">
                    <h3 className="text-base font-bold text-brand-navy group-hover:text-brand-blue transition-colors line-clamp-1">
                      {proj.title}
                    </h3>
                  </Link>
                  <p className="text-xs text-brand-muted mt-1 line-clamp-2 leading-relaxed">
                    {proj.description}
                  </p>

                  {/* Progress Bar */}
                  <div className="mt-5 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-brand-navy">Stage Progress</span>
                      <span className="text-brand-blue">{proj.progressPercentage}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-brand-blue to-emerald-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${proj.progressPercentage}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-brand-muted block">
                      {proj.completedMilestonesCount} of {proj.totalMilestonesCount} milestones completed
                    </span>
                  </div>

                  {/* Budget & Expenditure */}
                  <div className="grid grid-cols-2 gap-2 mt-4 p-3 rounded-xl bg-slate-50 text-xs">
                    <div>
                      <span className="text-[10px] text-brand-muted uppercase font-bold block">
                        Estimated Budget
                      </span>
                      <span className="font-extrabold text-brand-navy">
                        {proj.estimatedBudget > 0
                          ? `LKR ${(proj.estimatedBudget / 1000000).toFixed(1)}M`
                          : 'Not set'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-brand-muted uppercase font-bold block">
                        Actual Spent
                      </span>
                      <span className="font-extrabold text-emerald-700">
                        {proj.actualSpent > 0
                          ? `LKR ${(proj.actualSpent / 1000000).toFixed(1)}M`
                          : 'LKR 0'}
                      </span>
                    </div>
                  </div>

                  {/* Assigned Engineer if any */}
                  {proj.assignedEngineerName && (
                    <div className="mt-3 flex items-center gap-2 p-2 rounded-lg bg-blue-50/70 border border-brand-blue/20 text-xs text-brand-navy">
                      <ShieldCheck className="w-4 h-4 text-brand-blue flex-shrink-0" />
                      <span className="truncate font-semibold">
                        Engineer: {proj.assignedEngineerName}
                      </span>
                    </div>
                  )}
                </div>

                {/* Workspace Action */}
                <div className="pt-4 border-t border-brand-border mt-5 flex items-center justify-between">
                  <span className="text-[11px] text-brand-muted">
                    Updated {new Date(proj.updatedAt).toLocaleDateString()}
                  </span>
                  <Link
                    href={`/projects/${proj.id}`}
                    className="btn-accent text-xs font-bold gap-1.5 shadow-sm"
                  >
                    Open Workspace <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white text-slate-900 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-brand-border">
              <div>
                <h3 className="text-lg font-bold text-brand-navy">
                  Start Construction Project
                </h3>
                <p className="text-xs text-brand-muted">
                  Scaffold building stages and start tracking milestones
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-brand-muted hover:text-brand-navy font-bold text-lg"
              >
                ✕
              </button>
            </div>

            {createError && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-brand-error text-xs">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-brand-navy uppercase tracking-wider mb-1">
                  Project Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Two-Story Residence - Peradeniya"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border text-xs text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-navy uppercase tracking-wider mb-1">
                  Project Description *
                </label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe building type, square footage, foundation specs, or key project goals..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border text-xs text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-brand-navy uppercase tracking-wider mb-1">
                    Site Location / Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g., 14/B Galaha Road, Peradeniya"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border text-xs text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-navy uppercase tracking-wider mb-1">
                    District *
                  </label>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border text-xs text-brand-navy bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  >
                    {SRI_LANKA_DISTRICTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-brand-navy uppercase tracking-wider mb-1">
                    Estimated Budget (LKR)
                  </label>
                  <input
                    type="number"
                    value={estimatedBudget}
                    onChange={(e) => setEstimatedBudget(e.target.value)}
                    placeholder="e.g. 18500000"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border text-xs text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-navy uppercase tracking-wider mb-1">
                    Target Completion Date
                  </label>
                  <input
                    type="date"
                    value={targetCompletionDate}
                    onChange={(e) => setTargetCompletionDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border text-xs text-brand-navy bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-blue-50 border border-brand-blue/30 text-xs text-brand-navy flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-brand-blue flex-shrink-0 mt-0.5" />
                <p>
                  <strong>Automatic Milestones:</strong> Once created, standard stages including soil test, foundation casting, structural frame, roof waterproofing, and final inspection will be pre-scaffolded for tracking.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-brand-border">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-accent text-xs font-bold px-6 py-2.5"
                >
                  {isSubmitting ? 'Creating Project...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProjectsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue" />
        </div>
      }
    >
      <ProjectsContent />
    </Suspense>
  );
}
