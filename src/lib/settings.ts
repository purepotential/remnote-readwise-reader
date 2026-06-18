import { RNPlugin } from '@remnote/plugin-sdk';
import { optionalDocumentProperties, settings } from './consts';

export const registerSettings = async (plugin: RNPlugin) => {
  await plugin.settings.registerStringSetting({
    id: settings.apiKey,
    title: 'Readwise API Key',
    defaultValue: '',
    description:
      'Paste your Readwise API key here. Follow the instructions here if you do not have a key: https://www.readwise.io/access_token',
  });

  // Sync locations. The Library (Inbox + Later + Shortlist) is always synced;
  // these toggles add Feed and Archive on top.
  await plugin.settings.registerBooleanSetting({
    id: settings.syncFeed,
    title: 'Sync Feed',
    defaultValue: false,
    description: 'Also sync documents in your Reader Feed (RSS), not just your Library.',
  });
  await plugin.settings.registerBooleanSetting({
    id: settings.syncArchive,
    title: 'Sync Archive',
    defaultValue: false,
    description: 'Also sync archived documents, not just your active Library.',
  });

  // Optional document properties. Off by default - the always-synced set (title,
  // author, image, category, summary, location, tags) is unaffected by these.
  for (const prop of optionalDocumentProperties) {
    await plugin.settings.registerBooleanSetting({
      id: prop.setting,
      title: `Sync "${prop.name}"`,
      defaultValue: false,
      description: prop.description,
    });
  }
};
