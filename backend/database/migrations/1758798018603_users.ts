import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class Users extends BaseSchema {
  // table name for this migration
  protected tableName = 'users'

  // run when applying migration
  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id') // auto-increment primary key
      table.string('first_name').notNullable() // user's first name
      table.string('last_name').notNullable() // user's last name
      table.string('nickname').unique().notNullable() // unique nickname
      table.string('email').unique().notNullable() // unique email
      table.string('password').notNullable() // hashed password
      table.timestamps(true) // created_at & updated_at
    })
  }

  // run when rolling back migration
  public async down () {
    this.schema.dropTable(this.tableName) // drop users table
  }
}
