import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import User from 'App/Models/User'
import Hash from '@ioc:Adonis/Core/Hash'

export default class AuthController {
  public async register ({ request, response }: HttpContextContract) {
    type UserPayload = {
        first_name: string
        last_name: string
        nickname: string
        email: string
        password: string
    }

    const data = request.only([
      'first_name',
      'last_name',
      'nickname',
      'email',
      'password'
    ]) as UserPayload

    // hash password
    data.password = await Hash.make(data.password)

    // create user
    const user = await User.create(data)

    return response.created({
      message: 'User registered successfully',
      user: {
        id: user.id,
        nickname: user.nickname,
        email: user.email
      }
    })
  }
  
  public async login ({ request, response }: HttpContextContract) {
    const { email, password } = request.only(['email', 'password'])

    const user = await User.findBy('email', email)

    if (!user) {
        return response.unauthorized({ message: 'Invalid credentials' })
    }

    const isValid = await Hash.verify(user.password, password)
    if (!isValid) {
        return response.unauthorized({ message: 'Invalid credentials' })
    }

    return response.ok({
        message: 'Login successful',
        user: {
          id: user.id,
          nickname: user.nickname,
          email: user.email,
        },
    })
  }
}
