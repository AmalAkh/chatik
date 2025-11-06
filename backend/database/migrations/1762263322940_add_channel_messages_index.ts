import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class AddChannelMessagesIndex extends BaseSchema {
  protected tableName = 'messages'

  public async up () {
    this.schema.alterTable(this.tableName, (table) => {
      table.index(['channel_id', 'date'], 'channel_messages_channel_id_created_at_index')
    })
  }

  public async down () {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropIndex(['channel_id', 'date'], 'channel_messages_channel_id_created_at_index')
    })
  }
}
