import { BaseModel, column, hasMany } from '@ioc:Adonis/Lucid/Orm'
import { DateTime } from 'luxon'
import { HasMany } from '@ioc:Adonis/Lucid/Orm'
import ApiToken from 'App/Models/ApiToken'

export default class User extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public first_name: string

  @column()
  public last_name: string

  @column()
  public nickname: string

  @column()
  public email: string

  @column()
  public password: string

  @column()
  public status: 'online' | 'dnd' | 'offline'

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @hasMany(() => ApiToken)
  public tokens: HasMany<typeof ApiToken>
}
