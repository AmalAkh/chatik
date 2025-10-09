import { BaseModel, column, hasMany, HasMany } from '@ioc:Adonis/Lucid/Orm'
import ChannelMember from 'App/Models/ChannelMember'
import Message from './ChannelMessage'

export default class Channel extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public name: string

  @column()
  public isPrivate: boolean

  @column()
  public ownerId: number

  @hasMany(() => Message, {
    onQuery: (query) => query.orderBy('id', "desc").limit(1),
  })
  public lastMessage: HasMany<typeof Message>

  @hasMany(() => ChannelMember)
  public members: HasMany<typeof ChannelMember>
}
