import { randomUUID } from 'crypto';
import { AppDataSource } from '../database/data-source';
import { User, UserProfile, EngineerProfile } from '../database/entities';
import { hashPassword, comparePassword } from '../common/password';
import {
  UserRole,
  UserStatus,
  VerificationStatus,
  UserDto,
  UserProfileDto,
  EngineerProfileDto,
  RegisterRequestDto,
  UpdateProfileRequestDto,
  UpdateEngineerProfileRequestDto,
} from '@buildlink/shared';

// In-memory resilient store for offline / test environments
interface InMemoryUserStore {
  user: User;
  profile?: UserProfile;
  engineerProfile?: EngineerProfile;
}

const memoryStore = new Map<string, InMemoryUserStore>();

export class UserService {
  private static parseSpecializations(val: string | unknown): string[] {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    try {
      const parsed = JSON.parse(val as string);
      return Array.isArray(parsed) ? parsed : [String(parsed)];
    } catch {
      return [String(val)];
    }
  }

  public static toUserDto(user: User, profile?: UserProfile, engineerProfile?: EngineerProfile): UserDto {
    const prof = profile || user.profile;
    const eng = engineerProfile || user.engineerProfile;

    const userProfileDto: UserProfileDto | undefined = prof
      ? {
          id: prof.id,
          userId: prof.userId,
          firstName: prof.firstName,
          lastName: prof.lastName,
          displayName: prof.displayName || `${prof.firstName} ${prof.lastName}`,
          avatarUrl: prof.avatarUrl,
          bio: prof.bio,
          city: prof.city,
          district: prof.district,
          phoneNumber: prof.phoneNumber,
          createdAt: prof.createdAt?.toISOString?.() || new Date().toISOString(),
          updatedAt: prof.updatedAt?.toISOString?.() || new Date().toISOString(),
        }
      : undefined;

    const engineerProfileDto: EngineerProfileDto | undefined = eng
      ? {
          id: eng.id,
          userId: eng.userId,
          title: eng.title,
          specializations: UserService.parseSpecializations(eng.specializations),
          yearsOfExperience: eng.yearsOfExperience || 0,
          registrationBody: eng.registrationBody,
          registrationNumber: eng.registrationNumber,
          verificationStatus: eng.verificationStatus || VerificationStatus.NOT_SUBMITTED,
          consultationFee: Number(eng.consultationFee || 0),
          availableForConsultation: Boolean(eng.availableForConsultation),
          ratingAverage: Number(eng.ratingAverage || 0),
          ratingCount: Number(eng.ratingCount || 0),
          createdAt: eng.createdAt?.toISOString?.() || new Date().toISOString(),
          updatedAt: eng.updatedAt?.toISOString?.() || new Date().toISOString(),
        }
      : undefined;

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      emailVerified: Boolean(user.emailVerified),
      createdAt: user.createdAt?.toISOString?.() || new Date().toISOString(),
      updatedAt: user.updatedAt?.toISOString?.() || new Date().toISOString(),
      profile: userProfileDto,
      engineerProfile: engineerProfileDto,
    };
  }

  public static async findByEmail(email: string): Promise<User | null> {
    const normalizedEmail = email.trim().toLowerCase();

    if (AppDataSource.isInitialized) {
      const userRepo = AppDataSource.getRepository(User);
      return userRepo.findOne({
        where: { email: normalizedEmail },
        relations: ['profile', 'engineerProfile'],
      });
    }

    for (const record of memoryStore.values()) {
      if (record.user.email.toLowerCase() === normalizedEmail) {
        const u = { ...record.user };
        u.profile = record.profile;
        u.engineerProfile = record.engineerProfile;
        return u;
      }
    }

    return null;
  }

  public static async findById(id: string): Promise<User | null> {
    if (AppDataSource.isInitialized) {
      const userRepo = AppDataSource.getRepository(User);
      return userRepo.findOne({
        where: { id },
        relations: ['profile', 'engineerProfile'],
      });
    }

    const record = memoryStore.get(id);
    if (!record) return null;

    const u = { ...record.user };
    u.profile = record.profile;
    u.engineerProfile = record.engineerProfile;
    return u;
  }

  public static async createUser(dto: RegisterRequestDto): Promise<User> {
    const normalizedEmail = dto.email.trim().toLowerCase();
    const existing = await UserService.findByEmail(normalizedEmail);
    if (existing) {
      throw new Error('EMAIL_EXISTS');
    }

    const passwordHash = await hashPassword(dto.password);
    const userId = randomUUID();
    const now = new Date();

    if (AppDataSource.isInitialized) {
      const queryRunner = AppDataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        const userRepo = queryRunner.manager.getRepository(User);
        const profileRepo = queryRunner.manager.getRepository(UserProfile);
        const engineerRepo = queryRunner.manager.getRepository(EngineerProfile);

        const newUser = userRepo.create({
          id: userId,
          email: normalizedEmail,
          passwordHash,
          role: dto.role || UserRole.USER,
          status: UserStatus.ACTIVE,
          emailVerified: false,
        });
        const savedUser = await userRepo.save(newUser);

        const newProfile = profileRepo.create({
          id: randomUUID(),
          userId: savedUser.id,
          firstName: dto.firstName.trim(),
          lastName: dto.lastName.trim(),
          displayName: `${dto.firstName.trim()} ${dto.lastName.trim()}`,
        });
        const savedProfile = await profileRepo.save(newProfile);
        savedUser.profile = savedProfile;

        if (dto.role === UserRole.ENGINEER) {
          const specs = dto.specialization ? [dto.specialization] : ['Civil Engineering'];
          const newEngineer = engineerRepo.create({
            id: randomUUID(),
            userId: savedUser.id,
            title: dto.engineerTitle || 'Professional Engineer',
            specializations: JSON.stringify(specs),
            yearsOfExperience: 0,
            verificationStatus: VerificationStatus.NOT_SUBMITTED,
            consultationFee: 0,
            availableForConsultation: true,
            ratingAverage: 0,
            ratingCount: 0,
          });
          const savedEngineer = await engineerRepo.save(newEngineer);
          savedUser.engineerProfile = savedEngineer;
        }

        await queryRunner.commitTransaction();
        return savedUser;
      } catch (err) {
        await queryRunner.rollbackTransaction();
        throw err;
      } finally {
        await queryRunner.release();
      }
    }

    // In-memory fallback
    const user: User = {
      id: userId,
      email: normalizedEmail,
      passwordHash,
      role: dto.role || UserRole.USER,
      status: UserStatus.ACTIVE,
      emailVerified: false,
      createdAt: now,
      updatedAt: now,
    } as User;

    const profile: UserProfile = {
      id: randomUUID(),
      userId: user.id,
      user,
      firstName: dto.firstName.trim(),
      lastName: dto.lastName.trim(),
      displayName: `${dto.firstName.trim()} ${dto.lastName.trim()}`,
      createdAt: now,
      updatedAt: now,
    } as UserProfile;

    let engineerProfile: EngineerProfile | undefined = undefined;

    if (dto.role === UserRole.ENGINEER) {
      const specs = dto.specialization ? [dto.specialization] : ['Civil Engineering'];
      engineerProfile = {
        id: randomUUID(),
        userId: user.id,
        user,
        title: dto.engineerTitle || 'Professional Engineer',
        specializations: JSON.stringify(specs),
        yearsOfExperience: 0,
        verificationStatus: VerificationStatus.NOT_SUBMITTED,
        consultationFee: 0,
        availableForConsultation: true,
        ratingAverage: 0,
        ratingCount: 0,
        createdAt: now,
        updatedAt: now,
      } as EngineerProfile;
    }

    user.profile = profile;
    user.engineerProfile = engineerProfile;

    memoryStore.set(userId, { user, profile, engineerProfile });
    return user;
  }

  public static async updateProfile(userId: string, dto: UpdateProfileRequestDto): Promise<UserProfile> {
    const user = await UserService.findById(userId);
    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    if (AppDataSource.isInitialized) {
      const profileRepo = AppDataSource.getRepository(UserProfile);
      let profile = await profileRepo.findOne({ where: { userId } });

      if (!profile) {
        profile = profileRepo.create({
          id: randomUUID(),
          userId,
          firstName: dto.firstName || 'User',
          lastName: dto.lastName || '',
        });
      }

      if (dto.firstName !== undefined) profile.firstName = dto.firstName;
      if (dto.lastName !== undefined) profile.lastName = dto.lastName;
      if (dto.displayName !== undefined) profile.displayName = dto.displayName;
      if (dto.avatarUrl !== undefined) profile.avatarUrl = dto.avatarUrl;
      if (dto.bio !== undefined) profile.bio = dto.bio;
      if (dto.city !== undefined) profile.city = dto.city;
      if (dto.district !== undefined) profile.district = dto.district;
      if (dto.phoneNumber !== undefined) profile.phoneNumber = dto.phoneNumber;

      return profileRepo.save(profile);
    }

    const record = memoryStore.get(userId);
    if (!record) throw new Error('USER_NOT_FOUND');

    if (!record.profile) {
      record.profile = {
        id: randomUUID(),
        userId,
        user: record.user,
        firstName: dto.firstName || 'User',
        lastName: dto.lastName || '',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as UserProfile;
    }

    if (dto.firstName !== undefined) record.profile.firstName = dto.firstName;
    if (dto.lastName !== undefined) record.profile.lastName = dto.lastName;
    if (dto.displayName !== undefined) record.profile.displayName = dto.displayName;
    if (dto.avatarUrl !== undefined) record.profile.avatarUrl = dto.avatarUrl;
    if (dto.bio !== undefined) record.profile.bio = dto.bio;
    if (dto.city !== undefined) record.profile.city = dto.city;
    if (dto.district !== undefined) record.profile.district = dto.district;
    if (dto.phoneNumber !== undefined) record.profile.phoneNumber = dto.phoneNumber;
    record.profile.updatedAt = new Date();

    return record.profile;
  }

  public static async updateEngineerProfile(
    userId: string,
    dto: UpdateEngineerProfileRequestDto
  ): Promise<EngineerProfile> {
    const user = await UserService.findById(userId);
    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }
    if (user.role !== UserRole.ENGINEER) {
      throw new Error('NOT_AN_ENGINEER');
    }

    if (AppDataSource.isInitialized) {
      const engineerRepo = AppDataSource.getRepository(EngineerProfile);
      let eng = await engineerRepo.findOne({ where: { userId } });

      if (!eng) {
        eng = engineerRepo.create({
          id: randomUUID(),
          userId,
          title: dto.title || 'Professional Engineer',
          specializations: JSON.stringify(dto.specializations || ['Civil Engineering']),
        });
      }

      if (dto.title !== undefined) eng.title = dto.title;
      if (dto.specializations !== undefined) eng.specializations = JSON.stringify(dto.specializations);
      if (dto.yearsOfExperience !== undefined) eng.yearsOfExperience = dto.yearsOfExperience;
      if (dto.registrationBody !== undefined) eng.registrationBody = dto.registrationBody;
      if (dto.registrationNumber !== undefined) eng.registrationNumber = dto.registrationNumber;
      if (dto.consultationFee !== undefined) eng.consultationFee = dto.consultationFee;
      if (dto.availableForConsultation !== undefined) eng.availableForConsultation = dto.availableForConsultation;

      return engineerRepo.save(eng);
    }

    const record = memoryStore.get(userId);
    if (!record) throw new Error('USER_NOT_FOUND');

    if (!record.engineerProfile) {
      record.engineerProfile = {
        id: randomUUID(),
        userId,
        user: record.user,
        title: dto.title || 'Professional Engineer',
        specializations: JSON.stringify(dto.specializations || ['Civil Engineering']),
        yearsOfExperience: 0,
        verificationStatus: VerificationStatus.NOT_SUBMITTED,
        consultationFee: 0,
        availableForConsultation: true,
        ratingAverage: 0,
        ratingCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as EngineerProfile;
    }

    if (dto.title !== undefined) record.engineerProfile.title = dto.title;
    if (dto.specializations !== undefined) {
      record.engineerProfile.specializations = JSON.stringify(dto.specializations);
    }
    if (dto.yearsOfExperience !== undefined) {
      record.engineerProfile.yearsOfExperience = dto.yearsOfExperience;
    }
    if (dto.registrationBody !== undefined) {
      record.engineerProfile.registrationBody = dto.registrationBody;
    }
    if (dto.registrationNumber !== undefined) {
      record.engineerProfile.registrationNumber = dto.registrationNumber;
    }
    if (dto.consultationFee !== undefined) {
      record.engineerProfile.consultationFee = dto.consultationFee;
    }
    if (dto.availableForConsultation !== undefined) {
      record.engineerProfile.availableForConsultation = dto.availableForConsultation;
    }
    record.engineerProfile.updatedAt = new Date();

    return record.engineerProfile;
  }

  public static async changePassword(userId: string, currentPlain: string, newPlain: string): Promise<void> {
    const user = await UserService.findById(userId);
    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    const isMatch = await comparePassword(currentPlain, user.passwordHash);
    if (!isMatch) {
      throw new Error('INVALID_CURRENT_PASSWORD');
    }

    const newHash = await hashPassword(newPlain);

    if (AppDataSource.isInitialized) {
      const userRepo = AppDataSource.getRepository(User);
      await userRepo.update(userId, { passwordHash: newHash });
      return;
    }

    const record = memoryStore.get(userId);
    if (record) {
      record.user.passwordHash = newHash;
      record.user.updatedAt = new Date();
    }
  }

  public static clearMemoryStoreForTesting(): void {
    memoryStore.clear();
  }
}
