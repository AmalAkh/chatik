import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import User from 'App/Models/User'
import Hash from '@ioc:Adonis/Core/Hash'

export default class AuthController {
  // handle user registration
  public async register({ request, response }: HttpContextContract) {
    // expected payload type
    type UserPayload = {
      first_name: string
      last_name: string
      nickname: string
      email: string
      password: string
    }

    // pick only required fields from request
    const data = request.only([
      'first_name',
      'last_name',
      'nickname',
      'email',
      'password'
    ]) as UserPayload

    // hash plain password
    data.password = await Hash.make(data.password)

    // create user in DB
    const user = await User.create(data)

    // return created user info (safe subset)
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
