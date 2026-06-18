export type ReaderCategory =
  | 'article'
  | 'email'
  | 'rss'
  | 'highlight'
  | 'note'
  | 'pdf'
  | 'epub'
  | 'tweet'
  | 'video';

export type ReaderLocation = 'new' | 'later' | 'shortlist' | 'archive' | 'feed';

/**
 * A single document from the Reader API v3 `/list/` endpoint.
 * Highlights and notes are ALSO documents - they have `parent_id` pointing at
 * the article/book/pdf they belong to (which has `parent_id === null`).
 */
export interface ReaderDocument {
  id: string;
  parent_id: string | null;
  url: string;
  source_url: string | null;
  title: string | null;
  author: string | null;
  summary: string | null;
  category: ReaderCategory;
  location: ReaderLocation | null;
  source: string | null;
  // Reader returns tags as a dict keyed by tag slug.
  tags: Record<string, { name: string }> | null;
  site_name: string | null;
  word_count: number | null;
  reading_progress: number | null;
  image_url: string | null;
  /**
   * For `category: 'highlight'` documents this holds the highlighted text.
   * NOTE: not formally documented in the API reference - verified empirically.
   */
  content: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  saved_at: string | null;
  published_date: string | null;
}

export interface ReaderListResponse {
  count: number;
  nextPageCursor?: string | null;
  results: ReaderDocument[];
}

/**
 * A top-level document grouped with its highlight children, reconstructed from
 * the flat list the Reader API returns.
 */
export interface GroupedDocument {
  document: ReaderDocument;
  highlights: ReaderDocument[];
}
