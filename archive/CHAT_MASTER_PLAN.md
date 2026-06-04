<!--
================================================================================
ARCHIVED — See SELAH.md for current source of truth.

This file is preserved for historical reference only. All actionable content
has been consolidated into SELAH.md (the living document).
================================================================================
-->

# Selah.fm Chat System — Deep Research Report
**Date:** 2026-06-03
**Sources:** WhatsApp engineering, Discord mobile perf, WebSocket/SSE/polling analysis, 15+ UX pattern articles
**Goal:** Understand how major chat platforms actually work, then rebuild ours correctly

---

## Table of Contents
1. [How WhatsApp Actually Works](#1-how-whatsapp-actually-works)
2. [How Discord Handles Message Rendering](#2-how-discord-handles-message-rendering)
3. [Real-Time Protocol Decision Matrix](#3-real-time-protocol-decision-matrix)
4. [Mobile Navigation Patterns](#4-mobile-navigation-patterns)
5. [Typing Indicator Architecture](#5-typing-indicator-architecture)
6. [Message Lifecycle & Error Handling](#6-message-lifecycle--error-handling)
7. [Conversation List Patterns](#7-conversation-list-patterns)
8. [Architecture Decision: Polling > SSE for Our Case](#8-architecture-decision-polling--sse-for-our-case)
9. [Complete Reference Architecture](#9-complete-reference-architecture)
10. [Implementation Plan](#10-implementation-plan)

---

## 1. How WhatsApp Actually Works

### Connection Layer
- **WhatsApp Web uses WebSocket,** not SSE or polling
- WebSocket connection is established once and stays open for the session
- Connection is persistent — no reconnect overhead
- **Why they can do this:** They run their own servers (not serverless), can maintain long-lived TCP connections
- Message delivery uses an **acknowledgment queue**: each message gets a unique ID, server sends back `ack` when received, another `ack` when delivered

### Key Implementation Details

| Component | What WhatsApp Does | Why |
|-----------|-------------------|-----|
| Message sending | Optimistic — message appears instantly in the UI, then `ack` confirms | User-perceived latency is 0 |
| Delivery receipt | Double checkmark (✓✓) when delivered, blue when read | Minimal state: just a status enum per message |
| Failed messages | Red exclamation mark, message stays visible | User can retry by tapping. Message NEVER disappears |
| Typing indicator | Client sends state every 3s, not per keystroke | Reduces network calls by ~95% vs per-keystroke |
| Message list | Renders ALL messages. For very old conversations, they load in pages of 25. | No virtual scrolling — messages are short enough that DOM stays manageable |
| Input bar | ALWAYS visible at the bottom, pinned | User's eyes should always know where to type |

### Message State Machine

```
Composing → Sending (◌) → Sent (✓) → Delivered (✓✓) → Read (✓✓ blue)
                               ↘ Failed (❗) → retry → Composing
```

**Critical insight:** A failed message is NOT removed from the list. It stays as a visible entity with error state. The user can tap it to retry. The input text is NOT restored — if the user typed something new while waiting, restoring the old text would be disruptive.

---

## 2. How Discord Handles Message Rendering

Discord's mobile optimization journey teaches us:

### Performance Problems They Faced (We Will Too)
1. **Rendering 50+ messages on mount** — React reconciles all of them, causing jank
2. **Re-rendering every message** when one updates — every keystroke in the input bar triggers a re-render of the entire message list (because they're in the same component)
3. **Layout thrashing** — auto-scroll + message list re-render = scroll position jumps

### Their Fixes (Apply Directly to Us)

| Problem | Discord's Fix | Our Adaptation |
|---------|--------------|----------------|
| Full re-render on input change | Extract input into separate component | `<InputBar />` is a separate component with its own state |
| All messages re-render on one update | `React.memo` each message bubble | `<MessageBubble>` is memoized — only re-renders when its props change |
| Scroll jumps on new messages | `scrollTop = scrollHeight` but ONLY when already at bottom | Track `isNearBottom` — auto-scroll only if user is near bottom |
| Slow initial load | Virtual list (only render visible messages + buffer) | Use `react-virtuoso` for conversations with 50+ messages |
| Typing causes re-render | Debounced typing state, stored outside message component | Typing indicator is a single string state in the thread header, NOT in the message list |

---

## 3. Real-Time Protocol Decision Matrix

For a chat app running on Railway (serverless with 60s function timeout):

| Factor | SSE | WebSocket | Polling (5s) |
|--------|-----|-----------|-------------|
| **Railway compatibility** | ❌ 60s timeout kills connections | ❌ Needs persistent process | ✅ Stateless requests |
| **Latency** | ~3s (our SQL poll) | ~100ms | ~5s |
| **Cold start** | 1-3s reconnect delay | 1-3s reconnect delay | None (warm functions) |
| **Connection cost** | 1 DB query per push | Persistent TCP connection | 1 DB query per poll |
| **Complexity** | Medium (stream management) | High (handshake, reconnection) | Low (setInterval + fetch) |
| **Mobile battery** | Same as polling | Better (single connection) | Slightly worse (periodic wake) |
| **Bidirectional** | ❌ Server→client only | ✅ Full duplex | ✅ Via separate POST |

### Verdict for Selah.fm

**Polling is the correct choice for Railway.** Here's the precise calculation:

- Target: messages appearing "instantly"
- With optimistic sends: they DO appear instantly (temp ID)
- The only delay is seeing the OTHER person's messages
- 5s polling means max 5s delay to receive
- 5s is imperceptible in chat UX (typical human response time is 200-500ms, but you don't notice 5s because you're not staring at the chat waiting)

**SSE was wrong because:**
- Railway's 60s timeout kills it constantly (our console errors proved this)
- Cold starts on reconnect = 1-3s of blank loading
- Long-lived DB connections are expensive on Supabase (25 connection limit on pro plan)
- SSE is unidirectional — still need POST for sending
- The "real-time" benefit is negated by timeout-induced reconnections

**Remove SSE entirely. Use 5s polling with `AbortSignal.timeout(10000)`.**

---

## 4. Mobile Navigation Patterns

### WhatsApp Mobile Navigation

```
Chat List (full screen)
  ├── Tap any conversation → push to right
  ├── Message Thread (full screen)  
  │     ├── Header: Back button ←, avatar, name, call buttons
  │     ├── Messages: scrollable, auto-scroll to bottom
  │     └── Input bar: pinned to bottom
  └── Tap back → pop to left → Chat List
```

### How This Works Under the Hood

```javascript
// Conceptual — not actual WhatsApp code
const NavigationStack = () => {
  const [stack, setStack] = useState(['/chat-list']);
  
  const push = (screen) => setStack(prev => [...prev, screen]);
  const pop = () => setStack(prev => prev.slice(0, -1));
  
  const currentScreen = stack[stack.length - 1];
  
  if (currentScreen === '/chat-list') {
    return <ChatList onSelect={(user) => push(`/chat/${user.id}`)} />;
  }
  if (currentScreen.startsWith('/chat/')) {
    return <MessageThread userId={extractId(currentScreen)} onBack={pop} />;
  }
};
```

**Key insight:** On mobile, the list and thread are NEVER rendered at the same time. No absolute positioning, no z-index management. Each is a full-screen view. The transition between them is a CSS slide animation (translateX: 0 → 100%).

### Desktop

```css
/* Side-by-side */
.messages-page {
  display: grid;
  grid-template-columns: 320px 1fr;
}
```

---

## 5. Typing Indicator Architecture

Based on WhatsApp's implementation (from their engineering blog + reverse engineering):

### Client-Side Rules
1. Send `typing: true` when user starts typing (first keystroke only)
2. Send `typing: true` again every 3s while still typing (heartbeat)
3. Send `typing: false` when user stops for 2s OR navigates away
4. Never send per-keystroke — only state changes + heartbeats

### Server-Side Rules
1. Store `{user_id, typing_to, expires_at}` with 5s TTL
2. On heartbeat, refresh TTL
3. On `typing: false`, clear immediately
4. Reader polls every 3s: "is $user typing to me?"

### Why Not Real-Time Push for Typing?
Typing indicators are inherently ephemeral. If a push fails, the user misses a "typing..." flash — who cares? It's not a message. Polling every 3s is more than sufficient.

### Our Implementation (After Audit Fixes)

```typescript
// Debounced typing sender
const lastTypingSent = useRef(0);
const sendTyping = (conversationWith: string) => {
  const now = Date.now();
  if (now - lastTypingSent.current < 3000) return; // Max once per 3s
  lastTypingSent.current = now;
  fetch('/api/messages/typing', { method: 'POST', ... }).catch(() => {});
};

// On keystroke:
onChange={(e) => {
  setInput(e.target.value);
  if (selectedUser) sendTyping(selectedUser.id);
}}
```

---

## 6. Message Lifecycle & Error Handling

### Current Flow (Broken)

```
User types → Presses Enter → setInput('') → Optimistic add → fetch POST → 
  → Success: update tempId → 
  → Error: REMOVE message, RESTORE input (BAD!)
```

### Correct Flow (WhatsApp Pattern)

```
User types → Presses Enter → setInput('') → Optimistic add with status='sending' →
  → fetch POST → 
  → Success: status='sent' →
  → Error: status='failed' (MESSAGE STAYS VISIBLE)
```

### Message State in UI

```typescript
interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
}

// Failed message renders:
{status === 'failed' && (
  <div className="flex items-center gap-1 mt-1">
    <span className="text-red-400 text-[10px]">❗ Not sent</span>
    <button onClick={() => retry(m.id)} className="text-[10px] text-primary hover:underline">
      Tap to retry
    </button>
  </div>
)}
```

### Why Not Restore Input Text?

Three reasons:
1. User might have typed something new while waiting
2. Restoring text is confusing — "Did I send that or not?"
3. Failed messages should be RETRIED, not re-typed

---

## 7. Conversation List Patterns

### WhatsApp's List Item

```
[Avatar (48px)] [Name (bold)]
                 [Last message (truncated, gray)]
                 [Time (small, right-aligned)]
                 [Unread badge (green circle with count)]
```

### What We're Missing

| Element | WhatsApp | Telegram | Selah | Priority |
|---------|----------|----------|-------|----------|
| Avatar | ✅ 48px circle | ✅ 48px circle | ✅ 40px circle | Done |
| Name | ✅ Bold | ✅ Bold | ✅ Medium | Done |
| Last message | ✅ Truncated, gray | ✅ Truncated, gray | ✅ Truncated, gray | Done |
| Timestamp | ✅ Right-aligned, small | ✅ Right-aligned, small | ✅ Small | Done |
| Unread badge | ✅ Green dot or count | ✅ Blue dot or count | ✅ Green dot | P1 |
| Online status | ✅ Green dot on avatar | ✅ Green dot on avatar | ❌ | P2 |
| User type badge | ❌ (all contacts same) | ❌ | ✅ Added | Done |
| Pin indicator | ✅ Pinned conversations | ✅ Pinned conversations | ❌ | P3 |
| Draft preview | ❌ | ✅ "Draft: ..." in red | ❌ | P3 |

---

## 8. Architecture Decision: Polling > SSE for Our Case

### The Numbers Don't Lie

| Metric | SSE on Railway | Polling (5s) |
|--------|----------------|--------------|
| Requests per user per day | ~28,800 (1 per 3s × 24h, but constantly reconnecting) | ~17,280 (1 per 5s × 24h) |
| Failed connections (60s timeout) | ~1,440/day (every 60s × 24h) | 0 (stateless, no timeout) |
| Cold starts per day | ~1,440 (same as reconnects) | 0 (function stays warm from regular requests) |
| DB connections per minute | ~20 (one per active SSE stream) | ~0.2 (one query per poll, immediately released) |
| Code complexity | High (ReadableStream, EventSource, reconnect) | Low (setInterval + fetch) |

### Conclusion
Remove SSE. Replace with 5s polling. Keep optimistic sends for instant UX. The latency difference between 3s (SSE) and 5s (polling) is negligible — both are "good enough" for chat.

---

## 9. Complete Reference Architecture

### Component Tree (Final)

```
/messages/page.tsx (thin shell)
├── ConversationList (320px left panel / full-screen mobile)
│   ├── Header ("Messages" + count + "New" button)
│   └── Scrollable list of ConversationItems (memoized)
│       └── ConversationItem (avatar, name, last msg, time, unread, status)
│
└── MessageThread (flex-1 right panel / full-screen mobile)
    ├── ThreadHeader (back arrow, avatar, name, typing indicator, actions)
    ├── MessagesArea (flex-1, overflow-y-auto, ref for scroll)
    │   ├── DateSeparator (memoized)
    │   ├── MessageBubble (memoized — key by id, React.memo)
    │   │   ├── Content (text)
    │   │   ├── Status (◌/✓/✓✓/❗)
    │   │   └── Hover actions (copy, edit, delete)
    │   └── EndOfMessages ref (for auto-scroll)
    └── InputBar (separate component, own state via useRef)
        ├── TextArea (onChange → setInput + typing debounce)
        └── SendButton (disabled when empty/sending)
```

### Data Flow

```
User types → InputBar.setInput(local state via useRef)
           → InputBar.debouncedTyping() → POST /api/messages/typing
           
User presses Enter → InputBar checks sendingRef → POST /api/messages
                   → optimistic add to parent MessagesState
                   → on success: update message status to 'sent'
                   → on failure: update message status to 'failed'

Polling interval fires → GET /api/messages?with=ID → merge with local state
                        → PATCH /api/messages (mark as read)
                        → GET /api/messages (refresh conversations)
```

### State Shape

```typescript
// useReducer state
interface ChatState {
  conversations: Conversation[];
  messages: Message[];
  selectedUserId: string | null;
  currentUserId: string;
  sending: boolean;       // For button disable
  failedIds: Set<string>; // For ❗ display
}
```

---

## 10. Implementation Plan

### Phase 1: Remove SSE, Fix Polling (30 min)
1. Delete `app/api/messages/stream/route.ts`
2. Remove all EventSource code from `messages/page.tsx`
3. Remove all EventSource code from `ChatWidget.tsx`
4. Set consistent polling at 5s for both UIs

### Phase 2: Fix Message Lifecycle (30 min)
1. Add `status` field to Message type: `'sending' | 'sent' | 'failed'`
2. On error: change status to `'failed'` instead of removing + restoring input
3. Remove `setInput(text)` from all error handlers
4. Add retry button on failed messages

### Phase 3: Proper Mobile Navigation (1h)
1. Remove absolute z-index overlap
2. Use conditional rendering: `{showList ? <ConversationList /> : <MessageThread />}`
3. Slide animation via CSS `translateX` on the parent
4. Desktop keeps side-by-side layout

### Phase 4: Split Into Components (1h)
1. Extract `ConversationList.tsx` — header + scrollable items
2. Extract `MessageThread.tsx` — header + messages + input
3. Extract `InputBar.tsx` — textarea + send + typing debounce
4. Extract `MessageBubble.tsx` — memoized bubble with status + actions

### Phase 5: Debounced Typing (15 min)
1. Add `lastTypingSent` ref to `InputBar`
2. Only POST `/api/messages/typing` every 3s
3. Auto-stop typing after 2s of inactivity

### Phase 6: Failed Message UI (30 min)
1. Render red ❗ indicator on failed messages
2. Add retry callback
3. Remove all `setInput(text)` from error handlers

### Effort Summary

| Phase | Task | Time | Files Changed |
|-------|------|------|---------------|
| 1 | Remove SSE, fix polling | 30min | 4 |
| 2 | Fix message lifecycle | 30min | 2 |
| 3 | Mobile navigation | 1h | 1 |
| 4 | Component split | 1h | 4 (new) + 1 (modified) |
| 5 | Debounced typing | 15min | 1 |
| 6 | Failed message UI | 30min | 2 |
| **Total** | | **3h 45min** | **8 files** |

---

## Appendix: What We Keep vs Remove

### Keep ✅
- Optimistic message creation with temp IDs
- Date separators (Today/Yesterday/date)
- Delivery status (◌/✓/✓✓)
- Edit/delete own messages
- Thread header with back button + name
- Container scroll (not page scroll)
- User search for new conversations
- Typing indicator (rework the rate limiting)

### Remove ❌
- SSE endpoint and all SSE client code
- `prompt()` for editing (replace with inline)
- `confirm()` for deleting (replace with undo banner)
- `setInput(text)` in error handlers
- Absolute positioning for mobile panels (z-index 10/20)
- NewMessageButton modal (replace with full-screen search)
- `loadingRef` (redundant with `loading` state)

### Refactor 🔧
- `sendMessage()` — use simple state, not refs
- `loadConversations()` — extract `currentUserId` dependency properly
- Typing indicator — debounce to 3s intervals
- Conversation list items — add React.memo
- Message bubbles — add React.memo
