# College AI Data Manager

A complete MERN stack web app for an education consultancy to store, edit, search, verify, and export college details. Colleges can be entered manually or drafted with Groq AI from user-provided source URLs.

## Tech Stack

- Frontend: React, Vite, Tailwind CSS
- Backend: Node.js, Express.js
- Database: MongoDB + Mongoose
- AI: Groq free tier with `llama-3.1-8b-instant` by default
- Scraping: axios + cheerio
- Exports: CSV/XLSX from the database table, printable A4 report, JSON export

## Important AI Safety Flow

AI data is never saved directly. The AI route returns structured JSON, the frontend opens an editable preview form, and the user must review and click Save.

Missing or uncertain fields are marked `Needs Verification`, and the app stores source links with every college.

The AI Fill flow can work with only college name, city, and state. The backend first tries free URL discovery through search-result scraping and official-domain probing, scrapes the official and useful internal pages, sends the collected text to Groq, then normalizes the response into the editable college form.

## Setup

1. Install dependencies:

```bash
npm run install:all
```

2. Create backend environment file:

```bash
cp backend/.env.example backend/.env
```

3. Fill `backend/.env`.

If your MongoDB password contains `@`, encode it as `%40`.

Example:

```env
MONGO_URI=mongodb+srv://USER:PASSWORD%40123@cluster.mongodb.net/college-ai-data-manager?retryWrites=true&w=majority
GROQ_API_KEY=your_groq_key_here
PORT=5000
FRONTEND_URL=http://localhost:5173
```

4. Seed sample data:

```bash
npm run seed
```

5. Run both apps:

```bash
npm run dev
```

Frontend: `http://localhost:5173`

Backend: `http://localhost:5000`

## Main API Routes

- `POST /api/colleges` create college
- `GET /api/colleges` list colleges with filters/search/sort
- `GET /api/colleges/:id` get one college
- `PUT /api/colleges/:id` update college
- `DELETE /api/colleges/:id` delete college
- `POST /api/ai/extract-college` scrape sources and generate editable JSON
- `POST /api/scrape` scrape user-provided URLs

## Deployment Notes

- Frontend can deploy to Vercel free tier.
- Backend can deploy to Render free tier.
- MongoDB Atlas free tier works with the backend.
- Add `VITE_API_URL` in Vercel, pointing to the Render backend URL.
- Add `MONGO_URI`, `GROQ_API_KEY`, and `FRONTEND_URL` in Render.
