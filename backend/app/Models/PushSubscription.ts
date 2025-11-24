import { BaseModel, column,HasOne, hasOne } from '@ioc:Adonis/Lucid/Orm'


import User from './User'

export default class PushSubscription extends BaseModel {
    @column()
    public userId:number

    @column({ isPrimary: true })
    public id:number

    @hasOne(() => User, 
    {
        foreignKey:"id",
        localKey:"userId"
    })
    public sender: HasOne<typeof User>

    @column()
    public endPoint:string

    @column()
    public p256dh:string

    @column()
    public auth:string



  
}
