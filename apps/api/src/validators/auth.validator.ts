import { z } from 'zod';
import { UserRole } from '@buildlink/shared';

export const registerSchema = z.object({
  email: z.string().trim().email('Invalid email address format'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .max(128, 'Password cannot exceed 128 characters'),
  role: z.nativeEnum(UserRole).default(UserRole.USER),
  firstName: z.string().trim().min(1, 'First name is required').max(100),
  lastName: z.string().trim().min(1, 'Last name is required').max(100),
  engineerTitle: z.string().trim().max(150).optional(),
  specialization: z.string().trim().max(100).optional(),
  specializations: z.array(z.string()).optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address format'),
  password: z.string().min(1, 'Password is required'),
});

export const updateProfileSchema = z.object({
  firstName: z.string().trim().min(1).max(100).optional(),
  lastName: z.string().trim().min(1).max(100).optional(),
  displayName: z.string().trim().max(200).optional(),
  avatarUrl: z.string().trim().max(500).optional(),
  bio: z.string().trim().max(1000).optional(),
  city: z.string().trim().max(100).optional(),
  district: z.string().trim().max(100).optional(),
  phoneNumber: z.string().trim().max(30).optional(),
});

export const updateEngineerProfileSchema = z.object({
  title: z.string().trim().min(1).max(150).optional(),
  specializations: z.array(z.string()).optional(),
  yearsOfExperience: z.number().int().min(0).max(80).optional(),
  registrationBody: z.string().trim().max(150).optional(),
  registrationNumber: z.string().trim().max(100).optional(),
  consultationFee: z.number().min(0).optional(),
  availableForConsultation: z.boolean().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters long'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Invalid email address format'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters long'),
});
