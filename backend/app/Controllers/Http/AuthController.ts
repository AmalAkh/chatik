import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import User from 'App/Models/User'
import Hash from '@ioc:Adonis/Core/Hash'

export default class AuthController {
  // handle user registration
  public async register({ request, response }: HttpContextContract) {
    const data = request.only([
      'first_name',
      'last_name',
      'nickname',
      'email',
      'password'
    ])

    // check if nickname exists
    const existingNickname = await User.findBy('nickname', data.nickname)
    if (existingNickname) {
      return response.badRequest({
        message: 'This nickname is already taken'
      })
    }

    // check if email exists
    const existingEmail = await User.findBy('email', data.email)
    if (existingEmail) {
      return response.badRequest({
        message: 'This email is already registered'
      })
    }

    // hash password
    data.password = await Hash.make(data.password)

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


  // handle user login
  public async login({ request, response, auth }: HttpContextContract) {
    // extract login credentials
    const { email, password } = request.only(['email', 'password'])

    // find user by email
    const user = await User.findBy('email', email)

    // if no user found
    if (!user) {
      return response.unauthorized({ message: 'Invalid credentials' })
    }

    // verify password hash
    const isValid = await Hash.verify(user.password, password)
    if (!isValid) {
      return response.unauthorized({ message: 'Invalid credentials' })
    }

    const token = await auth.use('api').login(user, {
      expiresIn: '7days'
    })

    // login successful
    return response.ok({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        nickname: user.nickname,
        email: user.email,
      },
    })
  }
}
