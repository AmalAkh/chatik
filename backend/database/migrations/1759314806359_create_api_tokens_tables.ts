import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'api_tokens'

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      /**
       * Uses timestamptz for PostgreSQL and DATETIME2 for MSSQL
       */
      table.timestamp('created_at', { useTz: true })
      table.timestamp('expires_at', { useTz: true })

      table.string('name')
      table.string('token').notNullable()
      table.string('type')



      table.integer("user_id").unsigned().notNullable()



    })
  }

  public async down () {
    this.schema.dropTable(this.tableName)
  }
}
