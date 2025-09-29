import { DateTime } from 'luxon'
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'

export default class ApiToken extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public name: string

  @column()
  public userId: number

  @column()
  public type: string

  @column()
  public token: string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime
}
