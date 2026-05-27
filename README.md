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

Unknown fields are left blank in the editable form, while verification status and missing-field groups are shown separately. The app stores source links with every college.

The AI Fill flow can work with only college name, city, and state. The backend first tries free URL discovery through search-result scraping and official-domain probing, scrapes the official and useful internal pages, sends the collected text to Groq, then normalizes the response into the editable college form.

Deep Research mode also runs source-gap analysis. If important data is missing, it retries targeted queries for courses, fees, admissions, placements, approvals, contact pages, and brochure PDFs before returning the final preview.

The AI Fill backend now uses a universal self-improving research engine:

1. It normalizes names, abbreviations, typos, city/state hints, and likely aliases.
2. It runs multi-pass research for official sites, trusted portals, PDFs, admissions, academics, placements, approvals, and contact pages.
3. It scores extraction quality and plans field-specific retries when data is weak.
4. It records useful source patterns in `researchPatterns` when MongoDB is available, so future searches can prioritize domains that previously filled courses, fees, placements, approvals, or contact data.
5. It exposes planner decisions, retries, source success, PDF count, scraped text size, and quality score in the admin debug panel.

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
JWT_SECRET=change_this_to_a_long_random_secret
ADMIN_NAME=Admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=choose_a_strong_password
```

4. Create the first admin account:

```bash
cd backend
npm run create-admin
```

The password is hashed before it is stored in MongoDB. Admin login is opened from the small Admin/lock button in the navbar, `Ctrl + Shift + A`, double-clicking the logo, or visiting `/admin`.

5. Seed sample data:

```bash
npm run seed
```

6. Run both apps:

```bash
npm run dev
```

Frontend: `http://localhost:5173`

Backend: `http://localhost:5000`

## Main API Routes

- `GET /api/health` backend and MongoDB health status with uptime, retry count, and reconnect timing
- `GET /api/colleges` public-safe list with filters/search/sort
- `GET /api/colleges/:id/public` public-safe college profile
- `GET /api/colleges/:id/admin` admin-only full college profile
- `POST /api/colleges` admin-only create college
- `PUT /api/colleges/:id` admin-only update college
- `DELETE /api/colleges/:id` admin-only delete college
- `POST /api/ai/extract-college` admin-only scrape sources and generate editable JSON
- `POST /api/auth/login` admin login, returns JWT
- `GET /api/auth/me` validates current admin token
- `GET /api/private/college/:id` admin-only private consultancy details
- `PUT /api/private/college/:id` admin-only private consultancy details update
- `POST /api/scrape` scrape user-provided URLs
- `POST /api/colleges/merge/:id` intelligently merge an AI draft into an existing college without deleting private/manual data

## Public And Admin Modes

The default website is a public student/customer portal. Public users can search colleges and open public details, but the backend strips private consultancy details, incentive data, donation data, internal notes, debug logs, merge metadata, and admin-only fields before sending responses.

The frontend uses two separate layouts:

- `frontend/src/layouts/PublicLayout.jsx` for `/`, `/colleges`, `/search`, `/states/:state`, and `/colleges/:id`
- `frontend/src/layouts/AdminLayout.jsx` for `/admin/*`

Public routes use a clean college discovery theme with a public navbar, hero search, browse sections, public college table, public details, and a footer. Public pages do not render admin actions even if an admin is logged in.

Admin mode is protected with JWT authentication. After login from the public modal or `/admin/login`, admins are redirected to `/admin/dashboard` and see a completely separate management panel with a dark sidebar, admin topbar, dashboard metrics, CRUD routes, AI Fill, deep research shells, reports, merge queue, debug tools, exports, and private consultancy access. Backend middleware protects the same operations, so frontend hiding is not the security boundary.

## Database Resilience

The backend keeps running even when MongoDB Atlas is unreachable. It validates MongoDB environment settings, logs connection events, retries with exponential backoff, and exposes the current state at `/api/health`.

When MongoDB is disconnected, DB-dependent APIs return:

```json
{
  "success": false,
  "databaseConnected": false,
  "message": "Database temporarily unavailable. Please wait for MongoDB to reconnect."
}
```

The frontend listens for these responses and shows a database status banner with a retry button instead of a blank screen or endless spinner.

For a stable static frontend preview after building:

```bash
cd frontend
npm run build
npm run serve:dist
```

## AI Extraction Quality Testing

Run the backend first, then run:

```bash
cd backend
npm run test:quality
```

For a shorter smoke run:

```bash
TEST_LIMIT=3 npm run test:quality
```

The script tests the configured college list in Deep Research mode and writes:

- `backend/reports/extraction-quality-report.json`
- `backend/reports/extraction-quality-report.html`

Each report shows matched college name, official website, course count, fee coverage, source count, confidence score, quality score, missing fields, failed URLs, source success tracking, and improvement suggestions.

Quality scoring:

- official website: 10
- address/city/state: 10
- affiliation: 10
- approvals/accreditation: 10
- 10+ courses: 20
- fees in 5+ courses: 15
- admission process: 10
- placement data: 10
- facilities: 5
- 5+ source links: 10

To improve extraction quality, edit:

- `backend/src/services/universalCollegeResearchEngine.js` for the multi-pass adaptive extraction loop
- `backend/src/services/missingFieldResearchPlanner.js` for field-specific retry strategy
- `backend/src/services/sourceLearningEngine.js` for source success learning and domain priority memory
- `backend/src/services/extractionQualityEngine.js` for quality scoring rules
- `backend/src/services/sourceGapAnalyzer.js` for missing-field logic and targeted retry queries
- `backend/src/services/collegeSearchService.js` for trusted domains and search patterns
- `backend/src/services/scraperService.js` for parsing tables, cards, JSON-LD, Next.js data, and embedded course/fee scripts
- `backend/src/services/groqService.js` for extraction prompt changes

To add more test colleges, edit the `colleges` array in `backend/scripts/testCollegeExtractionQuality.js`.

## Deployment Notes

- Frontend can deploy to Vercel free tier.
- Backend can deploy to Render free tier.
- MongoDB Atlas free tier works with the backend.
- Add `VITE_API_URL` in Vercel, pointing to the Render backend URL.
- Add `MONGO_URI`, `GROQ_API_KEY`, and `FRONTEND_URL` in Render.
