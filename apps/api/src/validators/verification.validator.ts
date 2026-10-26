import { z } from 'zod';
import { DocumentType, VerificationStatus } from '@buildlink/shared';

export const applyVerificationSchema = z.object({
  registrationBody: z.string().trim().min(1, 'Registration body is required (e.g. IESL, SOE, CIBSE)').max(150),
  registrationNumber: z.string().trim().min(1, 'Registration license number is required').max(100),
  notes: z.string().trim().max(1000).optional(),
  documents: z
    .array(
      z.object({
        documentType: z.nativeEnum(DocumentType),
        fileUrl: z.string().min(1, 'Document file URL is required'),
        originalFilename: z.string().min(1, 'Original file name is required'),
        fileSizeBytes: z.number().optional(),
      })
    )
    .min(1, 'At least one supporting credential document is required (e.g. degree or membership card).'),
});

export const reviewVerificationSchema = z.object({
  status: z.enum([
    VerificationStatus.VERIFIED,
    VerificationStatus.REJECTED,
    VerificationStatus.ADDITIONAL_INFO_REQUIRED,
    VerificationStatus.UNDER_REVIEW,
  ]),
  reviewerNotes: z.string().trim().min(3, 'Reviewer feedback notes must be at least 3 characters long').max(1000),
});
