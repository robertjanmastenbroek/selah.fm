# Selah.fm — Chat Master Plan
**Date:** 2026-06-03
**Target:** WhatsApp/Telegram-quality messaging on a serverless architecture

---

## Architecture Decision: SSE over WebSocket

| Factor | SSE | WebSocket |
|--------|-----|-----------|
| Railway compatibility | ✅ Works with serverless (HTTP-based) | ❌ Needs persistent process |
| Cold start sensitivity | ✅ Low — connects on demand | ❌ High — reconnect latency |
| Browser support | ✅ All modern browsers | ✅ All modern browsers |
| Bidirectional | ❌ Server→client only | ✅ Full duplex |
| Reconnection | ✅ Built-in (EventSource API) | ❌ Manual |
| Complexity | Low | High |

**Decision:** SSE for server→client, HTTP POST for client→server. Our existing SSE endpoint already works — extend it.

---

## Current Architecture

```
┌─────────────┐     POST /api/messages     ┌──────────┐
│  Messages    │ ─────────────────────────→ │   SQL    │
│  Page        │ ←── GET /api/messages ──── │   DB     │
│  (10s poll)  │                            └──────────┘
└─────────────┘

┌─────────────┐     POST /api/messages     ┌──────────┐
│  ChatWidget  │ ─────────────────────────→ │   SQL    │
│  (SSE 3s)   │ ←── SSE /stream?with=X ──── │   DB     │
└─────────────┘
```

## Target Architecture

```
┌─────────────┐     POST /api/messages     ┌──────────┐
│  Messages    │ ─────────────────────────→ │   SQL    │
│  Page (+SSE) │ ←── SSE /stream?with=X ──── │   DB     │
│              │                            └──────────┘
└─────────────┘        POST /typing       ┌──────────┐
     │                 ─────────────────→ │  Typing  │
     │                 ←── SSE typing ──── │  Cache   │
     │                                     └──────────┘
┌─────────────┐
│  Web Push   │ ←── POST /api/messages ─── triggers push
│  (SW)       │      to offline users
└─────────────┘
```

---

## Features — Priority Ordered

### P0: Core (Done ✅)
| Feature | Status | Files |
|---------|--------|-------|
| Optimistic send with merge | ✅ | `messages/page.tsx`, `ChatWidget.tsx` |
| Date separators | ✅ | `messages/page.tsx` |
| Delivery status (◌/✓/✓✓) | ✅ | `messages/page.tsx` |
| Container scroll (not page) | ✅ | `messages/page.tsx` |
| SSE merge (no overwrite) | ✅ | `ChatWidget.tsx`, `stream/route.ts` |

### P1: Implement Now

#### 1. Wire SSE to Messages Page
**Why:** Messages page uses 10s polling. SSE gives ~3s delivery.
**How:** Add `EventSource` connection in Messages page when conversation active.
**File:** `app/messages/page.tsx`

```typescript
// Add alongside polling effect
useEffect(() => {
  if (!selectedUser) return;
  const es = new EventSource(`/api/messages/stream?with=${selectedUser.id}`, { withCredentials: true });
  es.addEventListener('messages', (e) => {
    const data = JSON.parse(e.data);
    if (data.messages) {
      const serverIds = new Set(data.messages.map((m: any) => m.id));
      setMessages(prev => {
        const localOnly = prev.filter(m => m.id.startsWith('temp-') && !serverIds.has(m.id));
        return localOnly.length > 0 ? [...data.messages, ...localOnly] : data.messages;
      });
    }
  });
  es.onerror = () => { /* fallback to polling */ };
  return () => es.close();
}, [selectedUser]);
```

#### 2. Typing Indicator
**Why:** WhatsApp/Telegram's most basic real-time feature.
**How:** 
- `POST /api/messages/typing` — stores `{ user_id, conversation_with, typing: true, expires_at }`
- `GET /api/messages/typing?with=X` — returns `{ typing: bool }`
- Thread header shows `"{name} is typing..."` with animated dots

**Files:**
- New: `app/api/messages/typing/route.ts`
- Modify: `app/messages/page.tsx` (input onChange fires POST, thread header polls/SSE)

```typescript
// Typing indicator table (new migration)
CREATE TABLE IF NOT EXISTS typing_indicators (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  conversation_with UUID NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expired_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '5 seconds'
);
```

#### 3. Message Actions (Copy)
**Why:** Can't copy message text — basic UX missing.
**How:** 
- Right-click or long-press on message bubble → dropdown
- Options: Copy, Edit (own messages), Delete (own messages)

**File:** `app/messages/page.tsx`

```tsx
{/* Replace bubble with interactive one */}
<div className="group relative">
  <div className="...bubble classes...">
    {m.content}
  </div>
  {/* Context menu on hover/click */}
  <div className="absolute right-0 top-0 hidden group-hover:flex gap-1">
    <button onClick={() => navigator.clipboard.writeText(m.content)}>📋</button>
    {isMe && <button onClick={() => handleEdit(m)}>✏️</button>}
    {isMe && <button onClick={() => handleDelete(m)}>🗑️</button>}
  </div>
</div>
```

#### 4. Web Push Notifications
**Why:** Users don't get notified of new messages unless they're on the site.
**How:**
- Register service worker in `public/sw.js`
- Request push permission on login
- Store subscription in `push_subscriptions` table
- On message POST, send push notification to recipient

**Files:**
- New: `public/sw.js`
- New: `app/api/push/subscribe/route.ts`
- New migration: `push_subscriptions` table
- Modify: `app/api/messages/route.ts` (POST → trigger push)

### P2: Polish

#### 5. Keyboard Shortcuts
- `Enter` to send (already works)
- `Shift+Enter` for new line (already works)
- `Escape` to clear input / close context menu
- `Ctrl+K` or `Cmd+K` to search conversations

#### 6. Message Search
- Search bar at top of conversation list
- Filters messages by content within selected conversation
- `GET /api/messages/search?q=text&with=USER_ID`

#### 7. Emoji Picker
- Button in input bar → opens emoji grid
- Click emoji → inserts at cursor position
- Use `emoji-mart` or custom lightweight grid

#### 8. Read Receipts via SSE
- When user opens a conversation, PATCH marks messages as read
- SSE pushes read status to the other user
- Other user sees ✓✓ update in real-time

### P3: Future

- **Image sharing**: Use existing ImageUpload component
- **Voice messages**: MediaRecorder API → upload → attach to message
- **Reply threading**: `reply_to_message_id` column in messages table
- **Edit/delete with history**: `edited_at` + `deleted_at` columns
- **Online status**: `last_seen_at` on users table, show in conversation list

---

## Implementation Order

```
Today (this session):
1. Wire SSE to Messages page (~30 min)
2. Add typing indicator (~30 min)
3. Add message copy action (~15 min)

Next session:
4. Web push notifications (~1 hour)
5. Emoji picker (~30 min)
6. Message search (~30 min)

Later:
7. Image sharing
8. Reply threading
9. Voice messages
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `public/sw.js` | Service worker for push notifications |
| `app/api/messages/typing/route.ts` | Typing indicator POST + GET |
| `supabase/migrations/20260603230000_typing_indicators.sql` | Typing indicator table |
| `supabase/migrations/20260603230001_push_subscriptions.sql` | Push subscription table |

## Files to Modify

| File | Change |
|------|--------|
| `app/messages/page.tsx` | Add SSE connection, typing indicator, message actions |
| `app/api/messages/route.ts` | Trigger push on message POST |
| `app/api/messages/stream/route.ts` | Include typing status in SSE events |
