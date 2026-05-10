# Selah.fm — Image Prompts for Midjourney

## 1. Social Share / OG Image (1200×630px) — Primary
**Purpose:** Appears when anyone shares selah.fm on Twitter, Discord, iMessage, LinkedIn, etc.
```
A sleek dark music promotion marketplace interface, glowing electric blue waveform on deep black background, subtle golden accent lines, minimalist glassmorphism cards floating, professional tech aesthetic, 3D depth, cinematic lighting, 8K --ar 1200:630 --style raw --v 6.1
```

## 2. Hero / Landing Page Background
**Purpose:** Can be used as a subtle background gradient overlay
```
Abstract sound waves in electric blue and deep navy, dark minimal background, soft radial gradient, particles floating like musical notes, ethereal glow, clean and professional, no text, 8K --ar 16:9 --style raw --v 6.1
```

## 3. Artist Hero Image
**Purpose:** Welcome page for artists
```
A musician in a dimly lit studio, headphones on, looking at a laptop showing music waveforms, neon blue and amber lighting, cinematic depth of field, professional atmosphere, modern creative space, 8K --ar 16:9 --style raw --v 6.1
```

## 4. Creator Hero Image
**Purpose:** Welcome page for creators
```
A content creator filming a short video with a ring light, phone on tripod, modern apartment with plants, natural and warm lighting, creative vibe, candid and authentic, golden hour feel, 8K --ar 16:9 --style raw --v 6.1
```

## 5. Empty State — No Campaigns Yet
**Purpose:** Shown when browse/dashboard has no campaigns
```
Minimalist illustration of a blank billboard in a calm dark space, single spotlight illuminating it, subtle sparkles floating, clean vector-art style, deep navy background, elegant and inviting, 8K --ar 1:1 --style raw --v 6.1
```

## 6. Empty State — No Earnings Yet
**Purpose:** Shown on the earnings page
```
Minimalist illustration of an empty glass jar with a single golden coin inside, soft blue glow around it, dark background, hopeful and calm, clean vector style, 8K --ar 1:1 --style raw --v 6.1
```

## 7. Empty State — No Messages
**Purpose:** Empty chat/inbox
```
Minimalist illustration of a paper airplane floating in a dark void, soft blue trail behind it, peaceful and quiet, clean geometric style, deep space background, elegant, 8K --ar 1:1 --style raw --v 6.1
```

## 8. Empty State — No Notifications
**Purpose:** Empty notification bell
```
Minimalist illustration of a calm bell resting on a dark surface, a single soft blue ring emanating from it, peaceful silence, clean geometric style, dark background, 8K --ar 1:1 --style raw --v 6.1
```

## 9. Error State — Something Went Wrong
**Purpose:** Generic error state
```
Minimalist illustration of a gentle abstract shape like a soft cloud with a subtle crack of golden light, dark background, not alarming but reassuring, clean vector style, 8K --ar 1:1 --style raw --v 6.1
```

## 10. Success / Celebration
**Purpose:** Post-onboarding, campaign created, payout received
```
Abstract celebration: floating golden particles and electric blue ribbons against deep black, elegant confetti, sophisticated not childish, minimal and premium, 8K --ar 16:9 --style raw --v 6.1
```

---

## How to use

1. Generate all images in Midjourney with `--style raw --v 6.1` for consistency
2. For social share (OG), use `--ar 1200:630` 
3. For hero/background, use `--ar 16:9`
4. For empty states and icons, use `--ar 1:1`
5. Save PNGs to `public/images/` folder with these names:
   - `og-image.png` — social share
   - `hero-bg.png` — landing background
   - `artist-hero.png` — artist welcome
   - `creator-hero.png` — creator welcome
   - `empty-campaigns.png` — no campaigns
   - `empty-earnings.png` — no earnings
   - `empty-messages.png` — no messages
   - `empty-notifications.png` — no notifications
   - `error-state.png` — error
   - `success.png` — celebration
