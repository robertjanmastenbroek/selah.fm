<!--
================================================================================
ARCHIVED — See SELAH.md for current source of truth.

This file is preserved for historical reference only. All actionable content
has been consolidated into SELAH.md (the living document).
================================================================================
-->

# Selah.fm Chat System — Research & Audit

## Reference Platforms

| Platform | Daily Active Users | Key UX Pattern | Why It Works |
|----------|-------------------|----------------|--------------|
| WhatsApp | 2B+ | Sparse list, green/white bubbles, input always visible | Minimal cognitive load, predictable layout |
| Telegram | 800M+ | Feature-rich but clean — edit, delete, reply, emoji, pinned | Power features behind taps, not in your face |
| iMessage | 1B+ | Full-bleed bubbles, no container boxes, tapbacks | Feels native on every Apple device |
| Discord | 200M+ | Sidebar channels, inline replies, message actions on hover | Server-first, but DMs use standard chat pattern |
| Signal | 40M+ | Strong privacy cues, disappearing messages, contact avatars | Trust signals built into every interaction |

## Common Architecture (All Major Chat Apps)

```
┌─────────────────────────────────────────────────────┐
│  Header: Back, Avatar/Name, Typing/Call buttons     │  ← Sticky top
├─────────────────────────────────────────────────────┤
│                                                     │
│  Messages Area (flex-1, overflow-y-auto)            │  ← Scrollable
│  ┌───────────────────────────────────────────────┐  │
│  │  Date separator: Monday                       │  │
│  │  ┌──────────────┐ ┌──────────────────────┐    │  │
│  │  │ Their bubble │ │  My bubble  ✓✓ │    │  │
│  │  └──────────────┘ └──────────────────────┘    │  │
│  │  "is typing..."                               │  │
│  └───────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────┤
│  Input Bar: TextArea + Send (sticky bottom)         │  ← Sticky bottom
│  [type a message...                     ] [➤]       │
└─────────────────────────────────────────────────────┘
```

## Audit: Where We Went Wrong

### 1. Architecture — Wrong Foundation

**Problem:** We built `pages/messages/page.tsx` as a single flat component with TWO layout modes (mobile vs desktop) controlled by a `useState<boolean>`. Every state change triggers a re-render of both panels.

**WhatsApp/Telegram do:** Separate `ConversationList` and `MessageThread` components that mount/unmount independently. No shared state besides the selected conversation ID.

**Our cost:** When the user types a message, the entire page re-renders including:
- The conversation list (unnecessary, it's behind a motion animation)
- The header 
- All previous messages
- The input area

**Fix for v2:** Split into `<ConversationList>` and `<MessageThread>` that communicate via a query parameter or context.

### 2. Layout — Overlapping Panels on Mobile

**Problem:** We use `absolute inset-0 z-10/z-20` to overlap panels on mobile. This requires careful z-index management and creates visual flickering during transitions.

**WhatsApp does:** Each screen is a separate `Route` in the navigation stack. On mobile, list and thread are NEVER visible at the same time. On desktop, they're side-by-side via CSS grid.

**Fix for v2:** Use React Router's stack navigation for mobile (like `react-stack-router`), or simply mount/unmount the two panels. No overlapping absolute positioning.

### 3. SSE — Wrong Approach for Serverless

**Problem:** We use SSE on Railway serverless. Railway functions have a hard 60s max duration and cold-start latency. SSE connections time out constantly.

**Real-time approach:** Polling is the correct approach for serverless. WhatsApp Web uses WebSocket because they have persistent servers. We should optimize polling (3s interval, abort on navigation) and add client-side optimistic updates.

**Why SSE is wrong here:**
- Railway kills functions after 60s
- Cold starts mean 1-3s delay on reconnect
- SSE creates a long-lived DB connection per user (costly)
- SSE is uni-directional (can't push to server)

**Fix:** Remove SSE entirely. Use 5s polling with `AbortSignal.timeout`. The 3s vs 5s latency difference is imperceptible. Add optimistic updates for instant UX.

### 4. State Management — Too Many Moving Parts

**Current state variables (18):**
```
loading, messages, conversations, input, selectedUser, sending, currentUserId,
unreadTotal, preselectLoading, showList, isMobile, otherTyping, sendError,
sseRef.current, pollRef.current, typingTimerRef.current, typingPollRef.current, msgEndRef
```

**WhatsApp internal model:** Each conversation has a `Message[]` array. The UI re-renders individual message bubbles, not the whole page.

**Fix for v2:** Use `useReducer` for message state, separate concerns into custom hooks (`useMessages`, `useConversations`, `useInput`).

### 5. NewMessageButton — Modal Complexity Overload

**Problem:** The "New" button opens a modal with:
- Live search (debounced 200ms, calls API)
- Autocomplete dropdown (z-index clipping issues)
- Selected user preview
- "Message" button that navigates

**WhatsApp does:** A simple push-to-screen with a search bar at the top. No modal, no autocomplete. Just a search input and a filtered contact list.

**Fix:** Remove the modal. Replace with a full-screen search (mobile) or sidebar overlay (desktop). Or keep the modal but make it MUCH simpler — just a search input + contact results.

### 6. Error Handling — Silent Failures

**Problem:** We fixed `.catch(() => {})` with `.catch(e => console.error(...))` but that's still not user-visible. When an API call fails, the message silently disappears and the text comes back.

**WhatsApp does:** Shows a red exclamation mark next to the failed message. User can tap to retry. No input restoration — the failed message stays visible.

**Fix:** Keep failed messages in the list with a red ❗ indicator. Add a retry handler. Remove the `setInput(text)` restore — the user might have typed something new.

### 7. Conversation List — Doesn't Surface Creator Stats

**Problem:** The conversation list only shows `display_name` and last message. No context about who this person is.

**Discord does:** Shows user's role, status (online/offline), and mutual servers.

**Fix for v2:** Add user type badges (🎵Artist, 📹Creator), online status dots, and mutual campaign count to the conversation list.

### 8. Typing Indicator — Extra Network Calls

**Problem:** Every keystroke fires a `POST /api/messages/typing`. On a single message, that's 3-5 network calls.

**WhatsApp does:** Batches typing status locally. Only sends a packet every 3-5 seconds, not on every keystroke.

**Fix:** Debounce the typing POST to 3s intervals. Use a `lastTypingSent` ref to avoid duplicate calls.

### 9. Edit/Delete — Confirmation Overhead

**Problem:** Edit uses `prompt()` (browser dialog). Delete uses `confirm()`.

**Telegram does:** Tap-and-hold → context menu → Edit → inline text field replaces the bubble. No prompt() dialogs.

**Fix:** Replace `prompt()` with an inline text editor that replaces the message bubble. Replace `confirm()` with a subtle undo banner ("Message deleted · Undo").

### 10. No Keyboard Shortcuts

**Problem:** Only Enter to send. Nothing else.

**iMessage/Telegram offer:**
- Shift+Enter = new line (we have this ✅)
- Esc = clear input / close context menu
- Cmd+K = search conversations
- Up arrow = edit last message

---

## Target Architecture for v2

### Component Tree

```
MessagesPage
├── ConversationList (left panel / full-screen on mobile)
│   ├── ConversationListHeader ("Messages" + "New" button)
│   └── ConversationItems (scrollable, each with avatar + name + last msg)
│
└── MessageThread (right panel / full-screen on mobile)
    ├── ThreadHeader (back button, avatar, name, typing)
    ├── MessagesArea (scrollable, virtualized for 100s of messages)
    │   ├── DateSeparator
    │   ├── MessageBubble (left-aligned for theirs, right-aligned for mine)
    │   └── FailedBanner (red retry bar at bottom)
    └── InputBar (textarea + send button)
```

### Mobile Navigation

```
ConversationList (full screen)
  → tap conversation → slide left
  → MessageThread (full screen)
  ← tap back arrow → slide right
  → ConversationList
```

### State as useReducer

```typescript
type MessageState = {
  conversations: Conversation[];
  messages: Message[];
  selectedUserId: string | null;
  currentUserId: string;
  sending: boolean;
  failedMessages: Set<string>;  // message ids that failed
};
```

### Real-time (No SSE)

```typescript
// Simple polling with optimistic updates
useEffect(() => {
  if (!selectedUser) return;
  const interval = setInterval(async () => {
    const res = await fetch(`/api/messages?with=${selectedUser.id}`, { 
      signal: AbortSignal.timeout(5000) 
    });
    // Merge with existing optimistic messages
  }, 5000);
  return () => clearInterval(interval);
}, [selectedUser]);
```

### Error Handling

```typescript
// Keep failed messages visible with retry
interface Message {
  id: string;
  content: string;
  status: 'sending' | 'sent' | 'failed';
}
```

### Files to Create v2

| File | Purpose |
|------|---------|
| `app/messages/ConversationList.tsx` | Left panel component |
| `app/messages/MessageThread.tsx` | Right panel component |
| `app/messages/hooks/useMessages.ts` | Message state reducer + fetch |
| `app/messages/hooks/useInput.ts` | Input state + typing indicator |
| `app/messages/MessageBubble.tsx` | Single bubble (handles send/read/delivery) |
| `app/messages/InputBar.tsx` | Textarea + send + attachments |

### What to Keep

- ✔ Optimistic message creation (temp IDs)
- ✔ Date separators with Today/Yesterday
- ✔ Delivery status (◌/✓/✓✓)
- ✔ Edit/delete own messages
- ✔ Typing indicator
- ✔ User search for new conversations
- ✔ Container scroll (not page scroll)

### What to Remove

- ❌ SSE entirely (replace with 5s polling)
- ❌ NewMessageButton modal (replace with simple full-screen search)
- ❌ `prompt()` and `confirm()` dialogs (replace with inline edit + undo)
- ❌ useRef-based sending guard (use reducer state instead)
- ❌ Motion/AnimatePresence on every message render (expensive on long convos)
- ❌ `catch {}` that silently swallow errors

---

## Summary of Changes Needed

| Area | Current | Target | Effort |
|------|---------|--------|--------|
| Component structure | Single 700-line file | 6 focused files | 2h |
| Real-time | SSE (broken) | 5s polling (stable) | 30min |
| State | 18 useState | 1 useReducer + 3 hooks | 1h |
| Mobile layout | absolute z-index overlap | full-screen stack | 1h |
| New message | Modal with autocomplete | Simple full-screen search | 30min |
| Error handling | `.catch(console.error)` | Red ❗ + retry button | 1h |
| Edit/delete | `prompt()` / `confirm()` | Inline edit + undo | 1h |
| Conversation list | Name only | Name + badges + status | 30min |
| Typing indicator | Every keystroke | 3s debounced batch | 15min |

**Total: ~7.5h for a complete rewrite**

