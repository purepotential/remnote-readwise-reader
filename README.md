# Readwise Reader for RemNote

Sync your [Readwise Reader](https://read.readwise.io) library into RemNote — the documents you save to read later, together with their highlights and notes.

Unlike a plain highlights export, this plugin treats Reader **documents** as first-class: every synced item keeps its Reader category (article, email, PDF, EPUB, tweet, video, RSS) and its reading location, links straight back into the Reader app, and brings across both highlight notes and document-level notes. It talks to the modern [Readwise Reader API (v3)](https://readwise.io/reader_api).

> This is a community fork of [Readwise Sync](https://github.com/bjsi/remnote-readwise) by **Jamesb (bjsi)**, rebuilt around Readwise Reader. See [Credits](#credits).

## Features

- Syncs your Readwise Reader library, not just highlights — a document is synced if it has at least one highlight **or** a document-level note.
- Keeps each document's **category** (article, email, pdf, epub, tweet, video, rss) and **reading location** (new / later / shortlist / archive) as properties.
- Brings across **highlights**, **highlight notes**, and **document-level notes** (rendered as a `Note` node next to `Highlights`).
- Links every document and highlight **back into the Reader app**.
- Choose what to sync: your Library by default, with optional **Feed** and **Archive**.
- Optional extra properties (source URL, site name, word count, reading progress, …), off by default.
- Syncs automatically in the background, with API rate-limit handling so large libraries don't trip errors.

## Usage

- Add your Readwise API key in the plugin settings page. You can get one by following [these instructions](https://readwise.io/access_token) (the same token works for Readwise and Reader).
- The first time, run the **`Readwise Reader: Sync All`** command to import your existing library. Open the Omnibar with `ctrl/cmd+k` and search for it.
  - A large Reader library can take a little while on the first run. Please be patient :)
  - While the initial sync is running, **don't refresh the page or close the tab**.
- After that, syncing happens **automatically in the background** every 2 minutes.

## Settings

- **Readwise API Key** — required.
- **Sync locations** — your Library (Inbox + Later + Shortlist) is always synced. Two toggles, off by default, add more on top:
  - **Sync Feed** — also sync documents in your Reader Feed (RSS).
  - **Sync Archive** — also sync archived documents.
- **Optional document properties** — off by default. Each toggle adds an extra property to synced documents: Source URL, Site Name, Word Count, Reading Progress, Published Date, Saved At. The always-synced set (title, author, image, category, location, summary, tags, plus the Note and Highlights nodes) is unaffected. Enabling a toggle applies on the next sync.

## How documents are stored

- Reader documents live under a Top Level Rem called **"Readwise Reader"** — **please don't rename, move or delete this document**, otherwise the plugin won't be able to find where to save your library.
- Each document keeps its metadata as properties, with:
  - a **`Note`** node holding its document-level note (if any), and
  - a **`Highlights`** node holding its highlights (each with its own note and a link back into Reader).

```
Readwise Reader
└─ <document title>          (category, location, author, … as properties)
   ├─ Note
   │   └─ <document note>
   └─ Highlights
       └─ <highlights>
```

## Migrating from the original Readwise Sync plugin

This plugin syncs from the **Readwise Reader API (v3)**, whereas the original [Readwise Sync](https://github.com/bjsi/remnote-readwise) uses the legacy Readwise highlights export. The two use different document IDs and a different top-level container, so they don't share state. If you previously used the original plugin, its `Readwise Books` document is left untouched — this plugin imports independently under `Readwise Reader`.

## Credits

Built on top of [Readwise Sync](https://github.com/bjsi/remnote-readwise) by **Jamesb (bjsi)**. Huge thanks for the original plugin and the groundwork it provided. This fork re-targets it at Readwise Reader and is not affiliated with or endorsed by the original author or Readwise.
