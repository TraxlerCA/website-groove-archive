# Supabase Refactor Guide

This guide details how to migrate the current Google Sheets/CSV based data layer to [Supabase](https://supabase.com/), a backend-as-a-service built on top of PostgreSQL.

## 1. Supabase Setup

### Create a Project
1.  Go to [database.new](https://database.new) and sign in with GitHub.
2.  Click **"New Project"**.
3.  Select your organization.
4.  Enter a **Name** (e.g., `website-tga`).
5.  Set a strong **Database Password** (save this!).
6.  Choose a **Region** close to your users.
7.  Click **"Create new project"**.

### Get API Keys
Once the project is created (it takes a minute):
1.  Go to **Project Settings** (cog icon) -> **API**.
2.  Find the `Project URL` and `anon` / `public` key.

### Environment Variables
Update your local `.env` file (or create one) with these credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

> **Note**: The `anon` key is safe to expose in the browser if you have Row Level Security (RLS) enabled, but for this read-only public site, standard `SELECT` permissions are fine.

## 2. Database Schema

Currently, your data is flat (CSV). In Supabase (Postgres), we should normalize this into relational tables to reduce redundancy and improve data integrity.

### Recommended Tables

#### 1. `genres`
Stores the unique genre definitions found in your `genres` sheet.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | PK, default `gen_random_uuid()` | Unique ID |
| `label` | `text` | Unique, Not Null | e.g., "Trance & High Energy Rave" |
| `explanation` | `text` | | Description of the genre |

#### 2. `artists`
Stores artist details found in your `artists` sheet.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | PK, default `gen_random_uuid()` | Unique ID |
| `artist` | `text` | Unique, Not Null | Artist name |
| `rating` | `text` | Check (`'blazing'`, `'hot'`, `'ok'`) | Artist tier/rating |

#### 4. `festival_sets`
Stores festival heatmap data (replacing the heatmaps CSV).

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | PK, default `gen_random_uuid()` | Unique ID |
| `festival` | `text` | Not Null | Festival name |
| `date` | `date` | Not Null | Event date (YYYY-MM-DD) |
| `stage` | `text` | Not Null | Stage name |
| `stage_order` | `integer` | | Display order for stages |
| `artist` | `text` | Not Null | Artist/DJ name |
| `start_time` | `time` | Not Null | Set start time (HH:MM) |
| `end_time` | `time` | Not Null | Set end time (HH:MM) |
| `rating` | `text` | Check (`'nahh'`, `'ok'`, `'hot'`, `'blazing'`, `''`) | Subjective rating |
| `created_at` | `timestamptz` | default `now()` | When the record was added |

#### 3. `sets`
The main table replacing `list.csv`.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | PK, default `gen_random_uuid()` | Unique ID |
| `title` | `text` | Not Null | Set name/title |
| `genre_id` | `uuid` | FK to `genres.id` | Link to genre |
| `rating` | `text` | | Tier/Rating for the set (if different from artist) |
| `soundcloud_url`| `text` | | URL to Soundcloud |
| `youtube_url` | `text` | | URL to Youtube |
| `created_at` | `timestamptz`| default `now()` | When the record was added |

### SQL for Setup
You can run this in the Supabase **SQL Editor** to create everything at once:

```sql
-- Create Genres Table
create table genres (
  id uuid default gen_random_uuid() primary key,
  label text unique not null,
  explanation text
);

-- Create Artists Table
create table artists (
  id uuid default gen_random_uuid() primary key,
  artist text unique not null,
  rating text check (rating in ('blazing', 'hot', 'ok'))
);

-- Create Festival Sets Table (for heatmaps)
create table festival_sets (
  id uuid default gen_random_uuid() primary key,
  festival text not null,
  date date not null,
  stage text not null,
  stage_order integer,
  artist text not null,
  start_time time not null,
  end_time time not null,
  rating text check (rating in ('nahh', 'ok', 'hot', 'blazing', '')),
  created_at timestamptz default now()
);

-- Create Sets Table
create table sets (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  genre_id uuid references genres(id),
  rating text,
  soundcloud_url text,
  youtube_url text,
  created_at timestamptz default now()
);

-- Enable Row Level Security (Recommended)
alter table genres enable row level security;
alter table artists enable row level security;
alter table sets enable row level security;
alter table festival_sets enable row level security;

-- Create Policy to allow public read access
create policy "Public read access" on genres for select using (true);
create policy "Public read access" on artists for select using (true);
create policy "Public read access" on sets for select using (true);
create policy "Public read access" on festival_sets for select using (true);
```

## 3. Repo Changes

### 1. Install Client Library
```bash
npm install @supabase/supabase-js
```

### 2. Initialize Client
Create `src/lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);
```

### 3. Update Data Fetching
Replace the logic in `src/lib/sheets.server.ts` with Supabase queries.

**Example: Fetching Sets (replacing `getListRows`)**
```typescript
import { supabase } from '@/lib/supabase';

export async function getListRows() {
  const { data, error } = await supabase
    .from('sets')
    .select(`
      title,
      rating,
      soundcloud_url,
      youtube_url,
      genres ( label )
    `);
  
  if (error) throw error;

  // Map back to your app's expected 'Row' format
  return data.map(item => ({
    set: item.title,
    classification: item.genres?.label, // Flattens the relation
    soundcloud: item.soundcloud_url,
    youtube: item.youtube_url,
    tier: item.rating
  }));
}
```

**Example: Fetching Genres**
```typescript
export async function getGenres() {
  const { data, error } = await supabase
    .from('genres')
    .select('label, explanation');
    
  if (error) throw error;
  return data;
}
```

**Example: Fetching Festival Sets (for Heatmaps)**
```typescript
export async function getFestivalSets() {
  const { data, error } = await supabase
    .from('festival_sets')
    .select('*')
    .order('date', { ascending: false });
    
  if (error) throw error;
  return data;
}
```

## 4. Data Migration Tips
Since you have CSVs:
1.  **Genres**: Import `genres` CSV into the `genres` table first using the Supabase Dashboard "Table Editor" -> "Import Data".
2.  **Artists**: Import `artists` CSV into the `artists` table.
3.  **Sets**: This is trickier because of the Foreign Key (`genre_id`).
    -   You might need to use a script to read your `list.csv`, look up the `genre_id` from Supabase based on the text label, and then insert the row into `sets`.
    -   Alternatively, import `list.csv` into a temporary table in Supabase, then run SQL to insert into `sets` joining with `genres`.
