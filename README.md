# EventSphere Management

EventSphere is a MERN application for running expos, summits, and ticketed gatherings. Organizers submit events, an admin approves the public program, exhibitors request booths, and attendees book passes, save sessions, and check in with a ticket code.

## Stack

- MongoDB and Mongoose
- Express and JSON Web Tokens
- React, TypeScript, Vite, and Tailwind CSS

## Run it

From this folder, in PowerShell:

```powershell
npm run setup
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

The API listens on port 5000. The Vite dev server proxies `/api` to it. If `MONGO_URI` in `backend/.env` is empty, the API starts an embedded MongoDB and loads sample data. That data resets when the API process stops.

To keep data, install MongoDB or use Atlas and set:

```text
MONGO_URI=mongodb://127.0.0.1:27017/eventsphere
```

Then restart the API. Sample data loads only when the database has no users. Reset it with:

```powershell
npm run seed -- --force
```

A JSON backup of the sample database is written to `docs/database/eventsphere-backup.json` whenever the seed runs.

## Accounts

| Role | Email | Password |
| --- | --- | --- |
| Admin | admin@eventsphere.com | Admin@123 |
| Organizer | organizer@eventsphere.com | Organizer@123 |
| Exhibitor | exhibitor@eventsphere.com | Exhibitor@123 |
| Attendee | attendee@eventsphere.com | Attendee@123 |

Extra sample accounts use the same role passwords: `organizer2@eventsphere.com`, `exhibitor2@eventsphere.com`, `attendee2@eventsphere.com`.

The sign-in page can fill these in. Admin accounts cannot be created from the public form.

## What each role can do

- **Attendee:** browse approved events, book a pass, cancel before the event starts, save sessions, review an event after it ends.
- **Organizer:** draft or submit events, edit tickets, add sessions, approve booth requests, see bookings, check guests in.
- **Exhibitor:** request a 3×3, 3×6, or 6×6 booth on an approved event.
- **Admin:** approve or reject events, manage categories, suspend accounts, read reviews, see revenue.

Demo checkout does not take a real card number. A booking stores a payment reference such as `DEMO-…` and a ticket code such as `ES-KDW1-BILA`.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run setup` | Installs root, API, and web dependencies |
| `npm run dev` | Starts the API and the web app together |
| `npm run seed` | Loads sample data when the database is empty |
| `npm run build` | Builds the React app into `frontend/dist` |
| `npm start` | Starts the API. If `frontend/dist` exists, the API also serves the site |

## Project layout

```text
backend/src    Express API, models, seed
frontend/src   React application
docs           Write-up, credentials, database backup
presentation   PowerPoint used for the viva
```

Documentation for the submission is in `docs/EventSphere-Documentation.md`. The slide deck is `presentation/EventSphere.pptx`.
