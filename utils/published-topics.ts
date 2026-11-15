import { defaultTopics, topicSettingsId } from './topics';
import { client } from './client';

export async function getPublishedTopics() {
  const settings = await client.fetch<{ names?: string[] } | null>(
    '*[_id == $id && _type == $type][0]{names}',
    { id: topicSettingsId, type: topicSettingsId },
  );
  return settings ? settings.names ?? [] : defaultTopics;
}
