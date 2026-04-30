# StreamTube — Inclusive Video Streaming Platform

A full-featured, region-aware video streaming web application built with **React 19**, **TanStack Start**, **Supabase**, and **Tailwind CSS v4**.

---

## Features

### 1. Comment Section
- Post comments in any language
- **Translate** comments to 10 languages (English, Hindi, Tamil, Telugu, Kannada, Malayalam, Spanish, French, German, Japanese) via AI
- **Like / Dislike** voting — comments with 2+ dislikes are auto-removed by a database trigger
- Each comment displays the poster's **city name** for context
- **Special character blocking** — `< > { } [ ] \ \` $ ^ ~ | * # @ %` are rejected

### 2. Video Download
- Download any video directly from the watch page
- **Free plan**: 1 download per day
- **Premium plans**: Unlimited downloads
- Downloaded videos appear in the **Downloads** section of your profile
- Upgrade prompt shown when daily limit is reached

### 3. Plan Upgrade (Razorpay)
| Plan   | Price | Watch Time/Day | Downloads/Day |
|--------|-------|----------------|---------------|
| Free   | ₹0    | 5 minutes      | 1             |
| Bronze | ₹10   | 7 minutes      | Unlimited     |
| Silver | ₹50   | 10 minutes     | Unlimited     |
| Gold   | ₹100  | Unlimited      | Unlimited     |

- Payments via **Razorpay** (test mode supported — simulated upgrade when keys not configured)
- Plan upgrade reflected immediately after successful payment

### 4. Dynamic Theme
- **Auto theme**: Light mode if accessing between **10:00 AM – 12:00 PM IST** from **South India** (Tamil Nadu, Kerala, Karnataka, Andhra Pradesh, Telangana); Dark mode otherwise
- **Manual toggle**: Sun/Moon button in the navbar — preference saved to `localStorage`
- Theme re-evaluates every 60 seconds

### 5. Region-Based OTP Authentication
- **South India users** → OTP sent via **Email**
- **Other regions** → OTP sent via **SMS** (Twilio)
- Dev mode: OTP code shown in the UI when Twilio/email not configured
- Standard email/password sign-up and sign-in also available

### 6. Gesture Video Player
Custom HTML5 video player with gesture controls:
- **Single tap center** → Play / Pause
- **Double tap right** → +10 seconds
- **Double tap left** → −10 seconds
- **Triple tap center** → Next video
- **Triple tap right** → Close site
- **Triple tap left** → Open comments
- Progress bar, volume slider, mute, fullscreen, auto-hide controls

### 7. VoIP Video Calls
- Start a call → get a **room code** to share
- Peer-to-peer video via **WebRTC**
- **Screen sharing** (share any tab/window including YouTube)
- **Call recording** — saved as `.webm` to your device via MediaRecorder API
- Mic and camera toggle controls

### 8. Category Menus
All sidebar menus are fully functional with categorised videos:
- **Shorts** — videos ≤60 seconds
- **Music** — guitar, piano, drums, violin, DJ mixing
- **Gaming** — Minecraft, chess, mobile gaming, game dev
- **News** — tech news, climate, world headlines
- **Sports** — football, swimming, cricket, marathon
- **Learning** — Python, public speaking, history, math
- **Fashion** — outfits, sustainable fashion, skincare, men's style

---

## Tech Stack

| Layer       | Technology                                      |
|-------------|------------------------------------------------|
| Framework   | React 19 + TanStack Start (TanStack Router)    |
| Backend     | Supabase (PostgreSQL + Auth + Realtime)        |
| Styling     | Tailwind CSS v4 + shadcn/ui                    |
| Payments    | Razorpay                                       |
| OTP/SMS     | Twilio (optional)                              |
| Translation | Lovable AI Gateway / Gemini 2.5 Flash          |
| VoIP        | WebRTC + Supabase Realtime (signaling)         |
| Build       | Vite 7 + Cloudflare Workers (wrangler)         |
| Language    | TypeScript 5                                   |

---

## Getting Started

### Prerequisites
- **Node.js v22+** (required by Vite 7)
- A [Supabase](https://supabase.com) project

### Installation

```bash
git clone https://github.com/your-username/streamtube.git
cd streamtube/connect-share-hub
npm install
```

### Environment Setup

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

Required variables:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

Optional (features degrade gracefully without these):
```
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_FROM_NUMBER=...
LOVABLE_API_KEY=...
```

### Database Setup

Run the Supabase migrations to create all tables and seed videos:

```bash
npx supabase db push
```

Or apply migrations manually via the Supabase SQL editor in order:
1. `20260427172201_*.sql` — Core schema (profiles, videos, comments, payments, OTP, VoIP)
2. `20260427172236_*.sql` — Security fixes
3. `20260428000000_*.sql` — Thumbnail URL fixes
4. `20260429000000_*.sql` — Thumbnail updates
5. `20260429120000_*.sql` — Final thumbnail fix
6. `20260429130000_*.sql` — Video URL fixes
7. `20260429140000_*.sql` — Additional videos
8. `20260429150000_*.sql` — Category column + categorised videos

### Development

```bash
npm run dev
```

Open [http://localhost:8080](http://localhost:8080)

### Build

```bash
npm run build
```

---

## Project Structure

```
connect-share-hub/
├── src/
│   ├── components/
│   │   ├── CommentSection.tsx     # Comments with translate, vote, city
│   │   ├── GestureVideoPlayer.tsx # Custom video player with gestures
│   │   ├── NavBar.tsx             # Top navigation with theme toggle
│   │   ├── VideoCard.tsx          # Video thumbnail card
│   │   └── YTLayout.tsx           # YouTube-style layout with sidebar
│   ├── routes/
│   │   ├── index.tsx              # Home page
│   │   ├── watch.$id.tsx          # Video watch page
│   │   ├── category.$slug.tsx     # Category pages (music, gaming, etc.)
│   │   ├── profile.tsx            # User profile + downloads
│   │   ├── premium.tsx            # Plan upgrade with Razorpay
│   │   ├── auth.tsx               # Sign in / Sign up / OTP
│   │   ├── call.tsx               # VoIP video calls
│   │   └── exit.tsx               # Exit page
│   ├── providers/
│   │   └── AppProvider.tsx        # Auth, theme, geo context
│   ├── server/
│   │   ├── otp.functions.ts       # OTP request/verify (Twilio/email)
│   │   ├── payments.functions.ts  # Razorpay order/verify
│   │   └── translate.functions.ts # AI translation
│   └── lib/
│       ├── plans.ts               # Plan definitions and limits
│       ├── regions.ts             # Geo detection, IST time, theme logic
│       ├── specialChars.ts        # Comment validation
│       ├── razorpay.ts            # Razorpay JS loader
│       └── format.ts              # Duration, views, time formatting
├── supabase/
│   └── migrations/                # All database migrations
├── .env.example                   # Environment variable template
└── README.md
```

---

## Database Schema

Key tables:
- `profiles` — User profiles with plan, watch time, download count
- `videos` — Video metadata with category, URL, thumbnail
- `comments` — Comments with city snapshot, like/dislike counts
- `comment_votes` — Vote tracking (triggers auto-delete at 2 dislikes)
- `downloads` — Download history per user
- `payments` — Razorpay payment records
- `otp_codes` — OTP codes with expiry
- `call_sessions` — VoIP room sessions
- `call_signals` — WebRTC signaling via Supabase Realtime

---

## Deployment

This project is configured for **Cloudflare Workers** via `wrangler.jsonc`.

```bash
npm run build
npx wrangler deploy
```

---

## License

MIT
