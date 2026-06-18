import { Either } from './types/either';
import {
  GroupedDocument,
  ReaderDocument,
  ReaderListResponse,
  ReaderLocation,
} from './types/readwise';

type ExportError = 'auth' | string;

const READER_LIST_URL = 'https://readwise.io/api/v3/list/';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Fetch a single page of the Reader list endpoint, transparently retrying on
 * 429 rate-limit responses using the Retry-After header.
 */
const fetchListPage = async (
  apiKey: string,
  params: URLSearchParams
): Promise<Either<ExportError, ReaderListResponse>> => {
  while (true) {
    console.log('Making Reader list API request with params ' + params.toString());
    const response = await fetch(`${READER_LIST_URL}?${params.toString()}`, {
      method: 'GET',
      headers: { Authorization: `Token ${apiKey}` },
    });
    if (response.ok) {
      return { success: true, data: await response.json() };
    }
    if (response.status === 401) {
      return { success: false, error: 'auth' };
    }
    if (response.status === 429) {
      const retryAfter = Number.parseInt(response.headers.get('Retry-After') || '1', 10);
      console.log(`Hit rate limit, retrying after ${retryAfter}s...`);
      await sleep((Number.isFinite(retryAfter) ? retryAfter : 1) * 1000);
      continue;
    }
    return { success: false, error: response.statusText };
  }
};

const fetchAllDocuments = async (
  apiKey: string,
  updatedAfter?: string
): Promise<Either<ExportError, ReaderDocument[]>> => {
  const all: ReaderDocument[] = [];
  let nextPageCursor: string | null = null;
  do {
    const params = new URLSearchParams();
    if (nextPageCursor) params.append('pageCursor', nextPageCursor);
    if (updatedAfter) params.append('updatedAfter', updatedAfter);
    const page = await fetchListPage(apiKey, params);
    if (!page.success) return page;
    all.push(...page.data.results);
    nextPageCursor = page.data.nextPageCursor ?? null;
  } while (nextPageCursor);
  return { success: true, data: all };
};

const fetchDocumentById = async (
  apiKey: string,
  id: string
): Promise<ReaderDocument | undefined> => {
  const params = new URLSearchParams({ id });
  const page = await fetchListPage(apiKey, params);
  if (page.success) return page.data.results[0];
  return undefined;
};

/**
 * Fetch Reader documents updated since `updatedAfter` (or everything on the
 * first sync), then reconstruct the document -> highlights hierarchy from the
 * flat list the API returns.
 *
 * Scope: only documents that have at least one highlight are returned.
 */
export const getReaderDocumentsSince = async (
  apiKey: string,
  updatedAfter?: string,
  allowedLocations?: ReaderLocation[]
): Promise<Either<ExportError, GroupedDocument[]>> => {
  const result = await fetchAllDocuments(apiKey, updatedAfter);
  if (!result.success) return result;
  const documents = result.data;

  // Documents with a location outside the allowed set are skipped (their
  // highlights go with them). A null location is always kept.
  const locationFilter = allowedLocations ? new Set<ReaderLocation>(allowedLocations) : null;
  const isAllowedLocation = (doc: ReaderDocument) =>
    !locationFilter || doc.location == null || locationFilter.has(doc.location);

  // parent_id === null => top-level document; otherwise a highlight/note child.
  const parentsById = new Map<string, ReaderDocument>();
  const highlights: ReaderDocument[] = [];
  // A note in Reader is its own `note` document whose `content` holds the note
  // text and whose `parent_id` points at the highlight (or document) it annotates.
  const noteContentByParentId = new Map<string, string[]>();
  for (const doc of documents) {
    if (doc.parent_id == null) {
      if (isAllowedLocation(doc)) parentsById.set(doc.id, doc);
    } else if (doc.category === 'highlight') {
      highlights.push(doc);
    } else if (doc.category === 'note' && doc.content) {
      const existing = noteContentByParentId.get(doc.parent_id) || [];
      existing.push(doc.content);
      noteContentByParentId.set(doc.parent_id, existing);
    }
  }

  // Attach note text onto the highlight it belongs to. The highlight's own
  // `notes` field is always empty in Reader; the note lives in a child document.
  for (const hl of highlights) {
    const notes = noteContentByParentId.get(hl.id);
    if (notes && notes.length > 0) {
      hl.notes = notes.join('\n');
    }
  }

  // On incremental syncs a highlight can come back without its parent (the
  // parent wasn't itself modified). Fetch any missing parents individually.
  const missingParentIds = new Set<string>();
  for (const hl of highlights) {
    if (hl.parent_id && !parentsById.has(hl.parent_id)) {
      missingParentIds.add(hl.parent_id);
    }
  }
  for (const id of missingParentIds) {
    const parent = await fetchDocumentById(apiKey, id);
    if (parent && isAllowedLocation(parent)) parentsById.set(parent.id, parent);
  }

  // Document-level notes: a `note` document can also point straight at a parent
  // document. Prefer those over the (rarely populated) document `notes` field.
  for (const parent of parentsById.values()) {
    const childNotes = noteContentByParentId.get(parent.id);
    if (childNotes && childNotes.length > 0) {
      parent.notes = childNotes.join('\n');
    }
  }

  // Group highlights under their parent, keeping only documents that have any.
  const grouped = new Map<string, GroupedDocument>();
  for (const hl of highlights) {
    const parent = hl.parent_id ? parentsById.get(hl.parent_id) : undefined;
    if (!parent) continue;
    let entry = grouped.get(parent.id);
    if (!entry) {
      entry = { document: parent, highlights: [] };
      grouped.set(parent.id, entry);
    }
    entry.highlights.push(hl);
  }

  return { success: true, data: [...grouped.values()] };
};
