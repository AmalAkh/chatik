import { BaseModel, column, hasMany, HasMany, hasOne, HasOne } from '@ioc:Adonis/Lucid/Orm'
import ChannelMember from 'App/Models/ChannelMember'
import Message from './ChannelMessage'

export default class Channel extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public name: string

  @column()
  public is_private: boolean

  @column()
  public owner_id: number

  @hasOne(() => Message, {
    foreignKey: 'channelId',
    onQuery: q => q.orderBy('id', 'desc'),
  })
  public lastMessage: HasOne<typeof Message>

  @hasMany(() => ChannelMember)
  public members: HasMany<typeof ChannelMember>
}
