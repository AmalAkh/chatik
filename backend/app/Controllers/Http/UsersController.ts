import User from 'App/Models/User'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Ws from 'App/Services/Ws'

export default class UsersController {
  public async byNickname({ params }: HttpContextContract) {
    const user = await User.query().where('nickname', params.nickname).firstOrFail()
    return { id: user.id, nickname: user.nickname, email: user.email }
  }
  public async myNickname({ auth }: HttpContextContract) {
    const user = auth.user!
    return user.nickname;
  }
  public async updateStatus({ auth, request, response }: HttpContextContract) {
    const user = auth.user!
    const status = request.input('status')

    if (!['online', 'dnd', 'offline'].includes(status)) {
      return response.badRequest({ message: 'Invalid status' + request.input('status') })
    }

    user.status = status
    await user.save()

    Ws.io.emit('user_status_changed', {
      userId: user.id,
      status: user.status,
    })

    return response.ok({ message: 'Status updated', status: user.status })
  }
}
