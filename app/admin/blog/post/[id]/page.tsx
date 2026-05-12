'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Eye, Save, Send, Calendar, Edit3, Tag } from 'lucide-react';

export default function BlogPostEditor() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;

  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [editingMeta, setEditingMeta] = useState(false);
  const [editingContent, setEditingContent] = useState(false);

  // Editable fields
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [slug, setSlug] = useState('');
  const [publishAt, setPublishAt] = useState('');

  const fetchPost = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/blog/batch?postId=${postId}`);
      const data = await res.json();
      
      if (data && !data.error) {
        setPost(data);
        setTitle(data.title || '');
        setContent(data.content_html || '');
        setExcerpt(data.excerpt || '');
        setMetaDescription(data.meta_description || '');
        setSlug(data.slug || '');
        setPublishAt(data.publish_at ? new Date(data.publish_at).toISOString().slice(0, 16) : '');
      }
    } catch (e: any) {
      setMessage('Failed to load: ' + e.message);
    }
    setLoading(false);
  };

  useEffect(() => { fetchPost(); }, [postId]);

  const save = async (newStatus?: string) => {
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch('/api/admin/blog/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_post',
          postId,
          updates: {
            title, content_html: content, excerpt, meta_description: metaDescription,
            slug, status: newStatus || post.status,
            ...(newStatus === 'scheduled' && publishAt ? { publish_at: new Date(publishAt).toISOString() } : {}),
          },
        }),
      });
      const data = await res.json();
      if (data.error) { setMessage(data.error); }
      else {
        setPost(data.post);
        setMessage(newStatus === 'published' ? 'Published! Live at /blog/' + data.post.slug : newStatus === 'scheduled' ? 'Scheduled!' : 'Saved!');
        if (!newStatus) { setEditingMeta(false); setEditingContent(false); }
      }
    } catch (e: any) { setMessage(e.message); }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground text-sm">Loading post...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="p-8 text-center">
        <p className="text-destructive">Post not found</p>
        <Link href="/admin/blog" className="text-sm text-primary hover:underline mt-2 inline-block">Back to blog</Link>
      </div>
    );
  }

  const wordCount = content.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length;
  const statusBadge = post.status === 'published' ? 'bg-green-600' : post.status === 'scheduled' ? 'bg-amber-600' : post.status === 'draft' ? 'bg-gray-600' : 'bg-blue-600';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/blog" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl font-bold">Blog Post Editor</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-[10px] px-2 py-0.5 rounded-full text-white ${statusBadge}`}>{post.status}</span>
              <span className="text-xs text-muted-foreground">{wordCount} words</span>
              {post.primary_keyword && <span className="text-xs text-muted-foreground">· {post.primary_keyword}</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {post.status !== 'published' && (
            <button
              onClick={() => save('published')}
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-500 disabled:opacity-50 flex items-center gap-2"
            >
              <Send size={14} /> Publish Now
            </button>
          )}
          <button
            onClick={() => save('scheduled')}
            disabled={saving || !publishAt}
            className="px-4 py-2 rounded-xl bg-amber-600 text-white text-sm font-semibold hover:bg-amber-500 disabled:opacity-50 flex items-center gap-2"
          >
            <Calendar size={14} /> Schedule
          </button>
          <button
            onClick={() => save()}
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-500 disabled:opacity-50 flex items-center gap-2"
          >
            <Save size={14} /> {saving ? 'Saving...' : 'Save Draft'}
          </button>
        </div>
      </div>

      {message && (
        <div className={`text-sm px-4 py-3 rounded-xl ${message.includes('error') || message.includes('Error') ? 'bg-destructive/10 text-destructive' : 'bg-emerald-500/10 text-emerald-400'}`}>
          {message}
        </div>
      )}

      {/* SEO Preview */}
      <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold flex items-center gap-2"><Eye size={14} className="text-primary" /> SEO Preview</h2>
          <button onClick={() => setEditingMeta(!editingMeta)} className="text-xs text-primary hover:underline flex items-center gap-1">
            <Edit3 size={12} /> {editingMeta ? 'Done editing' : 'Edit metadata'}
          </button>
        </div>

        {editingContent ? (
          <div className="space-y-3">
            <div>
              <label className="text-[10px] text-muted-foreground">Title</label>
              <input value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-gray-800 rounded-lg p-2 text-sm text-white border border-gray-700" />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground">Slug</label>
              <input value={slug} onChange={e => setSlug(e.target.value)} className="w-full bg-gray-800 rounded-lg p-2 text-sm text-white border border-gray-700 font-mono" />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground">Meta Description ({metaDescription.length}/160)</label>
              <textarea value={metaDescription} onChange={e => setMetaDescription(e.target.value)} rows={2} className="w-full bg-gray-800 rounded-lg p-2 text-sm text-white border border-gray-700" />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground">Excerpt</label>
              <textarea value={excerpt} onChange={e => setExcerpt(e.target.value)} rows={2} className="w-full bg-gray-800 rounded-lg p-2 text-sm text-white border border-gray-700" />
            </div>
          </div>
        ) : (
          <div className="space-y-1 text-sm">
            <p className="text-blue-400 text-lg font-medium">{title || '(no title)'}</p>
            <p className="text-green-400 text-xs">{`selah.fm/blog/${slug || '...'}`}</p>
            <p className="text-gray-400 text-xs leading-relaxed">{metaDescription || '(no meta description)'}</p>
          </div>
        )}
      </div>

      {/* Schedule */}
      <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5">
        <h2 className="text-sm font-semibold mb-3 flex items-center gap-2"><Calendar size={14} className="text-primary" /> Schedule</h2>
        <input
          type="datetime-local"
          value={publishAt}
          onChange={e => setPublishAt(e.target.value)}
          className="bg-gray-800 rounded-lg p-2 text-sm text-white border border-gray-700"
        />
        <p className="text-[10px] text-muted-foreground mt-1">Leave empty to save as draft. Click "Schedule" to set.</p>
      </div>

      {/* Content Editor */}
      <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold flex items-center gap-2"><Edit3 size={14} className="text-primary" /> Content ({wordCount} words)</h2>
          {post.tags && post.tags.length > 0 && (
            <div className="flex items-center gap-1">
              <Tag size={12} className="text-muted-foreground" />
              {post.tags.map((t: string) => (
                <span key={t} className="text-[10px] bg-gray-800 px-2 py-0.5 rounded-full text-gray-400">{t}</span>
              ))}
            </div>
          )}
        </div>

        {/* Content tabs: Edit | Preview */}
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setEditingContent(!editingContent)}
            className={`text-xs px-3 py-1 rounded-lg ${!editingContent ? 'bg-primary text-white' : 'bg-gray-800 text-gray-400'}`}
          >
            Edit
          </button>
          <button
            onClick={() => setEditingContent(false)}
            className={`text-xs px-3 py-1 rounded-lg ${editingContent ? 'bg-gray-800 text-gray-400' : 'bg-primary text-white'}`}
          >
            Preview
          </button>
        </div>

        {editingContent ? (
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            className="w-full bg-gray-800 rounded-lg p-4 text-sm text-white font-mono min-h-[500px] border border-gray-700 focus:border-blue-500 focus:outline-none resize-y"
            placeholder="<h2>Section</h2><p>Your content...</p>"
          />
        ) : (
          <div className="prose prose-invert prose-sm max-w-none bg-gray-800/50 rounded-lg p-6 min-h-[300px]">
            <div dangerouslySetInnerHTML={{ __html: content }} />
          </div>
        )}
      </div>

      {/* FAQ preview */}
      {post.faq_schema && Array.isArray(post.faq_schema) && post.faq_schema.length > 0 && (
        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5">
          <h2 className="text-sm font-semibold mb-3">FAQ Schema ({post.faq_schema.length} questions)</h2>
          <div className="space-y-2">
            {post.faq_schema.map((faq: any, i: number) => (
              <div key={i} className="bg-gray-800/50 rounded-lg p-4">
                <p className="text-sm font-medium text-white">{faq.question}</p>
                <p className="text-xs text-gray-400 mt-1">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
