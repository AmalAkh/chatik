import Ws from 'App/Services/Ws'
import User from 'App/Models/User';
import HttpContext from '@ioc:Adonis/Core/HttpContext'
import AuthManager from '@ioc:Adonis/Addons/Auth';
import ChannelMember from 'App/Models/ChannelMember';



class SocketIOData {
  user: User
  public constructor(user: User) {
    this.user = user;
  }
}

Ws.boot()



/**
 * Listen for incoming socket connections
 */
Ws.io.use(async (socket, next) => {
  try {
    const ctx = HttpContext.create('/', {}, socket.request)
    const auth = AuthManager.getAuthForRequest(ctx as any)
    const user = await auth.use('api').authenticate()

    socket.data = new SocketIOData(user)
    socket.join(`user:${user.id}`)

    const memberships = await ChannelMember.query().where('user_id', user.id)
    for (const m of memberships) {
      socket.join(`channel:${m.channelId}`)
    }

    next()
  } catch (error) {
    next(error)
  }
})

Ws.io.on('connection', async (socket) => {
  const user = socket.data.user
  if (!user) return

  await User.query().where('id', user.id).update({ status: 'online' })
  Ws.io.emit('user_status_changed', { userId: user.id, status: 'online' })

  socket.on('disconnect', async () => {
    await User.query().where('id', user.id).update({ status: 'offline' })
    Ws.io.emit('user_status_changed', { userId: user.id, status: 'offline' })
  })

  socket.on('new_message', async (msg) => {
    const members = await ChannelMember
      .query()
      .where('channel_id', msg.channelId)
      .preload('user')

    for (const member of members) {
      const targetUser = member.user
      if (!targetUser) continue
      if (targetUser.status === 'offline') continue
      if (targetUser.id !== user.id) {
        Ws.io.to(`user:${targetUser.id}`).emit('new_message', msg)
      }
    }
  })
  socket.on("typing", async (msg:{channelId:number, text:string})=>
  {
    const members = await ChannelMember
      .query()
      .where('channel_id', msg.channelId)
      .preload('user')

    for (const member of members) {
      const targetUser = member.user
      if (!targetUser) continue
      if (targetUser.status === 'offline') continue
      if (targetUser.id !== user.id) {
        Ws.io.to(`user:${targetUser.id}`).emit('typing', {...msg, user:{nickname:user.nickname}})
        
      }
    }
  })
})

