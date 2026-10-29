import { randomUUID } from 'crypto';
import { AppDataSource } from '../database/data-source';
import { Project, ProjectMilestone, User, EngineerProfile } from '../database/entities';
import { UserService } from './user.service';
import { EngineerService } from './engineer.service';
import {
  ProjectStage,
  VerificationStatus,
  ProjectDto,
  ProjectMilestoneDto,
  CreateProjectDto,
  UpdateProjectDto,
  CreateMilestoneDto,
  SignOffMilestoneDto,
} from '@buildlink/shared';

// In-memory resilient stores for offline / test environments
const memoryProjects = new Map<string, Project>();
const memoryMilestones = new Map<string, ProjectMilestone>();

const DEFAULT_STAGE_MILESTONES = [
  { stage: ProjectStage.PLANNING, title: 'Topographical Survey & Architectural Concept Review' },
  { stage: ProjectStage.DESIGN, title: 'Structural Engineering Drawings & Calculations' },
  { stage: ProjectStage.APPROVALS, title: 'Municipal Council & UDA Development Permit Approval' },
  { stage: ProjectStage.SITE_PREPARATION, title: 'Site Clearing, Setting Out & Soil Bearing Test' },
  { stage: ProjectStage.FOUNDATION, title: 'Substructure Excavation & Reinforced Concrete Footings' },
  { stage: ProjectStage.STRUCTURAL_WORK, title: 'Reinforced Concrete Columns, Beams & 1st Floor Slab' },
  { stage: ProjectStage.ROOFING, title: 'Structural Roof Trusses & Waterproofing Membrane Installation' },
  { stage: ProjectStage.ELECTRICAL_PLUMBING, title: 'First-Fix Concealed Plumbing & Electrical Conduiting' },
  { stage: ProjectStage.FINISHING, title: 'Wall Plastering, Floor Screed, Tiling & Painting' },
  { stage: ProjectStage.FINAL_INSPECTION, title: 'Comprehensive Structural Audit & Certificate of Conformity' },
];

export class ProjectService {
  private static toMilestoneDto(
    m: ProjectMilestone,
    signedOffEngineerName?: string
  ): ProjectMilestoneDto {
    return {
      id: m.id,
      projectId: m.projectId,
      stage: m.stage,
      title: m.title,
      description: m.description,
      targetDate: m.targetDate?.toISOString?.() || (m.targetDate ? String(m.targetDate) : undefined),
      isCompleted: Boolean(m.isCompleted),
      completedAt: m.completedAt?.toISOString?.() || (m.completedAt ? String(m.completedAt) : undefined),
      isSignedOffByEngineer: Boolean(m.isSignedOffByEngineer),
      signedOffByEngineerId: m.signedOffByEngineerId,
      signedOffEngineerName,
      signedOffAt: m.signedOffAt?.toISOString?.() || (m.signedOffAt ? String(m.signedOffAt) : undefined),
      engineerNotes: m.engineerNotes,
      photoUrls: m.photoUrlsJson ? JSON.parse(m.photoUrlsJson) : [],
      createdAt: m.createdAt?.toISOString?.() || new Date().toISOString(),
      updatedAt: m.updatedAt?.toISOString?.() || new Date().toISOString(),
    };
  }

  private static toProjectDto(
    project: Project,
    milestones: ProjectMilestone[] = [],
    ownerName?: string,
    engineerName?: string,
    engineerTitle?: string
  ): ProjectDto {
    const milestoneDtos = milestones.map((m) => ProjectService.toMilestoneDto(m));
    const completedCount = milestoneDtos.filter((m) => m.isCompleted).length;
    const totalCount = milestoneDtos.length;
    const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return {
      id: project.id,
      ownerId: project.ownerId,
      ownerName: ownerName || project.owner?.profile?.displayName,
      assignedEngineerId: project.assignedEngineerId,
      assignedEngineerName: engineerName || project.assignedEngineer?.user?.profile?.displayName,
      assignedEngineerTitle: engineerTitle || project.assignedEngineer?.title,
      title: project.title,
      description: project.description,
      location: project.location,
      district: project.district,
      stage: project.stage,
      estimatedBudget: Number(project.estimatedBudget || 0),
      actualSpent: Number(project.actualSpent || 0),
      startDate: project.startDate?.toISOString?.() || (project.startDate ? String(project.startDate) : undefined),
      targetCompletionDate: project.targetCompletionDate?.toISOString?.() || (project.targetCompletionDate ? String(project.targetCompletionDate) : undefined),
      milestones: milestoneDtos,
      completedMilestonesCount: completedCount,
      totalMilestonesCount: totalCount,
      progressPercentage,
      createdAt: project.createdAt?.toISOString?.() || new Date().toISOString(),
      updatedAt: project.updatedAt?.toISOString?.() || new Date().toISOString(),
    };
  }

  public static async createProject(
    ownerId: string,
    dto: CreateProjectDto
  ): Promise<ProjectDto> {
    const owner = await UserService.findById(ownerId);
    if (!owner) {
      throw new Error('OWNER_NOT_FOUND');
    }

    let resolvedEngineerProfileId: string | undefined = undefined;
    if (dto.assignedEngineerId) {
      const eng = await EngineerService.getEngineerById(dto.assignedEngineerId);
      if (!eng) {
        throw new Error('ENGINEER_NOT_FOUND');
      }
      resolvedEngineerProfileId = eng.id;
    }

    const startDate = dto.startDate ? new Date(dto.startDate) : undefined;
    const targetDate = dto.targetCompletionDate ? new Date(dto.targetCompletionDate) : undefined;

    if (AppDataSource.isInitialized) {
      const projRepo = AppDataSource.getRepository(Project);
      const milestoneRepo = AppDataSource.getRepository(ProjectMilestone);

      const project = projRepo.create({
        ownerId,
        assignedEngineerId: resolvedEngineerProfileId,
        title: dto.title,
        description: dto.description,
        location: dto.location,
        district: dto.district,
        stage: dto.stage || ProjectStage.PLANNING,
        estimatedBudget: dto.estimatedBudget || 0,
        actualSpent: 0,
        startDate,
        targetCompletionDate: targetDate,
      });

      const savedProject = await projRepo.save(project);

      // Create default milestones
      const createdMilestones: ProjectMilestone[] = [];
      for (const item of DEFAULT_STAGE_MILESTONES) {
        const m = milestoneRepo.create({
          projectId: savedProject.id,
          stage: item.stage,
          title: item.title,
          isCompleted: item.stage === ProjectStage.PLANNING,
        });
        createdMilestones.push(await milestoneRepo.save(m));
      }

      return ProjectService.toProjectDto(
        savedProject,
        createdMilestones,
        owner.profile?.displayName
      );
    }

    // In-memory fallback
    const projectId = randomUUID();
    const now = new Date();

    const inMemoryProject = {
      id: projectId,
      ownerId,
      owner,
      assignedEngineerId: dto.assignedEngineerId,
      title: dto.title,
      description: dto.description,
      location: dto.location,
      district: dto.district,
      stage: dto.stage || ProjectStage.PLANNING,
      estimatedBudget: dto.estimatedBudget || 0,
      actualSpent: 0,
      startDate,
      targetCompletionDate: targetDate,
      createdAt: now,
      updatedAt: now,
    } as unknown as Project;

    memoryProjects.set(projectId, inMemoryProject);

    const createdMilestones: ProjectMilestone[] = [];
    for (const item of DEFAULT_STAGE_MILESTONES) {
      const mId = randomUUID();
      const m = {
        id: mId,
        projectId,
        stage: item.stage,
        title: item.title,
        isCompleted: item.stage === ProjectStage.PLANNING,
        isSignedOffByEngineer: false,
        createdAt: now,
        updatedAt: now,
      } as unknown as ProjectMilestone;

      memoryMilestones.set(mId, m);
      createdMilestones.push(m);
    }

    return ProjectService.toProjectDto(
      inMemoryProject,
      createdMilestones,
      owner.profile?.displayName
    );
  }

  public static async listUserProjects(userId: string): Promise<ProjectDto[]> {
    if (AppDataSource.isInitialized) {
      const projRepo = AppDataSource.getRepository(Project);
      const projects = await projRepo
        .createQueryBuilder('p')
        .leftJoinAndSelect('p.owner', 'owner')
        .leftJoinAndSelect('owner.profile', 'ownerProfile')
        .leftJoinAndSelect('p.assignedEngineer', 'eng')
        .leftJoinAndSelect('eng.user', 'engUser')
        .leftJoinAndSelect('engUser.profile', 'engProfile')
        .leftJoinAndSelect('p.milestones', 'm')
        .where('p.ownerId = :userId OR eng.userId = :userId', { userId })
        .orderBy('p.updatedAt', 'DESC')
        .getMany();

      return projects.map((p) =>
        ProjectService.toProjectDto(
          p,
          p.milestones || [],
          p.owner?.profile?.displayName,
          p.assignedEngineer?.user?.profile?.displayName,
          p.assignedEngineer?.title
        )
      );
    }

    // In-memory fallback
    const memory = UserService.getMemoryStore();
    const userRecord = memory.get(userId);
    const engineerProfileId = userRecord?.engineerProfile?.id;

    const results: ProjectDto[] = [];
    for (const p of memoryProjects.values()) {
      if (p.ownerId === userId || (engineerProfileId && p.assignedEngineerId === engineerProfileId)) {
        const pMilestones = Array.from(memoryMilestones.values()).filter(
          (m) => m.projectId === p.id
        );
        const owner = await UserService.findById(p.ownerId);
        const eng = p.assignedEngineerId ? await EngineerService.getEngineerById(p.assignedEngineerId) : null;

        results.push(
          ProjectService.toProjectDto(
            p,
            pMilestones,
            owner?.profile?.displayName,
            eng?.displayName,
            eng?.title
          )
        );
      }
    }

    return results.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  public static async getProjectById(
    userId: string,
    projectId: string
  ): Promise<ProjectDto | null> {
    if (AppDataSource.isInitialized) {
      const projRepo = AppDataSource.getRepository(Project);
      const p = await projRepo
        .createQueryBuilder('p')
        .leftJoinAndSelect('p.owner', 'owner')
        .leftJoinAndSelect('owner.profile', 'ownerProfile')
        .leftJoinAndSelect('p.assignedEngineer', 'eng')
        .leftJoinAndSelect('eng.user', 'engUser')
        .leftJoinAndSelect('engUser.profile', 'engProfile')
        .leftJoinAndSelect('p.milestones', 'm')
        .where('p.id = :id', { id: projectId })
        .getOne();

      if (!p) return null;

      // Check authorization: owner, assigned engineer, or admin
      if (p.ownerId !== userId && p.assignedEngineer?.userId !== userId) {
        throw new Error('FORBIDDEN');
      }

      return ProjectService.toProjectDto(
        p,
        p.milestones || [],
        p.owner?.profile?.displayName,
        p.assignedEngineer?.user?.profile?.displayName,
        p.assignedEngineer?.title
      );
    }

    // In-memory
    const p = memoryProjects.get(projectId);
    if (!p) return null;

    const memory = UserService.getMemoryStore();
    const userRecord = memory.get(userId);
    const engineerProfileId = userRecord?.engineerProfile?.id;

    if (p.ownerId !== userId && p.assignedEngineerId !== engineerProfileId) {
      throw new Error('FORBIDDEN');
    }

    const pMilestones = Array.from(memoryMilestones.values()).filter(
      (m) => m.projectId === p.id
    );
    const owner = await UserService.findById(p.ownerId);
    const eng = p.assignedEngineerId ? await EngineerService.getEngineerById(p.assignedEngineerId) : null;

    return ProjectService.toProjectDto(
      p,
      pMilestones,
      owner?.profile?.displayName,
      eng?.displayName,
      eng?.title
    );
  }

  public static async updateProject(
    userId: string,
    projectId: string,
    dto: UpdateProjectDto
  ): Promise<ProjectDto> {
    if (AppDataSource.isInitialized) {
      const projRepo = AppDataSource.getRepository(Project);
      const p = await projRepo.findOne({
        where: { id: projectId },
        relations: ['milestones', 'owner', 'assignedEngineer'],
      });
      if (!p) throw new Error('PROJECT_NOT_FOUND');
      if (p.ownerId !== userId) throw new Error('FORBIDDEN');

      if (dto.title !== undefined) p.title = dto.title;
      if (dto.description !== undefined) p.description = dto.description;
      if (dto.location !== undefined) p.location = dto.location;
      if (dto.district !== undefined) p.district = dto.district;
      if (dto.stage !== undefined) p.stage = dto.stage;
      if (dto.estimatedBudget !== undefined) p.estimatedBudget = dto.estimatedBudget;
      if (dto.actualSpent !== undefined) p.actualSpent = dto.actualSpent;
      if (dto.assignedEngineerId !== undefined) p.assignedEngineerId = dto.assignedEngineerId;
      if (dto.startDate !== undefined) p.startDate = new Date(dto.startDate);
      if (dto.targetCompletionDate !== undefined) p.targetCompletionDate = new Date(dto.targetCompletionDate);

      const saved = await projRepo.save(p);
      return ProjectService.toProjectDto(saved, saved.milestones || []);
    }

    // In-memory
    const p = memoryProjects.get(projectId);
    if (!p) throw new Error('PROJECT_NOT_FOUND');
    if (p.ownerId !== userId) throw new Error('FORBIDDEN');

    if (dto.title !== undefined) p.title = dto.title;
    if (dto.description !== undefined) p.description = dto.description;
    if (dto.location !== undefined) p.location = dto.location;
    if (dto.district !== undefined) p.district = dto.district;
    if (dto.stage !== undefined) p.stage = dto.stage;
    if (dto.estimatedBudget !== undefined) p.estimatedBudget = dto.estimatedBudget;
    if (dto.actualSpent !== undefined) p.actualSpent = dto.actualSpent;
    if (dto.assignedEngineerId !== undefined) p.assignedEngineerId = dto.assignedEngineerId;
    if (dto.startDate !== undefined) p.startDate = new Date(dto.startDate);
    if (dto.targetCompletionDate !== undefined) p.targetCompletionDate = new Date(dto.targetCompletionDate);
    p.updatedAt = new Date();

    const pMilestones = Array.from(memoryMilestones.values()).filter(
      (m) => m.projectId === p.id
    );
    return ProjectService.toProjectDto(p, pMilestones);
  }

  public static async addMilestone(
    userId: string,
    projectId: string,
    dto: CreateMilestoneDto
  ): Promise<ProjectMilestoneDto> {
    const project = await ProjectService.getProjectById(userId, projectId);
    if (!project) throw new Error('PROJECT_NOT_FOUND');

    const targetDate = dto.targetDate ? new Date(dto.targetDate) : undefined;
    const photoUrlsJson = dto.photoUrls ? JSON.stringify(dto.photoUrls) : undefined;

    if (AppDataSource.isInitialized) {
      const mRepo = AppDataSource.getRepository(ProjectMilestone);
      const m = mRepo.create({
        projectId,
        stage: dto.stage,
        title: dto.title,
        description: dto.description,
        targetDate,
        photoUrlsJson,
      });
      const saved = await mRepo.save(m);
      return ProjectService.toMilestoneDto(saved);
    }

    // In-memory
    const mId = randomUUID();
    const now = new Date();
    const m = {
      id: mId,
      projectId,
      stage: dto.stage,
      title: dto.title,
      description: dto.description,
      targetDate,
      isCompleted: false,
      isSignedOffByEngineer: false,
      photoUrlsJson,
      createdAt: now,
      updatedAt: now,
    } as unknown as ProjectMilestone;

    memoryMilestones.set(mId, m);
    return ProjectService.toMilestoneDto(m);
  }

  public static async updateMilestone(
    userId: string,
    projectId: string,
    milestoneId: string,
    isCompleted: boolean
  ): Promise<ProjectMilestoneDto> {
    const project = await ProjectService.getProjectById(userId, projectId);
    if (!project) throw new Error('PROJECT_NOT_FOUND');

    if (AppDataSource.isInitialized) {
      const mRepo = AppDataSource.getRepository(ProjectMilestone);
      const m = await mRepo.findOne({ where: { id: milestoneId, projectId } });
      if (!m) throw new Error('MILESTONE_NOT_FOUND');

      m.isCompleted = isCompleted;
      m.completedAt = isCompleted ? new Date() : undefined;
      const saved = await mRepo.save(m);
      return ProjectService.toMilestoneDto(saved);
    }

    // In-memory
    const m = memoryMilestones.get(milestoneId);
    if (!m || m.projectId !== projectId) throw new Error('MILESTONE_NOT_FOUND');

    m.isCompleted = isCompleted;
    m.completedAt = isCompleted ? new Date() : undefined;
    m.updatedAt = new Date();

    return ProjectService.toMilestoneDto(m);
  }

  public static async signOffMilestone(
    engineerUserId: string,
    projectId: string,
    milestoneId: string,
    dto: SignOffMilestoneDto
  ): Promise<ProjectMilestoneDto> {
    const engineerUser = await UserService.findById(engineerUserId);
    if (!engineerUser || !engineerUser.engineerProfile) {
      throw new Error('ONLY_ENGINEERS_CAN_SIGN_OFF');
    }

    if (engineerUser.engineerProfile.verificationStatus !== VerificationStatus.VERIFIED) {
      throw new Error('VERIFIED_ENGINEER_REQUIRED');
    }

    const now = new Date();

    if (AppDataSource.isInitialized) {
      const mRepo = AppDataSource.getRepository(ProjectMilestone);
      const m = await mRepo.findOne({ where: { id: milestoneId, projectId } });
      if (!m) throw new Error('MILESTONE_NOT_FOUND');

      m.isCompleted = true;
      m.completedAt = m.completedAt || now;
      m.isSignedOffByEngineer = true;
      m.signedOffByEngineerId = engineerUser.engineerProfile.id;
      m.signedOffAt = now;
      m.engineerNotes = dto.notes || m.engineerNotes;

      const saved = await mRepo.save(m);
      return ProjectService.toMilestoneDto(saved, engineerUser.profile?.displayName);
    }

    // In-memory
    const m = memoryMilestones.get(milestoneId);
    if (!m || m.projectId !== projectId) throw new Error('MILESTONE_NOT_FOUND');

    m.isCompleted = true;
    m.completedAt = m.completedAt || now;
    m.isSignedOffByEngineer = true;
    m.signedOffByEngineerId = engineerUser.engineerProfile.id;
    m.signedOffAt = now;
    m.engineerNotes = dto.notes || m.engineerNotes;
    m.updatedAt = now;

    return ProjectService.toMilestoneDto(m, engineerUser.profile?.displayName);
  }

  public static clearMemoryForTesting(): void {
    memoryProjects.clear();
    memoryMilestones.clear();
  }
}
