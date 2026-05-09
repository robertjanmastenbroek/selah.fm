/**
 * Selah.fm — Shared TypeScript Types
 * ===================================
 * Single source of truth for all API request/response shapes.
 * Import in both API routes (server) and page components (client).
 */

// ─── User ─────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  user_type: 'artist' | 'creator';
  display_name: string;
  bio?: string;
  genres?: string;
  preferred_cpm_cents?: number;
  profile_image_url?: string;
  tiktok_handle?: string;
  instagram_handle?: string;
  youtube_handle?: string;
  stripe_connect_id?: string;
  acceptance_rate?: number;
  created_at: string;
}

// ─── Campaign ─────────────────────────────────────────────────────────────────

export interface Campaign {
  id: string;
  artist_id: string;
  track_title: string;
  track_url: string;
  cover_art_url?: string;
  cpm_rate_cents: number;
  total_budget_cents: number;
  max_payout_per_submission_cents: number;
  budget_remaining_cents: number;
  requirements?: string;
  content_assets_url?: string;
  recommended_hashtags?: string;
  platforms: string[];
  status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
  approved_submissions?: string;
  pending_submissions?: string;
  total_verified_views?: string;
  created_at: string;
}

export interface CreateCampaignInput {
  trackTitle: string;
  trackUrl: string;
  cpmRate: number;          // dollars
  budget: number;           // dollars
  maxPayout: number;        // dollars
  requirements?: string;
  driveUrl?: string;
  hashtags?: string;
  coverArtUrl?: string;
}

// ─── Submission ───────────────────────────────────────────────────────────────

export interface Submission {
  id: string;
  campaign_id: string;
  creator_id: string;
  content_url: string;
  platform: 'tiktok' | 'instagram' | 'youtube';
  review_status: 'pending' | 'approved' | 'rejected';
  payout_status: 'pending' | 'processing' | 'paid' | 'failed';
  views_verified: number;
  payout_amount_cents: number;
  submitted_at: string;
  // Joined fields
  track_title?: string;
  creator_name?: string;
  cpm_rate_cents?: number;
  max_payout_per_submission_cents?: number;
}

export interface CreateSubmissionInput {
  campaignId: string;
  contentUrl: string;
  platform: 'tiktok' | 'instagram' | 'youtube';
}

// ─── Notification ─────────────────────────────────────────────────────────────

export interface Notification {
  id: string;
  user_id: string;
  type: 'submission' | 'approval' | 'rejection' | 'earning' | 'payout' | 'system';
  message: string;
  read: boolean;
  link?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

// ─── Earnings ─────────────────────────────────────────────────────────────────

export interface EarningsResponse {
  submissions: Submission[];
  totalPaid: number;
  totalPending: number;
  totalEarned: number;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthResponse {
  ok: boolean;
  type?: 'artist' | 'creator';
  error?: string;
}

export interface SessionUser {
  email: string;
  type: 'artist' | 'creator';
  name: string;
}

// ─── API Response Helpers ────────────────────────────────────────────────────

export interface ApiError {
  error: string;
  status?: number;
}

export interface ApiSuccess<T = any> {
  ok?: boolean;
  data?: T;
}
