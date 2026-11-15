import {defineField, defineType} from 'sanity'
import {defaultTopics, topicSettingsId} from '../../utils/topics'

export default defineType({
  name: topicSettingsId,
  title: 'Topics',
  type: 'document',
  initialValue: {names: defaultTopics},
  fields: [
    defineField({
      name: 'names',
      title: 'Topics',
      description: 'Add or remove topics, then publish to update the site.',
      type: 'array',
      of: [{type: 'string'}],
      validation: (rule) =>
        rule.custom((names) => {
          const topics = (names as string[] | undefined) ?? []
          if (topics.some((name) => !name.trim() || name !== name.trim() || name.length > 60)) {
            return 'Use topic names of 1–60 characters with no leading or trailing spaces.'
          }
          if (new Set(topics.map((name) => name.toLowerCase())).size !== topics.length) {
            return 'Topic names must be unique.'
          }
          return true
        }),
    }),
  ],
  preview: {prepare: () => ({title: 'Topics'})},
})
