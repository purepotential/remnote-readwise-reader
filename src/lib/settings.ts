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
