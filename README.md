# Genki

<img src="./frontend/src/assets/logo.png" alt="App Icon" width="300" />

Genki helps you create great flashcards fast, whether you start with your own materials or with nothing at all. You can upload PDFs or text to give the AI richer context and get even better card suggestions, then quickly edit and approve what you want to study. If the model’s built-in knowledge isn’t enough, Genki can also pull in missing context via web search to improve accuracy and coverage. From there, it schedules reviews with spaced repetition and tracks your progress.

## What the app does

* **Anki-style learning:** Create, manage, and study flashcards with spaced repetition.
* **AI-assisted card creation:** Let the agent generate high-quality card suggestions you can edit and approve.
* **Personalized generation:** Use preferences to tailor card style, difficulty, and focus areas to your learning goals.
* **Upload your materials:** Add PDFs and other documents to give the AI more context and generate better, more accurate cards.
* **Cross-device sync:** Your decks and progress are stored per user, so everything stays in sync across devices.


## Architecture

- Frontend: React + TypeScript + Vite single-page app with modern UI components and authenticated flows. See [frontend/README.md](frontend/README.md).
- Backend: Django API for auth, decks, cards, study sessions, and document ingestion. Uses Supabase (PostgreSQL + pgvector) for embeddings. See [backend/README.md](backend/README.md).

## Quick start (overview)

1) Backend

- Create a virtualenv, install requirements, set environment variables, run migrations, then start the dev server: `python manage.py runserver`.
- Full steps and Supabase setup in [backend/README.md](backend/README.md).

2) Frontend

- Install npm deps, run the Vite dev server: `npm install` then `npm run dev`.
- Details and lint/build guidance are in [frontend/README.md](frontend/README.md).

3) Open the app

- Frontend dev server: http://localhost:5173 (default Vite port).
- Backend dev server: http://127.0.0.1:8000.

## Repository layout

- [frontend/](frontend) — React app source, components, pages, and API hooks.
- [backend/](backend) — Django project with apps for accounts, cards, uploads, and the agent pipeline.

---

## Run with Docker Compose (recommended for local development)

This repo includes a Docker-based dev setup that runs:

- **Django backend** (port `8000`)
- **One-shot migrations service** (runs `python manage.py migrate --noinput`)
- **React/Vite frontend** (port `5173`)

### Prerequisites

- Docker + Docker Compose (Docker Desktop is fine)

### 1) Create your environment file

Create `backend/.env` (or copy from an example if available) and set required keys, for example:

```env
DEBUG=true
DJANGO_SECRET_KEY=change-me
ALLOWED_HOSTS=localhost,127.0.0.1,backend,genki-backend

GEMINI_API_KEY=...
SUPABASE_URL=...
SUPABASE_KEY=...
SUPABASE_VECTOR_TABLE=documents
SUPABASE_QUERY_NAME=match_documents
TAVILY_API_KEY=...
```

Create `frontend/.env` (or copy from an example if available) and set required keys, for example:
```env
VITE_API_BASE_URL=/api
```

### 2) Start the services
From the repo root, run:

```bash
docker compose -f compose.dev.yml up -d --build
```