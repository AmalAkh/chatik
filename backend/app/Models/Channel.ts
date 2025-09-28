import { BaseModel, column, hasMany, HasMany } from '@ioc:Adonis/Lucid/Orm'
import ChannelMember from 'App/Models/ChannelMember'

export default class Channel extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public name: string

  @column()
  public isPrivate: boolean

  @column()
  public ownerId: number

  @hasMany(() => ChannelMember)
  public members: HasMany<typeof ChannelMember>
}
