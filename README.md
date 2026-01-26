# Personal Injury Demand Letter Generator

AI-powered application for generating professional personal injury demand letters from case documents.

## Tech Stack

- **Frontend**: Next.js 14+, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **AI**: Anthropic Claude API
- **Auth**: Clerk
- **Storage**: AWS S3

## Getting Started

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- Anthropic API key
- Clerk account
- AWS S3 bucket (for document storage)

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/joe-bera/pi-demand-letter-cc.git
   cd pi-demand-letter-cc
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd backend && npm install
   cd ../frontend && npm install
   cd ..
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

4. **Start the database**
   ```bash
   docker-compose up -d
   ```

5. **Run database migrations**
   ```bash
   npm run db:generate
   npm run db:migrate
   ```

6. **Start development servers**
   ```bash
   npm run dev
   ```

   - Frontend: http://localhost:3000
   - Backend: http://localhost:3001

## Project Structure

```
/
├── frontend/          # Next.js frontend application
│   ├── src/
│   │   ├── app/       # Next.js App Router pages
│   │   ├── components/# React components
│   │   ├── hooks/     # Custom React hooks
│   │   ├── lib/       # Utilities and API client
│   │   └── types/     # TypeScript types
│   └── ...
├── backend/           # Express backend API
│   ├── src/
│   │   ├── routes/    # API route handlers
│   │   ├── services/  # Business logic
│   │   ├── prompts/   # AI prompts
│   │   ├── middleware/# Express middleware
│   │   └── utils/     # Utilities
│   └── prisma/        # Database schema & migrations
└── docker-compose.yml # Local development services
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both frontend and backend in development mode |
| `npm run build` | Build both frontend and backend for production |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate` | Run database migrations |
| `npm run db:studio` | Open Prisma Studio |
| `npm run lint` | Run linting on both projects |
| `npm run test` | Run tests |

## Features

- **Document Upload**: Upload medical records, bills, police reports, and photos
- **AI Extraction**: Automatically extract structured data from documents
- **Demand Letter Generation**: Generate professional demand letters with customizable tone
- **Warning System**: Flag treatment gaps, pre-existing conditions, and other issues
- **Export**: Export to Word (.docx) or PDF format
- **Multi-Tenant**: Support for multiple law firms with branding

## License

Proprietary - Lombera Law
