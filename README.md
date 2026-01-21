# Sicko League

AFL Fantasy League Management System with senior and reserve squads, salary cap, contracts, trading, and drafts.

## Features

- **Dual Squad System** - Manage both seniors (11 players) and reserves (8 players)
- **Salary Cap** - 750 point cap with contract management
- **Home Field Advantage** - Dynamic HFA based on home game performance
- **Trading** - Trade players, draft picks, coaching staff, and salary
- **Draft System** - Annual draft and Rule 9 mid-season draft
- **Free Agency** - In-season and end-of-season free agency with RFA system
- **Coaching Staff** - Assistant coaches and list managers with real AFL tie-ins

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Database**: PostgreSQL via Supabase
- **ORM**: Prisma
- **Auth**: Supabase Auth (Discord OAuth)
- **UI**: Tailwind CSS + shadcn/ui
- **Hosting**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase account (free tier works)
- A Discord application (for OAuth)

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/zoonmattau/sickoleague.git
   cd sickoleague
   npm install
   ```

2. **Create a Supabase project** at https://supabase.com

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   Fill in your Supabase URL and keys from Dashboard > Settings > API

4. **Set up Discord OAuth** in Supabase:
   - Go to Authentication > Providers > Discord
   - Create a Discord app at https://discord.com/developers/applications
   - Add callback URL: `https://your-project.supabase.co/auth/v1/callback`

5. **Push the database schema**
   ```bash
   npx prisma db push
   ```

6. **Run the development server**
   ```bash
   npm run dev
   ```

7. Open http://localhost:3000

## Project Structure

```
src/
├── app/
│   ├── (auth)/login/       # Discord OAuth login
│   ├── (dashboard)/        # Protected dashboard routes
│   │   ├── dashboard/      # Club overview
│   │   ├── roster/         # Roster management
│   │   ├── matches/        # Fixtures & results
│   │   ├── standings/      # Ladders
│   │   ├── players/        # Player database
│   │   ├── trades/         # Trading system
│   │   └── draft/          # Draft management
│   └── auth/callback/      # OAuth callback
├── components/
│   ├── dashboard/          # Dashboard components
│   └── ui/                 # shadcn/ui components
├── lib/
│   ├── prisma.ts           # Database client
│   └── supabase/           # Supabase clients
└── types/                  # TypeScript types
```

## Deployment

Deploy to Vercel:

```bash
npx vercel
```

Add your environment variables in the Vercel dashboard.

## Links

- [Discord Server](https://discord.gg/jQ65xTRcRb)
- [League Rules](https://docs.google.com/document/d/1A8EtlcbcvCEKS9qHXKK6K3OuMBKEy5zRam4pkOB7CA8)

## License

Private - Sicko League
