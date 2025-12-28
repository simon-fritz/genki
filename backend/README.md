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
-- Enable pgvector extension
create extension if not exists vector;

-- Create a table to store your documents
create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  content text,          -- corresponds to Document.page_content
  metadata jsonb,        -- corresponds to Document.metadata
  embedding vector(3072) -- 3072 dims for gemini-embedding-001
);

-- Optional: enable RLS (for production you should add proper policies)
-- alter table documents enable row level security;

-- Create a function to search for documents
create or replace function match_documents (
  query_embedding vector(3072),
  filter jsonb default '{}'
) returns table (
  id uuid,
  content text,
  metadata jsonb,
  similarity float
) language plpgsql as $$
#variable_conflict use_column
begin
  return query
  select
    id,
    content,
    metadata,
    1 - (documents.embedding <=> query_embedding) as similarity
  from documents
  where metadata @> filter
  order by documents.embedding <=> query_embedding;
end;
$$;
```

### 5. Test the integration (optional)

After setting env vars and running the Django server, you can:

* Upload a PDF using the API endpoint that triggers ingest_document(...) (see your viewset/action).

* Check in Supabase:

  * Table Editor → documents :  should show rows with content, metadata, and a non-null embedding.