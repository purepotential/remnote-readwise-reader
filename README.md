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

> **Note:** Only documents that have at least one highlight are synced, together with their highlights.

## Migrating from the old (v2) Readwise sync

This version syncs from the **Readwise Reader API (v3)** instead of the legacy Readwise highlights export. The two use different document IDs, so highlights synced by the old version won't be matched against the new ones. If you previously used the old sync, delete the old `Readwise Books` document and run `Readwise Sync All` once to get a clean import under `Readwise Reader`.

## Details

- Reader documents are stored under a Top Level Rem called "Readwise Reader" - **please don't rename, move or delete this document otherwise the plugin won't be able to find where to save your highlights!**
- Highlights are stored as children of the Reader document they belong to.
