# ?? DJ Samizen — Official Website & Event Management System

A high-performance, Afro-urban Progressive Web App (PWA) and Event Management System for **DJ Samizen**. Built with React, Vite, Supabase, and Vanilla CSS.

---

## ? Key Features

- **Afro-Urban Visual Aesthetic:** High-energy, modern design featuring custom typography, responsive layout, and sound-vault audio player.
- **Light / Dark Mode:** Toggle between Dark and Light themes with local storage persistence.
- **PWA Ready (Installable):** Supports Web App Manifest (`manifest.json`) and Service Worker (`sw.js`) for browser and mobile home screen installation.
- **Dynamic Events & Tour Schedule:** Live event listings with flyer previews, date badges, and direct ticket/booking inquiry hooks.
- **Sound Vault:** Embedded audio selector with live playback controls and volume mixer.
- **Direct Booking Engine:** Inquiries stored in Supabase with instant one-tap WhatsApp pre-filled messaging.
- **Admin Management Portal:**
  - Secure Supabase Auth & Row Level Security (RLS) enforcement.
  - CRUD operations for Events, Mixes, Categories, and Booking requests.
  - Direct flyer image upload to Supabase Storage with real-time feedback and validation.
- **Netlify Deployment Ready:** Configured with `netlify.toml` and `public/_redirects` for single-page app (SPA) routing.

---

## ??? Tech Stack

- **Frontend:** React 19, Vite 8, Lucide React icons
- **Backend & Database:** Supabase (PostgreSQL, Storage, Auth)
- **Styling:** Modular Vanilla CSS with design tokens
- **Deployment:** Netlify & Git

---

## ?? Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/josephngotho/dj-samizen.git
   cd dj-samizen
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   Add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
   ```

4. **Start the local server:**
   ```bash
   npm run dev
   ```

5. **Build for Production:**
   ```bash
   npm run build
   ```

---

## ?? Netlify Deployment

1. Connect your repository `josephngotho/dj-samizen` to **[Netlify](https://app.netlify.com/)**.
2. **Build settings:**
   - **Base directory:** Leave empty
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
3. **Environment variables:**
   - In Netlify Site Settings > **Environment variables**, add:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_PUBLISHABLE_KEY`
4. Deploy site!

---

## ?? Installing as an App (PWA)

- **Mobile (Chrome / Safari):** Tap "Add to Home Screen" or the install banner.
- **Desktop (Chrome / Edge):** Click the install icon in the address bar.

