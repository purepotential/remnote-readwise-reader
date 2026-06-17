import { RNPlugin } from '@remnote/plugin-sdk';
import { powerups, documentSlots, highlightSlots } from './consts';

async function registerDocumentPowerup(plugin: RNPlugin) {
  await plugin.app.registerPowerup({
    name: 'Readwise Document',
    code: powerups.document,
    description: 'Represents a document from Readwise Reader',
    options: {
      slots: [
        {
          code: documentSlots.documentId,
          name: 'Document ID',
          hidden: true,
        },
        {
          code: documentSlots.author,
          name: 'Author',
        },
        {
          code: documentSlots.image,
          name: 'Image',
        },
        {
          code: documentSlots.category,
          name: 'Category',
        },
        {
          code: documentSlots.summary,
          name: 'Summary',
        },
        {
          code: documentSlots.location,
          name: 'Location',
        },
        {
          code: documentSlots.tags,
          name: 'Tags',
        },
      ],
    },
  });
}

async function registerHighlightPowerup(plugin: RNPlugin) {
  await plugin.app.registerPowerup({
    name: 'Readwise Highlight',
    code: powerups.highlight,
    description: 'Represents a highlight from Readwise Reader',
    options: {
      slots: [
        {
          code: highlightSlots.highlightId,
          name: 'Highlight ID',
          hidden: true,
        },
        {
          code: highlightSlots.tags,
          name: 'Tags',
        },
        {
          code: highlightSlots.note,
          name: 'Note',
        },
      ],
    },
  });
}

export async function registerPowerups(plugin: RNPlugin) {
  await registerDocumentPowerup(plugin);
  await registerHighlightPowerup(plugin);
}
