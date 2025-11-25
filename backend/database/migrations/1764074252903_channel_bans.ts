import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class ChannelBans extends BaseSchema {
  protected tableName = 'channel_bans'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('channel_id').unsigned().references('id').inTable('channels').onDelete('CASCADE')
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE')

      table.integer('votes').defaultTo(0)
      table.boolean('permanent').defaultTo(false)

      table.timestamps(true)
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
