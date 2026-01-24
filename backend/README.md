# Backend (Django)

This is a minimal Django project scaffold for local development.

Quick start:

1. Create and activate a virtual environment (macOS / zsh):

```bash
python3 -m venv .venv
source .venv/bin/activate
```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Run migrations and start the dev server:

```bash
python manage.py migrate
python manage.py runserver
```

Open http://127.0.0.1:8000/ to see the minimal backend response.


## Supabase & Vector Database Setup

This project uses Supabase (PostgreSQL + pgvector) as a vector store for document embeddings.

### 1. Create a Supabase project

1. Go to https://supabase.com and sign up / log in.
2. Click **New project**, choose:
   - A project name (e.g. deck-rag-backend)
   - A password for the database
   - A region close to you
3. Wait until the project is provisioned.

### 2. Get the Supabase URL and service key

In your Supabase project:

1. Go to **Project Settings → API**.
2. Copy:
   - **Project URL** → this will be `SUPABASE_URL`
   - **Service role secret (private key)** → this will be `SUPABASE_KEY`

### 3. Configure environment variables

In the backend root, you should have a `.env.template`. Create your actual `.env` file:

```bash
cp .env.template .env
```

Then edit .env and set at least:

```bash
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-service-role-secret
```

### 4. Create the documents table and search function

In the Supabase dashboard:

1. Open SQL Editor.
2. Create the extension, table, and function (adjusting vector length to 3072 for Gemini):

```sql
create extension if not exists vector;

-- 1) Table (matches your original shape: UUID provided by the app)
create table if not exists public.documents (
  id uuid primary key,
  content text,
  metadata jsonb,
  embedding vector(3072)
);

-- 2) Remove any old overloads to avoid PostgREST ambiguity
--    (If your database stored the arg type without dimensions, use "vector" instead of "vector(3072)".)
drop function if exists public.match_documents(vector(3072), jsonb);
drop function if exists public.match_documents(vector(3072), integer, jsonb);

-- 3) Create ONE canonical function
create or replace function public.match_documents (
  query_embedding vector(3072),
  match_count int default 4,
  filter jsonb default '{}'::jsonb
) returns table (
  id uuid,
  content text,
  metadata jsonb,
  similarity float
) language plpgsql as $$
begin
  return query
  select
    d.id,
    d.content,
    d.metadata,
    1 - (d.embedding <=> query_embedding) as similarity
  from public.documents d
  where d.metadata @> filter
  order by d.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- 4) Reload PostgREST schema cache (so rpc() sees the current signature)
notify pgrst, 'reload schema';
```

### 5. Test the integration (optional)

After setting env vars and running the Django server, you can:

* Upload a PDF using the API endpoint that triggers ingest_document(...) (see your viewset/action).

* Check in Supabase:

  * Table Editor → documents :  should show rows with content, metadata, and a non-null embedding.