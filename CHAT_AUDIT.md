# Selah.fm — Chat System Audit
**Date:** 2026-06-03
**Goal:** World-class messaging — match WhatsApp/Telegram quality

---

## Current Architecture

Two separate chat interfaces:

### 1. Messages Page (`/messages`)
- Full-page layout: conversation list (left) + message thread (right)
- Polling every 10s for new messages
- Optimistic sends via `temp-{timestamp}` IDs
- SSE endpoint exists but not wired to this page

### 2. ChatWidget (Floating overlay)
- Float bubble on right side of every page
- SSE connection for real-time delivery
- Polling fallback every 15s
- Optimistic sends via `opt-{timestamp}` IDs

### API Endpoints
- `GET /api/messages` — list conversations
- `GET /api/messages?with=USER_ID` — get messages for a conversation
- `POST /api/messages` — send a message
- `PATCH /api/messages` — mark messages as read
- `GET /api/messages/stream?with=USER_ID` — SSE for real-time

---

## Bugs Found & Fixed Today

| # | Bug | Fix | Status |
|---|-----|-----|--------|
| 1 | **Polling overwrites optimistic messages** — 15s poll fires between optimistic add and POST response, deleting the message from the UI | Both `MessagesPage` and `ChatWidget` now merge optimistic messages (`temp-*`/`opt-*` IDs) when polling/SSE replaces state | ✅ |
| 2 | **scrollIntoView scrolls the page** — Auto-scroll pushed the thread header off-screen on desktop | Changed to `messagesRef.scrollTop = scrollHeight` on the messages container | ✅ |
| 3 | **SSE sends diffs instead of full state** — ChatWidget did `setMessages(diff)` which replaced the entire conversation with just 1 new message | SSE now sends the full message list; ChatWidget merges with optimistic state | ✅ |
| 4 | **No date separators** — No "Today"/"Yesterday" headers between messages | Added WhatsApp-style date separators with horizontal rules | ✅ |
| 5 | **No delivery indicators** — No "sending/sent/delivered" status on messages | Added ◌ (sending) / ✓ (sent) / ✓✓ (read) inline indicators | ✅ |

---

## Gaps vs WhatsApp/Telegram (Remaining)

| Feature | WhatsApp | Telegram | Selah (Current) | Priority |
|---------|----------|----------|-----------------|----------|
| **Real-time delivery** | WebSocket (instant) | WebSocket (instant) | SSE (3s delay) + polling (10s) | P0 |
| **Typing indicators** | ✅ Shows when they're typing | ✅ Shows when they're typing | ❌ Not implemented | P1 |
| **Read receipts** | ✓✓ blue ticks | ✓✓ blue ticks | ✓ (read=true from state, not real-time) | P1 |
| **Message status** | Single ✓ / Double ✓✓ / Blue ✓✓ | Single ✓ / Double ✓✓ / Blue ✓✓ | ◌ / ✓ / ✓✓ (inline, basic) | P2 |
| **Attachment support** | Images, video, voice, docs | Images, video, voice, docs, files | ❌ Text only | P2 |
| **Reply to message** | ✅ Swipe to reply | ✅ Tap to reply | ❌ Not implemented | P3 |
| **Message search** | ✅ Global search | ✅ Global + per-chat | ❌ Not implemented | P3 |
| **Group chats** | ✅ Yes | ✅ Yes | ❌ Not implemented | P3 |
| **Emoji reactions** | ✅ To individual messages | ✅ To individual messages | ❌ Not implemented | P3 |
| **Voice messages** | ✅ Built-in recorder | ✅ Built-in recorder | ❌ Not implemented | P3 |
| **Message editing/deletion** | ✅ Edit within 15m, delete for everyone | ✅ Edit anytime, delete for everyone | ❌ Can't edit or delete | P2 |
| **End-to-end encryption** | ✅ Default | ✅ Optional secret chats | ❌ Not implemented | P4 |
| **Push notifications** | ✅ Native push | ✅ Native push | ❌ Only email digest (daily) | P1 |
| **Online/offline status** | ✅ Shows last seen | ✅ Shows last seen | ❌ Not implemented | P2 |
| **Conversation search** | ✅ Yes | ✅ Yes | ❌ Not implemented | P3 |

---

## Priority Plan

### Phase 1: Core Reliability (Done — Deployed)
- ✅ Fix optimistic message race condition (polling + SSE)
- ✅ Fix scroll behavior (container scroll, not page scroll)
- ✅ Add date separators (Today/Yesterday/Date)
- ✅ Add delivery status (sending/sent/delivered)

### Phase 2: Real-Time Parity (This week)
1. **Wire SSE to Messages Page** — Connect `/messages` page to the SSE stream instead of polling
2. **Typing indicators** — `POST /api/messages/typing` + display "is typing..." in thread header
3. **Real-time read receipts** — Push read status via SSE when messages are marked read
4. **Push notifications** — Register service worker + web push API for message notifications

### Phase 3: UX Polish (Next week)
5. **Message actions** — Long-press/right-click menu: copy, edit, delete
6. **Conversation search** — Search within conversations
7. **Reply threading** — Swipe to reply on mobile, tap on desktop
8. **Emoji picker** — Inline emoji picker for messages

### Phase 4: Feature Parity (Future)
9. **Image/file sharing** — Upload images via existing ImageUpload component
10. **Voice messages** — Record and send audio
11. **Online status** — Show when users were last online
12. **Group conversations** — Multi-user chat rooms

---

## Key Technical Improvements Needed

### Wire SSE to Messages Page
Currently only ChatWidget uses SSE. The Messages page uses 10s polling.
**Add:** Connect to SSE in Messages page when a conversation is active.
**File:** `app/messages/page.tsx` — add EventSource connection similar to ChatWidget.

### Persistent Typing Indicator
**Add:** `POST /api/messages/typing` endpoint that stores typing status in Redis or a DB table with TTL.
**Client:** On keystroke in input field, fire POST every 3s. Display indicator when other user is typing.
**Cleanup:** TTL auto-expires after 5s of no keystrokes.

### Web Push Notifications
**Add:** Service worker registration → push subscription → send notification on message.
**Backend:** Use web push API (`web-push` npm package) or Resend for email fallback.
**Note:** Push notifications require HTTPS and a registered service worker.
