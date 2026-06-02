'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Heart, Video, Music, ExternalLink, MessageCircle, Users, DollarSign, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ActivityFeed from '@/components/ActivityFeed';
import PageComments from '@/components/PageComments';
import ArtistEmbed from '@/components/ArtistEmbed';
import SubmissionReactions from '@/components/SubmissionReactions';

interface ArtistProps {
  artist: any;
  tracks: any[];
  stats: any;
  recentSubmissions: any[];
  socialButtons: { label: string; url: string; icon: string }[];
  slug: string;
}

export default function ArtistProfileClient({ artist, tracks, stats, recentSubmissions, socialButtons, slug }: ArtistProps) {
  const name = artist.artist_name || 'Unknown Artist';
  const genres = artist.genres || [];
  const listeners = artist.monthly_listeners || 0;
  const imageUrl = artist.spotify_image_url || '';
  const bio = artist.bio || '';
  const totalDonations = stats.total_donations_cents || 0;
  const supporterCount = stats.supporter_count || 0;

  return (
    <div className="min-h-screen" style={{ background: '#0F0F23' }}>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6">

        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row gap-8 mb-10">
          {/* Photo */}
          <div className="shrink-0">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl overflow-hidden bg-white/[0.03] border border-white/[0.06]">
              {imageUrl ? (
                <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-emerald-500/5">
                  <span className="text-5xl font-bold text-white/10">{name[0]?.toUpperCase()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'Righteous, system-ui, sans-serif' }}>
              {name}
            </h1>

            <div className="flex flex-wrap items-center gap-2 mb-3">
              {(() => {
                const genreColors: Record<string, string> = {
                  electronic: 'from-blue-500/20 to-cyan-500/10 border-blue-500/20 text-blue-300',
                  'hip-hop': 'from-amber-500/20 to-orange-500/10 border-amber-500/20 text-amber-300',
                  pop: 'from-pink-500/20 to-rose-500/10 border-pink-500/20 text-pink-300',
                  rock: 'from-red-500/20 to-orange-500/10 border-red-500/20 text-red-300',
                  indie: 'from-violet-500/20 to-purple-500/10 border-violet-500/20 text-violet-300',
                  'r&b': 'from-emerald-500/20 to-teal-500/10 border-emerald-500/20 text-emerald-300',
                  jazz: 'from-yellow-500/20 to-amber-500/10 border-yellow-500/20 text-yellow-300',
                  metal: 'from-gray-500/20 to-zinc-500/10 border-gray-500/20 text-gray-300',
                  folk: 'from-stone-500/20 to-amber-500/10 border-stone-500/20 text-stone-300',
                  country: 'from-amber-500/20 to-yellow-500/10 border-amber-500/20 text-amber-300',
                  ambient: 'from-sky-500/20 to-indigo-500/10 border-sky-500/20 text-sky-300',
                  punk: 'from-fuchsia-500/20 to-pink-500/10 border-fuchsia-500/20 text-fuchsia-300',
                  alternative: 'from-teal-500/20 to-cyan-500/10 border-teal-500/20 text-teal-300',
                  experimental: 'from-rose-500/20 to-pink-500/10 border-rose-500/20 text-rose-300',
                  latin: 'from-red-500/20 to-yellow-500/10 border-red-500/20 text-red-300',
                };
                const getColor = (g: string) => {
                  const gl = g.toLowerCase();
                  return Object.entries(genreColors).find(([k]) => gl.includes(k))?.[1] || 'from-primary/20 to-primary/5 border-primary/20 text-primary';
                };
                return genres.slice(0, 3).map((g: string) => (
                  <Link key={g} href={`/browse/genre/${g.toLowerCase()}`}
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-medium bg-gradient-to-r ${getColor(g)} border transition-all hover:scale-105`}>
                    {g}
                  </Link>
                ));
              })()}
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-4">
              {listeners > 0 && (
                <span className="flex items-center gap-1">
                  <Users size={12} />
                  {listeners >= 1000 ? `${(listeners / 1000).toFixed(1)}K` : listeners} monthly listeners
                </span>
              )}
              <span>{stats.total_tracks} {stats.total_tracks === 1 ? 'track' : 'tracks'}</span>
              {supporterCount > 0 && (
                <span className="flex items-center gap-1">
                  <Heart size={12} className="text-red-400" />
                  {supporterCount} supporters
                </span>
              )}
            </div>

            {/* Social links */}
            {socialButtons.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {socialButtons.map(s => (
                  <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-[10px] text-muted-foreground hover:text-foreground hover:border-primary/20 transition-all">
                    <span>{s.icon}</span>
                    {s.label}
                    <ExternalLink size={10} />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Primary CTAs ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          {/* Donate CTA — links to artist-level checkout */}
          <Link href={`/checkout?type=donation&artistSlug=${slug}`}
            className="group rounded-2xl bg-gradient-to-br from-red-500/10 to-red-500/5 border border-red-500/15 p-6 hover:border-red-500/30 transition-all text-center">
            <Heart size={28} className="mx-auto mb-3 text-red-400" />
            <p className="text-lg font-bold mb-1">Support {name}</p>
            <p className="text-xs text-muted-foreground mb-4">Donate to help promote their music</p>
            <Button className="bg-red-500 hover:bg-red-600 text-white">Donate ${totalDonations > 0 ? 'again' : 'now'} →</Button>
            {totalDonations > 0 && (
              <p className="text-xs text-muted-foreground/60 mt-2">
                ${(totalDonations / 100).toFixed(0)} raised from {supporterCount} supporters
              </p>
            )}
          </Link>

          {/* Make Video CTA — links to first track or browse */}
          <Link href={tracks[0] ? `/c/${tracks[0].campaign_slug || tracks[0].id}` : '/browse'}
            className="group rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/15 p-6 hover:border-emerald-500/30 transition-all text-center">
            <Video size={28} className="mx-auto mb-3 text-emerald-400" />
            <p className="text-lg font-bold mb-1">Make a Video</p>
            <p className="text-xs text-muted-foreground mb-4">Pick a track, create content, earn per view</p>
            <Button className="bg-emerald-500 hover:bg-emerald-600 text-white">Start Creating →</Button>
          </Link>
        </div>

        {/* ── Two-column layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left column: Activity + Tracks + Submissions */}
          <div className="lg:col-span-2 space-y-10">

            {/* Activity Feed */}
            <ActivityFeed artistSlug={slug} />

            {/* Tracks */}
            <section>
              <h2 className="text-sm font-semibold flex items-center gap-2 mb-4">
                <Music size={14} className="text-muted-foreground" />
                Tracks by {name}
              </h2>
              {tracks.length === 0 ? (
                <p className="text-sm text-muted-foreground/50 py-6 text-center">
                  No tracks listed yet. Check back soon.
                </p>
              ) : (
                <div className="grid gap-3">
                  {tracks.map((track: any, i: number) => {
                    const cpm = track.cpm_rate_cents ? (track.cpm_rate_cents / 100).toFixed(2) : '0.00';
                    return (
                      <div key={track.id}
                        className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.04] transition-colors">
                        {/* Cover */}
                        <div className="w-14 h-14 rounded-xl overflow-hidden bg-white/[0.03] shrink-0">
                          {track.cover_art_url ? (
                            <img src={track.cover_art_url} alt={track.track_title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Music size={18} className="text-white/10" />
                            </div>
                          )}
                        </div>
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{track.track_title}</p>
                          <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                            ${(parseFloat(cpm) * 1000).toFixed(0)}/1M views
                            {track.submissions_count > 0 && ` · ${track.submissions_count} submissions`}
                            {track.total_views > 0 && ` · ${track.total_views >= 1000 ? (track.total_views / 1000).toFixed(1) + 'K' : track.total_views} views`}
                          </p>
                        </div>
                        {/* Action */}
                        <Link href={`/c/${track.campaign_slug || track.id}`}
                          className="px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary/20 transition-all shrink-0">
                          Submit video
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Recent Submissions Gallery */}
            {recentSubmissions.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold flex items-center gap-2 mb-4">
                  <Video size={14} className="text-muted-foreground" />
                  Recent Videos
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {recentSubmissions.map((sub: any) => (
                    <div key={sub.id} className="rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden hover:border-primary/15 transition-all">
                      <a href={sub.content_url} target="_blank" rel="noopener noreferrer"
                        className="block aspect-[9/16] bg-black/40 flex items-center justify-center">
                        <Video size={24} className="text-white/30" />
                      </a>
                      <div className="p-3 space-y-2">
                        <p className="text-[10px] text-muted-foreground/60 truncate">{sub.track_title}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-muted-foreground/40">
                            {(sub.views_verified || 0) >= 1000
                              ? `${(sub.views_verified / 1000).toFixed(1)}K views`
                              : `${sub.views_verified || 0} views`}
                          </span>
                          <SubmissionReactions submissionId={sub.id} initialCounts={sub.reactions_count ? { heart: sub.reactions_count } : {}} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* About section (for SEO) */}
            {bio && (
              <section>
                <h2 className="text-sm font-semibold mb-3">About {name}</h2>
                <p className="text-sm text-muted-foreground/70 leading-relaxed">{bio}</p>
              </section>
            )}

            {/* Comments */}
            <PageComments pageType="artist" pageId={artist.id} />
          </div>

          {/* Right column: Stats + Embed + Claim */}
          <div className="space-y-6">
            {/* Stats cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 text-center">
                <p className="text-xl font-bold">{stats.total_tracks}</p>
                <p className="text-[10px] text-muted-foreground uppercase">Tracks</p>
              </div>
              <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 text-center">
                <p className="text-xl font-bold">{stats.total_submissions}</p>
                <p className="text-[10px] text-muted-foreground uppercase">Videos</p>
              </div>
              <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 text-center">
                <p className="text-xl font-bold">
                  {stats.total_views >= 1000 ? `${(stats.total_views / 1000).toFixed(1)}K` : stats.total_views}
                </p>
                <p className="text-[10px] text-muted-foreground uppercase">Views</p>
              </div>
              <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 text-center">
                <p className="text-xl font-bold">${(totalDonations / 100).toFixed(0)}</p>
                <p className="text-[10px] text-muted-foreground uppercase">Donated</p>
              </div>
            </div>

            {/* Embed widget */}
            <ArtistEmbed artistSlug={slug} artistName={name} />

            {/* Claim page (small, secondary) */}
            <div className="rounded-2xl bg-white/[0.02] border border-white/[0.04] p-4 text-center">
              <p className="text-xs text-muted-foreground/60 mb-2">Is this your artist page?</p>
              <Link href={`/login?redirect=/claim?artist=${slug}`}
                className="text-xs text-primary hover:underline font-medium">
                Claim this page →
              </Link>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
