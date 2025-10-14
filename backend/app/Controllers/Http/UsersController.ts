import User from 'App/Models/User'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class UsersController {
  public async byNickname({ params }: HttpContextContract) {
    const user = await User.query().where('nickname', params.nickname).firstOrFail()
    return { id: user.id, nickname: user.nickname, email: user.email }
  }
}