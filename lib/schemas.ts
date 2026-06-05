import { z } from 'zod';

/**
 * Campaign creation schema — validates the POST body for /api/campaigns
 */
export const createCampaignSchema = z.object({
  trackTitle: z.string().min(1, 'Track title is required').max(200).transform(s => s.trim()),
  trackUrl: z.string().url('Track URL must be a valid URL').max(2048),
  cpmRate: z.coerce.number().positive('CPM must be positive').max(100, 'CPM max $100'),
  budget: z.coerce.number().positive('Budget must be positive').max(100000, 'Budget max $100,000'),
  maxPayout: z.coerce.number().optional(),
  requirements: z.string().max(2000).optional().transform(s => s?.trim()),
  driveUrl: z.string().url().optional().or(z.literal('')),
  hashtags: z.string().max(500).optional().transform(s => s?.trim()),
  coverArtUrl: z.string().optional(),
  requiredHashtags: z.string().optional(),
  requireFtc: z.boolean().optional().default(false),
  minVideoLength: z.coerce.number().optional(),
  captionRequirements: z.string().optional(),
  platforms: z.array(z.string()).optional(),
});

export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;

/**
 * Submission creation schema — validates the POST body for /api/submissions
 */
export const createSubmissionSchema = z.object({
  campaignId: z.string().uuid('Invalid campaign ID').optional(),
  trackId: z.string().optional(),
  contentUrl: z.string().url('Must be a valid URL').max(2048),
  platform: z.enum(['tiktok', 'instagram', 'youtube', 'facebook'] as const, {
    message: 'Platform must be tiktok, instagram, youtube, or facebook',
  }),
});

export type CreateSubmissionInput = z.infer<typeof createSubmissionSchema>;

/**
 * Claim schema — validates the POST body for /api/claim
 */
export const claimSchema = z.object({
  claim_code: z.string().min(1, 'Claim code is required'),
  verification_method: z.string().optional().default('manual'),
});

export type ClaimInput = z.infer<typeof claimSchema>;

/**
 * Auth callback schema — validates query params for /auth/callback
 */
export const authCallbackSchema = z.object({
  code: z.string().min(1),
  next: z.string().optional().default('/browse'),
  ref: z.string().optional(),
});
