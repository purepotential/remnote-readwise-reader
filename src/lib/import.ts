import { BuiltInPowerupCodes, Rem, RichTextInterface, RNPlugin } from '@remnote/plugin-sdk';
import { documentSlots, highlightSlots, optionalDocumentProperties, powerups } from './consts';
import { log } from './log';
import { Either } from './types/either';
import { GroupedDocument, ReaderDocument } from './types/readwise';
import { addLinkAsSource } from './utils';

const DOCUMENTS_PARENT_NAME = 'Readwise Reader';

type OptionalProperty = (typeof optionalDocumentProperties)[number];

/** The string value to store for an optional property, or undefined to skip. */
const optionalPropertyValue = (
  setting: OptionalProperty['setting'],
  document: ReaderDocument
): string | undefined => {
  switch (setting) {
    case 'sync-source-url':
      return document.source_url || undefined;
    case 'sync-site-name':
      return document.site_name || undefined;
    case 'sync-word-count':
      return document.word_count != null ? document.word_count.toString() : undefined;
    case 'sync-reading-progress':
      return document.reading_progress != null
        ? `${Math.round(document.reading_progress * 100)}%`
        : undefined;
    case 'sync-published-date':
      return document.published_date || undefined;
    case 'sync-saved-at':
      return document.saved_at || undefined;
  }
};

/** Read which optional properties the user has enabled in settings. */
const getEnabledOptionalProperties = async (
  plugin: RNPlugin
): Promise<OptionalProperty[]> => {
  const enabled: OptionalProperty[] = [];
  for (const prop of optionalDocumentProperties) {
    if (await plugin.settings.getSetting<boolean>(prop.setting)) {
      enabled.push(prop);
    }
  }
  return enabled;
};

/** Deep link back into the Reader app for a given document/highlight id. */
const readerLink = (id: string) => `https://read.readwise.io/read/${id}`;

const tagNames = (tags: ReaderDocument['tags']): string[] =>
  tags ? Object.values(tags).map((t) => t.name) : [];

const findDocumentsParentRem = async (plugin: RNPlugin) => {
  return await plugin.rem.findByName([DOCUMENTS_PARENT_NAME], null);
};

const createDocumentsParentRem = async (plugin: RNPlugin) => {
  const r = await plugin.rem.createRem();
  await r?.setText([DOCUMENTS_PARENT_NAME]);
  await r?.setIsDocument(true);
  await r?.setPowerupProperty(BuiltInPowerupCodes.Document, 'Status', ['Pinned']);
  return r;
};

const findOrCreateHighlightsParentRem = async (plugin: RNPlugin, documentRem: Rem) => {
  let highlightsRem = await plugin.rem.findByName(['Highlights'], documentRem!._id);
  if (!highlightsRem) {
    highlightsRem = await plugin.rem.createRem();
    await highlightsRem?.setText(['Highlights']);
  }
  // Position 1 keeps Highlights below the Note node (position 0).
  await highlightsRem?.setParent(documentRem._id, 1);
  return highlightsRem;
};

/**
 * Render the document-level note as a "Note" node at the document root, next to
 * "Highlights" (the note text lives as its child).
 */
const setDocumentNote = async (plugin: RNPlugin, documentRem: Rem, noteText: string) => {
  let noteRem = await plugin.rem.findByName(['Note'], documentRem._id);
  if (!noteRem) {
    noteRem = await plugin.rem.createRem();
    await noteRem?.setText(['Note']);
  }
  if (!noteRem) return;
  await noteRem.setParent(documentRem._id, 0);
  const children = await noteRem.getChildrenRem();
  let contentRem: Rem | undefined = children[0];
  if (!contentRem) {
    contentRem = await plugin.rem.createRem();
    await contentRem?.setParent(noteRem._id);
  }
  // don't overwrite if the user edited the note in RemNote
  if (contentRem && (await plugin.richText.empty(contentRem.text || []))) {
    await contentRem.setText(await convertToRichTextArray(plugin, noteText));
  }
};

const findOrCreateTopLevelRem = async (plugin: RNPlugin, str: string) => {
  let rem = await plugin.rem.findByName([str], null);
  if (!rem) {
    rem = await plugin.rem.createRem();
    await rem?.setText([str]);
  }
  return rem;
};

const findOrCreateDocumentRem = async (
  plugin: RNPlugin,
  document: ReaderDocument,
  documentsParentRem: Rem,
  allDocumentsById: Record<string, Rem>,
  enabledOptionalProps: OptionalProperty[]
): Promise<Either<string, string>> => {
  return await plugin.app.transaction<() => Promise<Either<string, string>>>(async () => {
    let documentRem: Rem | undefined = allDocumentsById[document.id];
    if (!documentRem) {
      documentRem = await plugin.rem.createRem();
    }
    if (!documentRem) {
      return { success: false, error: `Failed to create the document rem for ${document.title}` };
    }
    if (
      document.title &&
      // don't overwrite if user edited
      (await plugin.richText.empty(documentRem.text || []))
    ) {
      documentRem.setText([document.title]);
    }
    await documentRem.addPowerup(powerups.document);
    await documentRem.setIsDocument(true);

    documentRem.setPowerupProperty(powerups.document, documentSlots.documentId, [document.id]);

    if (document.author) {
      documentRem.setPowerupProperty(powerups.document, documentSlots.author, [document.author]);
    }
    // Link back to the Reader app rather than the legacy readwise.io reader.
    addLinkAsSource(plugin, documentRem, readerLink(document.id));
    if (document.image_url) {
      documentRem.setPowerupProperty(
        powerups.document,
        documentSlots.image,
        await plugin.richText.image(document.image_url).value()
      );
    }
    if (document.category) {
      documentRem.setPowerupProperty(powerups.document, documentSlots.category, [document.category]);
    }
    if (document.summary) {
      documentRem.setPowerupProperty(powerups.document, documentSlots.summary, [document.summary]);
    }
    if (document.location) {
      documentRem.setPowerupProperty(powerups.document, documentSlots.location, [document.location]);
    }
    for (const tag of tagNames(document.tags)) {
      const tagRem = await findOrCreateTopLevelRem(plugin, tag);
      if (tagRem) {
        documentRem.addTag(tagRem);
      }
    }
    for (const prop of enabledOptionalProps) {
      const value = optionalPropertyValue(prop.setting, document);
      if (value) {
        documentRem.setPowerupProperty(powerups.document, prop.slot, [value]);
      }
    }
    await documentRem.setParent(documentsParentRem._id);
    return { success: true, data: documentRem._id };
  });
};

// TODO: doesn't parse bold/italic properly
export async function convertToRichTextArray(plugin: RNPlugin, text: string) {
  // Create a regex that matches substrings wrapped in two _ characters
  const highlightedStringRegex = /__(.*?)__/g;

  // Create an array to store the highlighted strings and non-highlighted strings
  let highlightedStringArray: RichTextInterface = [];

  // Loop through the input string, searching for highlighted substrings using the regex
  let match;
  let str = text;
  while ((match = highlightedStringRegex.exec(str)) !== null) {
    // Add the non-highlighted substring before the highlighted substring to the array
    const preMatchString = str.slice(0, match.index);
    if (preMatchString.length > 0) {
      highlightedStringArray.push(...(await plugin.richText.parseFromMarkdown(preMatchString)));
    }

    // Add the highlighted substring to the array as an object with the highlighted string as the value of the "highlightedString" property
    const matchString = match[1];
    if (matchString.length > 0) {
      const matchStringRichText = await plugin.richText.parseFromMarkdown(matchString);
      highlightedStringArray = highlightedStringArray.concat(
        await plugin.richText.applyTextFormatToRange(
          matchStringRichText,
          0,
          matchString.length,
          'Yellow'
        )
      );
    }

    // Remove the processed substrings from the input string
    str = str.slice(match.index + match[0].length);
  }

  // Add the remaining non-highlighted substring to the array
  highlightedStringArray.push(...(await plugin.richText.parseFromMarkdown(str)));

  return highlightedStringArray;
}

const findOrCreateHighlight = async (
  plugin: RNPlugin,
  highlight: ReaderDocument,
  documentRem: Rem,
  allHighlightsById: Record<string, Rem>
): Promise<Either<string, Rem>> => {
  let highlightRem: Rem | undefined = allHighlightsById[highlight.id];
  highlightRem = highlightRem ? highlightRem : await plugin.rem.createRem();
  if (!highlightRem) {
    return {
      success: false,
      error: 'Could not create highlight rem for document: ' + documentRem.text?.[0],
    };
  }
  const parent = await plugin.rem.findByName(['Highlights'], documentRem._id);
  if (!parent) {
    return {
      success: false,
      error: 'Could not find highlights parent for document: ' + documentRem.text?.[0],
    };
  }
  highlightRem.setParent(parent!._id);
  // For highlight documents the highlighted text lives in `content`.
  const highlightText = highlight.content || highlight.title || '';
  if (
    highlightText &&
    // don't overwrite if user edited
    (await plugin.richText.empty(highlightRem.text || []))
  ) {
    highlightRem.setText(await convertToRichTextArray(plugin, highlightText));
  }
  await highlightRem.addPowerup(powerups.highlight);
  highlightRem.setPowerupProperty(powerups.highlight, highlightSlots.highlightId, [highlight.id]);
  if (highlight.notes) {
    highlightRem.setPowerupProperty(powerups.highlight, highlightSlots.note, [highlight.notes]);
  }

  for (const tag of tagNames(highlight.tags)) {
    const tagRem = await findOrCreateTopLevelRem(plugin, tag);
    if (tagRem) {
      highlightRem.addTag(tagRem);
    }
  }
  addLinkAsSource(plugin, highlightRem, readerLink(highlight.id));
  return { success: true, data: highlightRem };
};

const findAllDocuments = async (plugin: RNPlugin) => {
  const documentPowerup = await plugin.powerup.getPowerupByCode(powerups.document);
  const allDocuments = (await documentPowerup?.taggedRem()) || [];
  const allDocumentsById = Object.fromEntries(
    (await Promise.all(
      allDocuments.map(async (d) => [
        await d.getPowerupProperty(powerups.document, documentSlots.documentId),
        d,
      ])
    )) as [string, Rem][]
  );
  return allDocumentsById;
};

const findAllHighlights = async (plugin: RNPlugin) => {
  const highlightPowerup = await plugin.powerup.getPowerupByCode(powerups.highlight);
  const allHighlights = (await highlightPowerup?.taggedRem()) || [];
  const allHighlightsByHighlightId = Object.fromEntries(
    (await Promise.all(
      allHighlights.map(async (h) => [
        await h.getPowerupProperty(powerups.highlight, highlightSlots.highlightId),
        h,
      ])
    )) as [string, Rem][]
  );
  return allHighlightsByHighlightId;
};

export const importDocumentsAndHighlights = async (
  plugin: RNPlugin,
  documents: GroupedDocument[],
  updateSyncProgressModal: (percentageDone: number) => Promise<void>,
  isUpdateSync: boolean // ie, is not first sync
): Promise<Either<string, number>> => {
  let readerParentRem = await findDocumentsParentRem(plugin);
  if (!readerParentRem && isUpdateSync) {
    const err = `Could not find or create the "${DOCUMENTS_PARENT_NAME}" Rem. Did you move or rename it?`;
    return { success: false, error: err };
  }
  readerParentRem = readerParentRem || (await createDocumentsParentRem(plugin));
  if (!readerParentRem) {
    const err = `Failed to create the "${DOCUMENTS_PARENT_NAME}" Rem.`;
    return { success: false, error: err };
  }

  const allDocumentsById = await findAllDocuments(plugin);
  const allHighlightsById = await findAllHighlights(plugin);
  const enabledOptionalProps = await getEnabledOptionalProperties(plugin);

  for (let i = 0; i < documents.length; i++) {
    const { document, highlights } = documents[i];
    const documentRemResult = await findOrCreateDocumentRem(
      plugin,
      document,
      readerParentRem,
      allDocumentsById,
      enabledOptionalProps
    );
    if (!documentRemResult.success) {
      return documentRemResult;
    }
    const documentRem = await plugin.rem.findOne(documentRemResult.data);
    if (!documentRem) {
      return {
        success: false,
        error: 'Could not findOne after create document rem for ' + document.title,
      };
    }
    if (document.notes && document.notes.trim()) {
      await setDocumentNote(plugin, documentRem, document.notes);
    }
    if (highlights.length > 0) {
      await findOrCreateHighlightsParentRem(plugin, documentRem);
      await Promise.all(
        highlights.map(async (highlight) => {
          const highlightResult = await findOrCreateHighlight(
            plugin,
            highlight,
            documentRem,
            allHighlightsById
          );
          if (!highlightResult.success) {
            log(plugin, 'Error creating highlight: ' + highlightResult.error, true);
          }
        })
      );
    }
    await updateSyncProgressModal(((i + 1) / documents.length) * 100);
  }

  return { success: true, data: documents.length };
};
