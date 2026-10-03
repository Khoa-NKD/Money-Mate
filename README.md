# Money-Mate

Web-based solution for personal finance management — track transactions, manage budgets, and analyze spending behavior.

## Features

- **Authentication**: Secure sign-up, sign-in, and session persistence via Supabase Auth.
- **Transactions Management**: Add, update, view, and delete income/expense transactions with optimistic feedback and confirmation modals.
- **Categories Management**: User-defined income and expense categories with custom emoji icons and color pickers.
- **Security & Integrity**: 
  - Row Level Security (RLS) on all tables with optimized `(select auth.uid())` subqueries.
  - Composite foreign keys ensuring transactions can only reference categories owned by the same user.
- **Responsive & Modern UI**: Built with React 19, TypeScript strict mode, and custom responsive styling.

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Backend / Database**: Supabase (PostgreSQL, Supabase Auth, Row Level Security)
- **State & Hooks**: React Context, Custom hooks (`useTransactions`, `useCategories`, `useAddTransaction`, etc.)

## Getting Started

### 1. Prerequisites

- Node.js (v18+)
- npm

### 2. Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Installation

```bash
npm install
```

### 4. Database Setup

Execute the SQL scripts in Supabase SQL Editor:
1. `supabase/schema.sql`
2. `supabase/migrations/20261011_optimize_rls.sql`
3. `supabase/migrations/20261012_composite_category_fk.sql`

### 5. Run Locally

```bash
npm run dev
```
