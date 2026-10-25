# Supabase Live Database Audit & Integration Analysis
**DJ Samizen Official Website**  
**Date**: October 26, 2026  
**Project Reference**: `mkjzswvnrqvnedqdgukg`  
**Region**: `eu-central-1`  
**PostgreSQL Version**: 17  
**Database URL**: `https://mkjzswvnrqvnedqdgukg.supabase.co`

---

## 1. Executive Summary

An audit of the live Supabase database and frontend integration was conducted to identify the root cause of event creation failures in the DJ Samizen admin dashboard.

### Key Findings
1. **Silent Failure & Swallowed Errors**:
   - `createEvent` in `src/lib/supabase.js` caught database errors and logged a `console.warn`, then returned a dummy local event object (`{ id: 'evt-...' }`).
   - `handleSaveEvent` in `src/components/AdminDashboard.jsx` unconditionally closed the modal (`setEventModal(false)`) and cleared state, hiding all failures from the administrator.
2. **Schema Constraint Mismatch**:
   - Live column `public.events.flyer_path` is configured as **`NOT NULL`** (`required text`).
   - The frontend form only accepted an optional `flyer_url` string and never submitted `flyer_path`.
   - Any event insertion without `flyer_path` immediately fails with PostgreSQL error `23502: null value in column "flyer_path" of relation "events" violates not-null constraint`.
3. **Storage RLS Access Restriction**:
   - Bucket `event-flyers` has strict Row Level Security (RLS) policies configured.
   - Anonymous (unauthenticated) uploads to `event-flyers` are rejected by Supabase Storage with HTTP 403 `AccessDenied` (`new row violates row-level security policy`).
   - The admin dashboard previously used a client-side passcode (`samizen2026`) without authenticating a Supabase session (`supabase.auth`). Therefore, all requests were sent under the `anon` role.
4. **Table RLS Inconsistency**:
   - Previously, overly permissive policies (`Manage events policy` with `USING (true) WITH CHECK (true)`) permitted unrestricted operations across some tables, while unpublished events were exposed by `Public read events USING (true)`.
   - The security model requires:
     - Anonymous visitors: read published events only (`is_published = true`).
     - Authorized administrator (`josephngotho988@gmail.com`): full management rights.
     - Bookings: public insert only, administrator read/manage only.
5. **Missing Tables in PostgREST Schema Cache**:
   - `public.mixes` and `public.bookings` returned HTTP 404 (`PGRST205: Could not find the table in the public schema`).

---

## 2. Live Database Schema Inspection

### A. Table: `public.events`
- **Current Row Count**: 0
- **Columns**:
  | Column Name | Data Type | Nullable | Default | Constraints / Foreign Keys |
  |---|---|---|---|---|
  | `id` | `uuid` | NO | `gen_random_uuid()` | Primary Key |
  | `title` | `text` | NO | None | Required event title |
  | `slug` | `text` | NO | None | Unique constraint |
  | `description` | `text` | YES | None | Optional details |
  | `venue` | `text` | YES | None | Event venue / venue name |
  | `event_date` | `date` | NO | None | Required event date (YYYY-MM-DD) |
  | `event_time` | `time` | YES | None | Time without timezone |
  | `event_timezone` | `text` | NO | `'Africa/Nairobi'` | Timezone |
  | `category_id` | `uuid` | YES | None | FK -> `event_categories(id)` |
  | `flyer_path` | `text` | **NO** | None | **REQUIRED path in storage** |
  | `external_event_url` | `text` | YES | None | External link |
  | `is_published` | `boolean` | NO | `true` | Visibility flag |
  | `created_by` | `uuid` | YES | None | FK -> `auth.users(id)` |
  | `created_at` | `timestamptz` | NO | `now()` | Creation timestamp |
  | `updated_at` | `timestamptz` | NO | `now()` | Update timestamp |
  | `flyer_cleanup_status`| `text` | NO | `'pending'` | Background cleanup status |
  | `flyer_deleted_at` | `timestamptz` | YES | None | Deletion timestamp |
  | `city` | `text` | YES | `'Nairobi'` | City location |
  | `flyer_url` | `text` | YES | None | Public flyer URL |
  | `ticket_url` | `text` | YES | None | Ticket / RSVP link |
  | `status` | `text` | YES | `'upcoming'` | `'upcoming'`, `'past'`, `'sold_out'` |
  | `category` | `text` | YES | None | Denormalized category name |

> **Critical Note on `flyer_path`**: Every insert statement MUST supply a non-null string in `flyer_path`.

---

### B. Table: `public.event_categories`
- **Current Row Count**: 4 (`Mugithi`, `Bongo Flava`, `Reggae`, `Gospel`)
- **Columns**:
  | Column Name | Data Type | Nullable | Default |
  |---|---|---|---|
  | `id` | `uuid` | NO | `gen_random_uuid()` (PK) |
  | `name` | `text` | NO | None |
  | `slug` | `text` | NO | None (Unique) |
  | `display_order` | `integer`| YES | `0` |
  | `is_active` | `boolean`| NO | `true` |
  | `created_at` | `timestamptz`| NO | `now()` |

---

### C. Table: `public.dj_profile`
- **Current Row Count**: 1 (`DJ Samizen`)
- **Columns**: `id`, `display_name`, `tagline`, `bio`, `booking_email`, `booking_phone`, `profile_image_url`, `updated_at`.

---

### D. Table: `public.social_links`
- **Current Row Count**: 5 (`facebook`, `youtube`, `tiktok`, `instagram`, `x`)
- **Constraint**: Accepted platforms are `facebook`, `youtube`, `tiktok`, `instagram`, `x`.

---

### E. Tables: `public.mixes` and `public.bookings`
- Both tables returned `PGRST205` (Table does not exist in the live schema cache).
- Additive SQL migration created in `supabase/schema.sql` to establish these tables with correct RLS policies.

---

### F. Storage Buckets: `event-flyers`
- **Bucket ID**: `event-flyers`
- **Public**: `true` (Public read allowed)
- **Allowed MIME types**: `image/jpeg`, `image/png`, `image/webp`
- **Maximum File Size**: 5 MB (5,242,880 bytes)
- **Row Level Security**: Enabled. Anon uploads fail with HTTP 403 `AccessDenied`.
- **Target Storage Path**: `flyers/${timestamp}-${slug}.${ext}`

---

## 3. Root Cause Analysis of Event Creation Failure

| Step | What Went Wrong | Observed Error |
|---|---|---|
| **1. Form Validation** | Form did not provide a file upload input for flyers, only an optional URL text input. | N/A |
| **2. Storage Upload** | Flyer file was not uploaded to `event-flyers` bucket, and storage uploads by `anon` are blocked by RLS. | `StorageApiError: new row violates row-level security policy` (403 AccessDenied) |
| **3. Payload Formulation** | `createEvent` did not set `flyer_path` in the insert payload. | N/A |
| **4. Database Insert** | PostgREST rejected insert because `flyer_path` is `NOT NULL`. | `code: "23502"`, `message: 'null value in column "flyer_path" of relation "events" violates not-null constraint'` |
| **5. Error Handling** | `createEvent` caught the error, logged `console.warn`, and returned a fake local event object. | N/A |
| **6. UI Feedback** | `handleSaveEvent` in `AdminDashboard.jsx` called `setEventModal(false)` and cleared state immediately without checking for errors. | Modal closed silently; no user feedback. |

---

## 4. Remediation Plan

1. **Frontend Message Delivery**:
   - Provide an inline notification banner in `AdminDashboard.jsx` for all actions: "Event created successfully", "Could not create event: [reason]".
   - Keep event modal open upon failure, preserving all entered inputs and file selection.
   - Display a technical error panel inside the modal showing operation, error code, human-readable message, and troubleshooting instructions.
   - Inline field-level validation for title, date, category, and flyer file.
2. **Flyer Upload & Insert Flow**:
   - Implement real file upload input with drag-and-drop / file selector supporting JPEG, PNG, WebP up to 5MB.
   - Sequential workflow: validate form -> upload file to `event-flyers` -> on storage success, insert row into `public.events` with both `flyer_path` and `flyer_url`.
   - Rollback mechanism: if database insert fails after flyer upload, automatically delete newly uploaded orphan flyer.
3. **Authentication & Security (RLS)**:
   - Provide Supabase Auth login alongside passcode in dashboard for `josephngotho988@gmail.com`.
   - Update `supabase/schema.sql` with strict, non-permissive RLS policies matching the security specification.
