import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'push_subscriptions'

  public async up () {
    this.schema.alterTable(this.tableName, (table) => {
      table.unique(['end_point']) // Add unique constraint to existing column
    })
  }

  public async down () {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropUnique(["end_point"]) // Add unique constraint to existing column
    })
  }
}
