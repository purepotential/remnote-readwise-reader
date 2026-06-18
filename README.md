# Readwise Reader Sync

## Features

- Sync your [Readwise Reader](https://read.readwise.io) highlights into RemNote
- Documents keep their Reader category (article, email, pdf, epub, tweet, video, rss)
- Each document and highlight links back into the Reader app
- The document's Reader location (new / later / shortlist / archive) is stored as a property

## Usage

- Add your Readwise API key in the plugin settings page. You can acquire a Readwise API key by following [these instructions](https://readwise.io/access_token).
- On your first time using the plugin, you should use the `Readwise Sync All` command to load all of your existing highlights into RemNote. You can find this command in the Omnibar by pressing `ctrl/cmd+k` and searching for "Readwise Sync All".
  - If you have a really large Reader library, this could take a while. Please be patient :)
  - While the initial sync is running, **don't refresh the page or close the tab**.
- Once the initial sync is done, future syncing will happen **automatically in the background** every 2 minutes.

> **Note:** A document is synced if it has at least one highlight or a document-level note. Documents with neither are skipped.

## Settings

- **Readwise API Key** - required.
- **Sync locations** - your Library (Inbox + Later + Shortlist) is always synced. Two toggles, off by default, add more on top:
  - **Sync Feed** - also sync documents in your Reader Feed (RSS).
  - **Sync Archive** - also sync archived documents.
- **Optional document properties** - off by default. Each toggle adds an extra property to synced documents: Source URL, Site Name, Word Count, Reading Progress, Published Date, Saved At. The always-synced set (title, author, image, category, location, summary, tags, plus the Note and Highlights nodes) is unaffected. Enabling a toggle applies on the next sync.

## Migrating from the old (v2) Readwise sync

This version syncs from the **Readwise Reader API (v3)** instead of the legacy Readwise highlights export. The two use different document IDs, so highlights synced by the old version won't be matched against the new ones. If you previously used the old sync, delete the old `Readwise Books` document and run `Readwise Sync All` once to get a clean import under `Readwise Reader`.

## Details

- Reader documents are stored under a Top Level Rem called "Readwise Reader" - **please don't rename, move or delete this document otherwise the plugin won't be able to find where to save your highlights!**
- Each document's highlights are stored under a "Highlights" node, and its document-level note (if any) under a "Note" node, both at the document root.
