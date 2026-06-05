import { z } from 'zod/v4';

// ── Campaign schemas ────────────────────────────────────────

export const createCampaignSchema = z.object({
  trackTitle: z.string().min(1).max(200).describe('Track title'),
  trackUrl: z.string().url().max(500).describe('Streaming URL'),
  cpmRate: z.coerce.number().positive().max(100).describe('CPM rate in dollars'),
  budget: z.coerce.number().positive().max(100000).describe('Budget in dollars'),
  maxPayout: z.coerce.number().positive().max(100000).optional().describe('Max payout per submission'),
  requirements: z.string().max(2000).optional().describe('Creator requirements'),
  driveUrl: z.string().max(500).optional().describe('Asset drive URL'),
  hashtags: z.string().max(500).optional().describe('Recommended hashtags'),
  coverArtUrl: z.string().max(50000).optional().describe('Base64 cover art'),
  requiredHashtags: z.string().max(500).optional().describe('Required hashtags'),
  requireFtc: z.boolean().optional().describe('Require FTC disclosure'),
  minVideoLength: z.coerce.number().min(5).max(60).optional().describe('Min video length in seconds'),
  captionRequirements: z.string().max(1000).optional().describe('Caption requirements'),
  title: z.string().max(200).optional().describe('Display title'),
});

export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;

// ── Submission schemas ─────────────────────────────────────

export const ACCEPTED_PLATFORMS = ['tiktok', 'instagram', 'youtube', 'facebook'] as const;

export const createSubmissionSchema = z.object({
  campaignId: z.string().uuid().optional().describe('Campaign UUID'),
  trackId: z.string().uuid().optional().describe('Track UUID (alternative to campaignId)'),
  contentUrl: z.string().url().min(10).max(500).describe('Video URL'),
  platform: z.enum(ACCEPTED_PLATFORMS).describe('Platform'),
});

export type CreateSubmissionInput = z.infer<typeof createSubmissionSchema>;

// ── Profile update schema ──────────────────────────────────

export const updateProfileSchema = z.object({
  display_name: z.string().min(1).max(100).optional().describe('Display name'),
  user_type: z.enum(['artist', 'creator', 'both']).optional().describe('User type'),
  bio: z.string().max(500).optional().describe('Short bio'),
  genres: z.array(z.string().max(50)).max(10).optional().describe('Music genres'),
  tiktok_handle: z.string().max(100).optional().describe('TikTok handle'),
  instagram_handle: z.string().max(100).optional().describe('Instagram handle'),
  youtube_handle: z.string().max(100).optional().describe('YouTube handle'),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

// ── Support request schema ─────────────────────────────────

export const supportMessageSchema = z.object({
  message: z.string().min(1).max(5000).describe('Support message'),
  email: z.string().email().optional().describe('Reply email'),
  category: z.enum(['general', 'bug', 'feature', 'payment', 'account']).optional().describe('Category'),
});

export type SupportMessageInput = z.infer<typeof supportMessageSchema>;
