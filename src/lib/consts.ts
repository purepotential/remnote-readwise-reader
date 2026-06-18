export const settings = {
  apiKey: 'api-key',
  syncFeed: 'sync-feed',
  syncArchive: 'sync-archive',
};

/**
 * Document locations synced by default (the Reader "Library": Inbox + reading
 * list). `feed` and `archive` are added on top via their own boolean settings.
 */
export const defaultSyncLocations = ['new', 'later', 'shortlist'] as const;

/**
 * Optional document properties. Each maps to a boolean setting (default off) and
 * a powerup slot. The defaults (title, author, image, category, summary,
 * location, tags) are always synced and are not listed here.
 */
export const optionalDocumentProperties = [
  {
    setting: 'sync-source-url',
    slot: 'readwise-source-url',
    name: 'Source URL',
    description: 'Sync the original URL the document was saved from.',
  },
  {
    setting: 'sync-site-name',
    slot: 'readwise-site-name',
    name: 'Site Name',
    description: 'Sync the name of the site the document came from.',
  },
  {
    setting: 'sync-word-count',
    slot: 'readwise-word-count',
    name: 'Word Count',
    description: 'Sync the document word count.',
  },
  {
    setting: 'sync-reading-progress',
    slot: 'readwise-reading-progress',
    name: 'Reading Progress',
    description: 'Sync your reading progress through the document (as a %).',
  },
  {
    setting: 'sync-published-date',
    slot: 'readwise-published-date',
    name: 'Published Date',
    description: 'Sync the date the document was originally published.',
  },
  {
    setting: 'sync-saved-at',
    slot: 'readwise-saved-at',
    name: 'Saved At',
    description: 'Sync the date you saved the document to Reader.',
  },
] as const;

export const powerups = {
  document: 'readwise-document',
  highlight: 'readwise-highlight',
};

export const documentSlots = {
  documentId: 'readwise-document-id',
  author: 'readwise-author',
  image: 'readwise-image',
  category: 'readwise-category',
  summary: 'readwise-summary',
  location: 'readwise-location',
  tags: 'readwise-tags',
};

export const highlightSlots = {
  highlightId: 'readwise-highlight-id',
  tags: 'readwise-tags',
  note: 'readwise-note-1',
};

export const storage = {
  lastSync: 'last-sync',
  syncProgress: 'sync-progress',
  syncError: 'sync-error',
  hasDoneFirstRun: 'firstRun',
};
