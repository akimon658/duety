# Duety

This service synchronizes assignment information from a university LMS calendar
URL to Google Tasks.

## Tech Stack

- Built with **Deno**, **Fresh v2**, **Vite**, and **daisyUI**
- Uses **MySQL** for data storage
- Integrates with **Google Tasks API**

## Features

- 📅 Sync iCal calendar events to Google Tasks
- 🔄 Automatic periodic synchronization
- ✏️ Manual sync trigger
- 📝 Maps calendar event summary to task title
- 📋 Maps calendar event description to task notes
- 🗓️ Syncs due dates from calendar events
- 🔍 Tracks synced events to avoid duplicates
- ♻️ Updates existing tasks when events change
- 🗑️ Removes tasks when events are deleted from calendar

## Setup

### Prerequisites

- Deno: https://docs.deno.com/runtime/getting_started/installation
- MySQL database
- Google OAuth credentials (for Google Tasks API)

### Configuration

1. Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

2. Set up your environment variables:
   - Database credentials
   - Google OAuth client ID and secret
   - Sync polling configuration (optional)

### Running the Application

Start the project in development mode:

```bash
deno task dev
```

This will watch the project directory and restart as necessary.

## Task Synchronization

### How It Works

1. Users register their LMS calendar URL in the application
2. Users connect their Google account
3. The system fetches iCal data from the calendar URL
4. Events are parsed and synchronized to Google Tasks:
   - `SUMMARY` → Task title
   - `DESCRIPTION` → Task notes
   - `DTSTART`/`DTEND` → Due date

### Synchronization Options

**Manual Sync**: Users can trigger synchronization manually from the UI

**Automatic Sync**: Enable periodic polling by setting:

```bash
SYNC_POLLING_ENABLED=true
SYNC_INTERVAL_MINUTES=60  # Poll every 60 minutes
```

The polling service runs in the background and syncs all users' calendars at the
specified interval.

## Authentication

Authentication is handled via a proxy server. Local development uses Caddy to
replicate the authentication flow.
