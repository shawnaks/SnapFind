<div align="center">

<img src="client/LostFound/public/android192_2.png" alt="SnapFind logo" width="150" />

# SnapFind

**Reuniting lost items with their owners, one snapshot at a time.**

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white&style=flat-square)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white&style=flat-square)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white&style=flat-square)](https://vite.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%7C%20DB%20%7C%20Storage-3FCF8E?logo=supabase&logoColor=white&style=flat-square)](https://supabase.com/)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white&style=flat-square)](https://fastapi.tiangolo.com/)
[![PyTorch](https://img.shields.io/badge/PyTorch-ResNet--18-EE4C2C?logo=pytorch&logoColor=white&style=flat-square)](https://pytorch.org/)

[Overview](#overview) · [Features](#features) · [Tech Stack](#tech-stack) · [Project Structure](#project-structure) · [Getting Started](#getting-started) · [Usage](#usage) · [Classification API](#classification-api)

</div>

---

## Overview

SnapFind is a community-powered lost-and-found platform built to replace the scattered, hard-to-navigate process of recovering lost belongings on a busy campus.

The project started at **Georgia Tech**, where a sign in the Klaus Advanced Computing Building advertised a lengthy lost-item retrieval process. In practice, lost items were spread across building front desks, group chats, and informal posts, while people who found items had no clear way to report them. SnapFind brings both sides into one searchable place: users post items they have lost or found, attach a photo, and let a convolutional neural network (CNN) tag the item automatically so it is easier for others to discover.

The repository contains both halves of the stack:

- **`client/`** — a React + TypeScript frontend backed by Supabase (auth, database, storage).
- **`backend/`** — a FastAPI service that runs a ResNet-18 classifier and exposes `POST /predict/` for automatic item categorization.

---

## Features

### 🔐 Accounts and profiles
- Email and password registration and login via Supabase Auth.
- User profiles with username, email, optional phone number, and an avatar.
- Persistent sessions with the current user cached locally.

### 📸 Photo-first item reporting
- Dedicated forms for **Post Lost Item** and **Post Found Item**.
- Images are uploaded to Supabase Storage and served through public or signed URLs.

### 🤖 AI-assisted categorization
- Uploaded item photos are sent to the local classification backend (`POST /predict/`).
- The predicted category is stored with the item and used as a search filter.
- Supported categories: `bag`, `wallet`, `umbrella`, `laptop`, `shoes`, `headphones`, `charger`, `id`, `notebook`, `key`, `phone`, and `earbud`.
- Manual category selection is available for lost-item reports when no photo is provided.

### 🔎 Unified search across lost and found items
- Browse lost and found reports together in one feed.
- Filter by keyword, item type, location, and category.
- Search by image: upload a photo, let the backend predict its category, and automatically filter the results.

### 📬 Community contact and item lifecycle
- One-click **Contact** button that opens a pre-filled email to the person who posted the item.
- Personal dashboard with separate **My Lost Items** and **My Found Items** tabs.
- Mark items as found or returned so they disappear from the active list.

---

## Tech Stack

| Layer | Technology | Purpose |
| --- | --- | --- |
| UI | [React 19](https://react.dev/) | Component-based interface |
| Language | [TypeScript 5.8](https://www.typescriptlang.org/) | Type-safe application code |
| Build tool | [Vite 7](https://vite.dev/) | Dev server, HMR, and production builds |
| Routing | [React Router 7](https://reactrouter.com/) | Client-side page routing |
| Styling | [Sass / SCSS](https://sass-lang.com/) | Page and component styles |
| Auth & data | [Supabase](https://supabase.com/) | Authentication, Postgres database, and file storage |
| Backend | [FastAPI](https://fastapi.tiangolo.com/) + [Uvicorn](https://www.uvicorn.org/) | Classification API |
| Model | [PyTorch](https://pytorch.org/) ResNet-18 | Image-based item categorization |
| Animation | [react-type-animation](https://www.npmjs.com/package/react-type-animation) | Landing-page typing effect |
| Quality | ESLint + TypeScript ESLint | Static analysis and linting |

### Architecture

```text
┌──────────────────────────────┐
│   React + TypeScript client  │
│         (Vite build)         │
└──────────────┬───────────────┘
               │
     ┌─────────┼──────────────────────────────┐
     │         │                              │
     ▼         ▼                              ▼
┌─────────┐ ┌──────────────────┐   ┌──────────────────────────┐
│Supabase │ │ Supabase Postgres│   │ FastAPI backend          │
│  Auth   │ │  lost-items      │   │  backend/                │
│profiles │ │  found-items     │   │  POST /predict/          │
└─────────┘ └──────────────────┘   │  ResNet-18 → class name  │
               │                   └──────────────────────────┘
               ▼
      ┌──────────────────┐
      │ Supabase Storage │
      │  lost-items      │
      │  found-items     │
      └──────────────────┘
```

---

## Project Structure

```text
SnapFind/
├── backend/                        # FastAPI image classification API
│   ├── main.py                     # FastAPI app, model loading, /predict endpoint
│   ├── model.pth                   # Trained ResNet-18 checkpoint (~43 MB)
│   ├── modeltester.py              # Training pipeline that produced model.pth
│   ├── requirements.txt            # Python dependencies
│   ├── render.yaml                 # Render deployment blueprint
│   ├── .gitignore
│   └── README.md
├── client/
│   └── LostFound/                  # React + TypeScript frontend
│       ├── public/                 # App icons and static images
│       ├── src/
│       │   ├── components/         # Navbar, TypingText
│       │   ├── layouts/            # AppLayout
│       │   ├── lib/                # supabaseClient
│       │   ├── pages/              # Landing, Login, Register, Home, PostLost, PostFound, Profile
│       │   └── scss/               # Styles
│       ├── package.json
│       └── vite.config.ts
└── README.md
```

### Routes

| Route | Page | Description |
| --- | --- | --- |
| `/` | Landing | Public welcome page with login and registration links |
| `/login` | Login | Email/password sign-in |
| `/register` | Register | Create an account and profile |
| `/home` | Home | Search and browse lost and found items |
| `/post-lost` | Post Lost | Report an item you lost |
| `/post-found` | Post Found | Report an item you found |
| `/profile` | Profile | View and manage your own reports |

---

## Getting Started

### Prerequisites

- **Node.js 20.19+** or **22.12+** (required by Vite 7)
- **npm** (included with Node.js)
- **Python 3.9+** (for the classification backend)
- A **Supabase project** with Auth, Postgres, and Storage enabled

### 1. Clone the repository

```bash
git clone https://github.com/shawnaks/SnapFind.git
cd SnapFind
```

### 2. Run the classification backend

The backend powers image categorization for the frontend. Start it first so prediction requests succeed.

```bash
cd backend

python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS / Linux
source .venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

The API is now available at `http://localhost:8000` (interactive docs at `/docs`). See [Classification API](#classification-api) for details.

### 3. Configure the frontend

```bash
cd client/LostFound
npm install
```

Create a `.env.local` file inside `client/LostFound/`:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY

# Optional — override the classification backend URL (defaults to http://localhost:8000)
VITE_PREDICTION_API_URL=http://localhost:8000
```

`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are found in your Supabase project under **Project Settings → API**.

Set up Supabase with the required tables, buckets, and policies (see [`client/LostFound/README.md`](client/LostFound/README.md) and the SQL in the section below for a starting schema).

### 4. Start the frontend

```bash
npm run dev
```

Vite will print a local URL, typically `http://localhost:5173`.

---

## Usage

1. **Create an account** at `/register`.
2. **Browse items** on `/home` — the feed merges lost and found reports. Filter by keyword, type, and category, or upload a photo and press **Search** to auto-filter by predicted category.
3. **Report a found item** at `/post-found` — upload a photo; SnapFind predicts its category, uploads the image to Supabase Storage, and saves the report.
4. **Report a lost item** at `/post-lost` — choose a category manually or let the backend predict it from a photo.
5. **Manage your reports** at `/profile`, and press **Contact** on any item to email its poster.

---

## Classification API

The backend exposes a single prediction endpoint used by the frontend:

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/predict/` | Accepts a multipart image (`file`) and returns `{"predicted_class": "<category>"}` |
| `GET` | `/` | Health check |

```bash
curl -X POST "http://127.0.0.1:8000/predict/" -F "file=@wallet.jpg"
# {"predicted_class":"wallet"}
```

**Supported categories:** `bag`, `charger`, `earbud`, `headphones`, `id`, `key`, `laptop`, `notebook`, `phone`, `shoes`, `umbrella`, `wallet`.

The model is a transfer-learning ResNet-18 (12-way classification, CPU inference) whose weights live in `backend/model.pth`. `backend/modeltester.py` is the training pipeline that produced it. See [`backend/README.md`](backend/README.md) for full backend details and Render deployment.

### Pointing the frontend at a deployed backend

By default the frontend calls `http://localhost:8000`. To use a deployed backend, set:

```env
VITE_PREDICTION_API_URL=https://your-deployed-api.example.com
```

---

## Supabase schema (starting point)

```sql
-- Profiles
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text,
  email text,
  phone text,
  created_at timestamptz not null default now()
);

-- Lost items
create table public."lost-items" (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category text,
  location text,
  date date,
  image_url text,
  user_id uuid references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  resolved boolean not null default false,
  resolved_at timestamptz
);

-- Found items
create table public."found-items" (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category text,
  location text,
  date date,
  image_url text,
  user_id uuid references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  resolved boolean not null default false,
  resolved_at timestamptz
);

alter table public.profiles enable row level security;
alter table public."lost-items" enable row level security;
alter table public."found-items" enable row level security;
```

Create two **public storage buckets** named `lost-items` and `found-items`, and add row-level security policies so listings are publicly readable while inserts/updates/deletes are restricted to the owning authenticated user.

---

## License

No license file is currently included in this repository. Until a license is added, the project is assumed to be all rights reserved by its authors.

---

## Acknowledgments

- **Georgia Institute of Technology** for the inspiration behind the project.
- [Supabase](https://supabase.com/), [React](https://react.dev/), [Vite](https://vite.dev/), [React Router](https://reactrouter.com/), and [Sass](https://sass-lang.com/) for the frontend foundation.
- [FastAPI](https://fastapi.tiangolo.com/) and [PyTorch](https://pytorch.org/) for the classification backend.

<div align="right">

[Back to top](#snapfind)

</div>
