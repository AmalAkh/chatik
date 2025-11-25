import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'

export default class ChannelBan extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public channelId: number

  @column()
  public userId: number

  @column()
  public votes: number

  @column()
  public permanent: boolean
}
