import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'channel_bans'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('permanent')
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.boolean('permanent').defaultTo(false)
    })
  }
}
