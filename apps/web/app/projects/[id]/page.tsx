'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';
import {
  ProjectDto,
  ProjectMilestoneDto,
  ProjectStage,
  UserRole,
} from '@buildlink/shared';
import {
  FolderGit2,
  CheckCircle2,
  Circle,
  ShieldCheck,
  PlusCircle,
  Calendar,
  MapPin,
  HardHat,
  ArrowLeft,
  DollarSign,
  Award,
  FileCheck,
  X,
  AlertTriangle,
  Clock,
  Sparkles,
  Check,
} from 'lucide-react';

const STAGE_ORDER: ProjectStage[] = [
  ProjectStage.PLANNING,
  ProjectStage.DESIGN,
  ProjectStage.APPROVALS,
  ProjectStage.SITE_PREPARATION,
  ProjectStage.FOUNDATION,
  ProjectStage.STRUCTURAL_WORK,
  ProjectStage.ROOFING,
  ProjectStage.ELECTRICAL_PLUMBING,
  ProjectStage.FINISHING,
  ProjectStage.FINAL_INSPECTION,
  ProjectStage.COMPLETED,
];

export default function ProjectWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const { user, token } = useAuth();
  const projectId = params?.id as string;

  const [project, setProject] = useState<ProjectDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Sign-off Modal State
  const [activeSignOffMilestone, setActiveSignOffMilestone] = useState<ProjectMilestoneDto | null>(null);
  const [engineerNotes, setEngineerNotes] = useState('');
  const [isSubmittingSignOff, setIsSubmittingSignOff] = useState(false);

  // Add Milestone Modal State
  const [showAddMilestoneModal, setShowAddMilestoneModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newStage, setNewStage] = useState<ProjectStage>(ProjectStage.FOUNDATION);
  const [newTargetDate, setNewTargetDate] = useState('');
  const [isAddingMilestone, setIsAddingMilestone] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050/api/v1';

  const fetchProject = async () => {
    if (!token || !projectId) return;

    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.data) {
        setProject(data.data);
      } else {
        setError(data?.error?.message || 'Project not found');
      }
    } catch {
      setError('Error connecting to project workspace');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProject();
  }, [projectId, token]);

  // Toggle Milestone Completion
  const handleToggleMilestone = async (milestoneId: string, currentStatus: boolean) => {
    if (!token) return;

    try {
      const res = await fetch(`${apiUrl}/projects/${projectId}/milestones/${milestoneId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isCompleted: !currentStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setProject((prev) => {
          if (!prev) return null;
          const updatedMilestones = prev.milestones.map((m) =>
            m.id === milestoneId ? { ...m, isCompleted: !currentStatus } : m
          );
          const completedCount = updatedMilestones.filter((m) => m.isCompleted).length;
          const progressPercentage = Math.round((completedCount / updatedMilestones.length) * 100);
          return {
            ...prev,
            milestones: updatedMilestones,
            completedMilestonesCount: completedCount,
            progressPercentage,
          };
        });
      }
    } catch {
      alert('Failed to update milestone status.');
    }
  };

  // Submit Engineer Sign-Off
  const handleSubmitSignOff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !activeSignOffMilestone) return;

    setIsSubmittingSignOff(true);
    try {
      const res = await fetch(
        `${apiUrl}/projects/${projectId}/milestones/${activeSignOffMilestone.id}/sign-off`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ notes: engineerNotes }),
        }
      );
      const data = await res.json();
      if (data.success) {
        setActiveSignOffMilestone(null);
        setEngineerNotes('');
        fetchProject();
      } else {
        alert(data?.error?.message || 'Failed to sign off milestone.');
      }
    } catch {
      alert('Error during engineer sign-off.');
    } finally {
      setIsSubmittingSignOff(false);
    }
  };

  // Add Custom Milestone
  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newTitle.trim()) return;

    setIsAddingMilestone(true);
    try {
      const res = await fetch(`${apiUrl}/projects/${projectId}/milestones`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          stage: newStage,
          title: newTitle,
          description: newDescription,
          targetDate: newTargetDate ? new Date(newTargetDate).toISOString() : undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNewTitle('');
        setNewDescription('');
        setShowAddMilestoneModal(false);
        fetchProject();
      } else {
        alert(data?.error?.message || 'Failed to add milestone.');
      }
    } catch {
      alert('Error adding milestone.');
    } finally {
      setIsAddingMilestone(false);
    }
  };

  if (!token) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <FolderGit2 className="w-12 h-12 text-slate-300 mx-auto" />
        <h2 className="text-xl font-bold text-brand-navy">Sign In Required</h2>
        <p className="text-xs text-brand-muted">Please sign in to access this project workspace.</p>
        <Link href={`/login?redirect=/projects/${projectId}`} className="btn-primary text-xs">
          Sign In
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-brand-navy">Project Not Found</h2>
        <p className="text-xs text-brand-muted">{error || 'Unable to access this project workspace.'}</p>
        <Link href="/projects" className="btn-primary text-xs inline-flex items-center gap-1.5">
          <ArrowLeft className="w-4 h-4" /> Return to Projects Hub
        </Link>
      </div>
    );
  }

  const isUserEngineer = user?.role === UserRole.ENGINEER;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back Link */}
      <div>
        <Link
          href="/projects"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-blue hover:text-brand-navy transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Projects Hub
        </Link>
      </div>

      {/* Project Header Banner */}
      <div className="bg-white rounded-3xl border border-brand-border p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-blue-100 text-brand-blue uppercase tracking-wider">
                Current Stage: {project.stage.replace(/_/g, ' ')}
              </span>
              <span className="text-xs font-semibold text-brand-muted flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" /> {project.location}, {project.district}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-brand-navy">
              {project.title}
            </h1>
            <p className="text-xs sm:text-sm text-brand-muted mt-1 max-w-2xl">
              {project.description}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddMilestoneModal(true)}
              className="btn-accent text-xs font-bold gap-1.5 shadow-md"
            >
              <PlusCircle className="w-4 h-4" /> Add Milestone
            </button>
          </div>
        </div>

        {/* Progress & Metrics Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-brand-border">
          <div className="p-4 rounded-2xl bg-slate-50 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-brand-navy">
              <span>Overall Progress</span>
              <span className="text-brand-blue font-extrabold">{project.progressPercentage}%</span>
            </div>
            <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-brand-blue to-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${project.progressPercentage}%` }}
              />
            </div>
            <span className="text-[11px] text-brand-muted block">
              {project.completedMilestonesCount} / {project.totalMilestonesCount} milestones completed
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-brand-muted uppercase font-bold block">
                Estimated Budget
              </span>
              <span className="text-lg font-black text-brand-navy">
                {project.estimatedBudget > 0
                  ? `LKR ${(project.estimatedBudget / 1000000).toFixed(2)}M`
                  : 'LKR 0'}
              </span>
            </div>
            <DollarSign className="w-8 h-8 text-brand-blue/30" />
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-brand-muted uppercase font-bold block">
                Assigned Engineer
              </span>
              <span className="text-sm font-bold text-brand-navy block truncate">
                {project.assignedEngineerName || 'No engineer assigned'}
              </span>
              {project.assignedEngineerName && (
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-bold mt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Verified Sign-Off Authority
                </span>
              )}
            </div>
            <HardHat className="w-8 h-8 text-brand-orange/30" />
          </div>
        </div>
      </div>

      {/* Stage Stepper Progress */}
      <div className="bg-white rounded-3xl border border-brand-border p-6 shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-brand-navy uppercase tracking-wider flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-brand-orange" /> Construction Stage Lifecycle
        </h3>
        <div className="flex items-center gap-2 overflow-x-auto pb-3 pt-1">
          {STAGE_ORDER.map((stage, idx) => {
            const isCurrent = project.stage === stage;
            const isPast = STAGE_ORDER.indexOf(project.stage) > idx;

            return (
              <div
                key={stage}
                className={`flex-shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all ${
                  isCurrent
                    ? 'bg-brand-blue text-white border-brand-blue shadow-md ring-2 ring-blue-200'
                    : isPast
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-slate-50 text-brand-muted border-brand-border'
                }`}
              >
                {isPast ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                ) : isCurrent ? (
                  <div className="w-2 h-2 rounded-full bg-white animate-ping" />
                ) : (
                  <span className="text-[10px] font-mono">{idx + 1}</span>
                )}
                <span>{stage.replace(/_/g, ' ')}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Milestones Checklist */}
      <div className="bg-white rounded-3xl border border-brand-border p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-brand-navy">Site Milestones & Inspection Sign-Offs</h2>
            <p className="text-xs text-brand-muted">
              Check off completed steps. Certified engineers can stamp inspections with official notes.
            </p>
          </div>
          <span className="text-xs font-semibold text-brand-muted">
            {project.milestones.length} Milestones
          </span>
        </div>

        <div className="space-y-4">
          {project.milestones.map((milestone) => {
            return (
              <div
                key={milestone.id}
                className={`p-5 rounded-2xl border transition-all ${
                  milestone.isSignedOffByEngineer
                    ? 'bg-emerald-50/40 border-emerald-300 ring-1 ring-emerald-300'
                    : milestone.isCompleted
                    ? 'bg-slate-50/70 border-brand-border'
                    : 'bg-white border-brand-border'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    {/* Completion Toggle Checkbox */}
                    <button
                      onClick={() => handleToggleMilestone(milestone.id, milestone.isCompleted)}
                      className="mt-0.5 text-brand-blue hover:text-emerald-600 transition-colors focus:outline-none"
                    >
                      {milestone.isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-300 hover:text-brand-blue" />
                      )}
                    </button>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-slate-100 text-brand-navy">
                          {milestone.stage.replace(/_/g, ' ')}
                        </span>
                        <h4
                          className={`text-sm font-bold transition-all ${
                            milestone.isCompleted ? 'text-brand-navy' : 'text-brand-navy'
                          }`}
                        >
                          {milestone.title}
                        </h4>
                      </div>

                      {milestone.description && (
                        <p className="text-xs text-brand-muted mt-1 leading-relaxed">
                          {milestone.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions / Badges */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {/* If signed off, show gold stamp */}
                    {milestone.isSignedOffByEngineer ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-600 text-white shadow-xs">
                        <Award className="w-4 h-4 text-amber-300" />
                        Engineer Certified
                      </span>
                    ) : isUserEngineer ? (
                      <button
                        onClick={() => {
                          setActiveSignOffMilestone(milestone);
                          setEngineerNotes('');
                        }}
                        className="btn-accent text-xs font-bold gap-1 py-1.5 px-3"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Certify & Sign Off
                      </button>
                    ) : null}
                  </div>
                </div>

                {/* Engineer Inspection Sign-Off Stamp Details */}
                {milestone.isSignedOffByEngineer && (
                  <div className="mt-4 p-3.5 rounded-xl bg-white border border-emerald-300 space-y-1 text-xs">
                    <div className="flex items-center justify-between text-emerald-800 font-bold">
                      <span className="flex items-center gap-1.5">
                        <FileCheck className="w-4 h-4 text-emerald-600" />
                        Certified by {milestone.signedOffEngineerName || 'Registered Engineer'}
                      </span>
                      {milestone.signedOffAt && (
                        <span className="text-[11px] text-brand-muted">
                          {new Date(milestone.signedOffAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    {milestone.engineerNotes && (
                      <p className="text-brand-text italic mt-1 pl-5">
                        &quot;{milestone.engineerNotes}&quot;
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Engineer Sign-Off Modal */}
      {activeSignOffMilestone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white text-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-brand-border">
              <div>
                <h3 className="text-base font-bold text-brand-navy flex items-center gap-1.5">
                  <ShieldCheck className="w-5 h-5 text-brand-blue" />
                  Engineering Milestone Certification
                </h3>
                <p className="text-xs text-brand-muted mt-0.5">
                  {activeSignOffMilestone.title}
                </p>
              </div>
              <button
                onClick={() => setActiveSignOffMilestone(null)}
                className="text-brand-muted hover:text-brand-navy font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitSignOff} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-brand-navy uppercase tracking-wider mb-1">
                  Inspection Notes & Compliance Stamp *
                </label>
                <textarea
                  rows={4}
                  required
                  value={engineerNotes}
                  onChange={(e) => setEngineerNotes(e.target.value)}
                  placeholder="e.g. Inspected reinforcement bar spacing (T16/T12) and 50mm clear cover. Concrete batch cube test meets C25/30 specifications. Approved."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border text-xs text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                <p className="font-semibold">Notice of Professional Certification:</p>
                <p className="text-[11px] mt-0.5">
                  This certification will be recorded permanently in the project audit history under your registered engineer credentials.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-brand-border">
                <button
                  type="button"
                  onClick={() => setActiveSignOffMilestone(null)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingSignOff}
                  className="btn-accent text-xs font-bold px-5 py-2.5"
                >
                  {isSubmittingSignOff ? 'Signing off...' : 'Sign Off & Certify'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Custom Milestone Modal */}
      {showAddMilestoneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white text-slate-900 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-brand-border">
              <h3 className="text-base font-bold text-brand-navy">Add Site Milestone</h3>
              <button
                onClick={() => setShowAddMilestoneModal(false)}
                className="text-brand-muted hover:text-brand-navy font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddMilestone} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-brand-navy uppercase tracking-wider mb-1">
                  Milestone Title *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Anti-termite barrier treatment"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border text-xs text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-navy uppercase tracking-wider mb-1">
                  Construction Stage
                </label>
                <select
                  value={newStage}
                  onChange={(e) => setNewStage(e.target.value as ProjectStage)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border text-xs text-brand-navy bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
                >
                  {STAGE_ORDER.map((stage) => (
                    <option key={stage} value={stage}>
                      {stage.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-navy uppercase tracking-wider mb-1">
                  Description (Optional)
                </label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Additional inspection criteria or specifications..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border text-xs text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-navy uppercase tracking-wider mb-1">
                  Target Date (Optional)
                </label>
                <input
                  type="date"
                  value={newTargetDate}
                  onChange={(e) => setNewTargetDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border text-xs text-brand-navy bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-brand-border">
                <button
                  type="button"
                  onClick={() => setShowAddMilestoneModal(false)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAddingMilestone}
                  className="btn-accent text-xs font-bold px-5 py-2.5"
                >
                  {isAddingMilestone ? 'Adding...' : 'Add Milestone'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
