import type {DocumentPluginOptions} from 'sanity'
import type {StructureResolver} from 'sanity/structure'
import {topicSettingsId} from '../../utils/topics'

export const topicStructure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items([
      S.listItem()
        .id(topicSettingsId)
        .title('Topics')
        .child(
          S.document()
            .schemaType(topicSettingsId)
            .documentId(topicSettingsId)
            .initialValueTemplate(topicSettingsId),
        ),
      ...S.documentTypeListItems().filter((item) => item.getId() !== topicSettingsId),
    ])

export const topicDocumentOptions: DocumentPluginOptions = {
  newDocumentOptions: (options) =>
    options.filter(({templateId}) => templateId !== topicSettingsId),
  actions: (actions, {schemaType}) =>
    schemaType === topicSettingsId
      ? actions.filter(({action}) => action && ['publish', 'discardChanges', 'restore'].includes(action))
      : actions,
}
