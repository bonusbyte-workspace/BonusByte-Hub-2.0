# BonusByte Hub 2.0

> Premium Tap-to-Earn Telegram Web App · TON Staking · 3D Physics Engine · Hidden Admin Panel

## 🚀 Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18 + Vite + TypeScript |
| Styling | Tailwind CSS (metallic chrome theme) |
| Physics | Matter.js + HTML5 Canvas |
| Animation | Framer Motion |
| TON Wallet | @tonconnect/ui-react |
| Database | Firebase Firestore |
| Auth | Firebase Auth |
| Backend | Vercel Serverless Functions (Node 20) |
| Platform | Telegram Web App (TWA) |

## 📁 Project Structure

```
bonusbyte/
├── src/
│   ├── models/types.ts          # All TypeScript interfaces
│   ├── lib/
│   │   ├── firebase.ts          # Client SDK singleton
│   │   └── telegram.ts          # WebApp SDK helpers + haptics
│   ├── hooks/
│   │   ├── useTelegramUser.ts   # Auth + Firestore profile
│   │   ├── useTapEngine.ts      # Optimistic tap + sync + beacon
│   │   ├── useAuth.ts           # Firebase admin login
│   │   └── useLeaderboard.ts    # Cached leaderboard fetch
│   ├── components/
│   │   ├── SplashScreen/        # Pre-hydration loading gateway
│   │   ├── PhysicsCanvas/       # Matter.js particle engine
│   │   ├── TapCoin/             # 3D metallic tappable coin
│   │   ├── Navigation/          # Bottom nav (NO admin link)
│   │   ├── EnergyBar/           # Energy regen display
│   │   ├── Leaderboard/         # All-Time + Daily rankings
│   │   ├── Staking/             # Pre-launch staking + APY calc
│   │   └── admin/               # Hidden RBAC admin panel
│   │       └── modules/         # Developer / Support / Economy / Marketing
│   └── pages/
│       ├── Home.tsx             # Main tap interface
│       ├── Staking.tsx          # Staking page
│       └── admin/AdminPage.tsx  # Hidden at VITE_ADMIN_ROUTE
└── api/
    ├── _lib/
    │   ├── firebase.ts          # Admin SDK singleton
    │   └── adminAuth.ts         # HMAC initData validator
    ├── sync.ts                  # Anti-cheat click sync
    ├── stake.ts                 # Secure staking endpoint
    └── leaderboard.ts           # Cached top-100 endpoint
```

## 🔐 Hidden Admin Gateway

**Route:** `/bb-nexus-7k`

- Zero public links or navigation elements point here
- Access only via direct URL bar entry
- Protected by Firebase Auth + Firestore role check
- Roles: `developer` | `support` | `economy`

To create an admin user:
1. Create a Firebase Auth account (email/password)
2. Add a document to Firestore: `admins/{uid}` → `{ role: "developer" }`

## ⚙️ Environment Variables

Copy `.env.example` → `.env.local` for local dev.

Set all variables in **Vercel Dashboard → Project → Settings → Environment Variables**:

| Variable | Where Used |
|----------|-----------|
| `TELEGRAM_BOT_TOKEN` | Server — initData HMAC validation |
| `FIREBASE_PROJECT_ID` | Server — Admin SDK |
| `FIREBASE_CLIENT_EMAIL` | Server — Admin SDK |
| `FIREBASE_PRIVATE_KEY` | Server — Admin SDK |
| `VITE_FIREBASE_*` | Client — Firebase SDK |
| `VITE_ADMIN_ROUTE` | Client — Hidden router path |
| `VITE_MAX_CPS` | Both — Anti-cheat ceiling |

## 🧱 Firestore Schema

```
users/{telegramId}
  ├── balance, totalEarned, dailyEarned
  ├── energyAtLastSync, lastSyncAt
  ├── walletAddress, role, tapLevel
  └── stakes/{stakeId}
        ├── amount, lockDays, apy
        ├── stakedAt, unlockAt, status
        └── projectedYield

global/leaderboard
  ├── allTime: LeaderboardEntry[]
  ├── daily:   LeaderboardEntry[]
  └── updatedAt: number

global/config
  └── maxCPS, maxEnergy, regenRate

admins/{uid}
  └── role: 'developer' | 'support' | 'economy'

antiCheatLogs/{id}
  └── telegramId, reason, clicksReported, maxAllowed, timestamp
```

## 📲 Deployment

### GitHub → Vercel (auto-deploy)
```bash
git clone https://github.com/bonusbyte-workspace/BonusByte-Hub-2.0
cd BonusByte-Hub-2.0
git checkout -b feature/ton-staking-physics-core
# Copy generated files here
cp /path/to/bonusbyte/* . -r
git add .
git commit -m "feat: BonusByte Hub 2.0 — 3D physics tap-to-earn + TON staking + admin panel"
git push origin feature/ton-staking-physics-core
```

### Assets
Copy your logo: `cp logo.png public/logo.png`

## 🎮 Game Mechanics

| Mechanic | Value |
|----------|-------|
| Max CPS | 20 clicks/sec |
| Max Energy | 1,000 |
| Regen Rate | 3 energy/sec |
| Coins per Tap | 1 BB |
| Sync Interval | Every 3 seconds (debounced) |
| Leaderboard Cache | 5 minutes |

## ⚠️ Security Reminders
- Rotate `TELEGRAM_BOT_TOKEN` at @BotFather after deployment
- Never commit `.env.local` or the Firebase Admin SDK JSON
- Generate a new Firebase service account key and revoke the old one
- Set Firestore Security Rules to block unauthenticated client writes
