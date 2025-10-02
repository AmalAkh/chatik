import { BaseModel, column, hasMany, HasMany, HasOne } from '@ioc:Adonis/Lucid/Orm'
import ChannelMember from 'App/Models/ChannelMember'
import Channel from './Channel'
import { DateTime } from 'luxon'
import User from './User'

export default class Message extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public text: string

  @column()
  public date:DateTime
  @column()
  public channelId:number
  @column()
  public userId:number

  @column()
  public sender: HasOne<typeof User>

  @column()
  public channel: HasOne<typeof Channel>


  
}
