import Route from '@ioc:Adonis/Core/Route'

Route.group(() => {
  Route.post('register', 'AuthController.register')
  Route.post('login', 'AuthController.login')
}).prefix('/auth')

Route.group(() => {
  Route.get('/', 'ChannelsController.index')
  Route.post('/', 'ChannelsController.create')
  Route.post('/:channelId/add-member', 'ChannelsController.addMember')
  Route.post('/:channelId/remove-member', 'ChannelsController.removeMember')
}).prefix('/channels').middleware('auth')
