import Route from '@ioc:Adonis/Core/Route'

Route.group(() => {
  Route.post('register', 'AuthController.register')
  Route.post('login', 'AuthController.login')
}).prefix('/auth')

Route.group(() => {
  Route.get('/', 'ChannelsController.index')
  Route.post('/', 'ChannelsController.create')
  Route.post('/:channelId/invite', 'ChannelsController.invite')
  Route.post('/:channelId/kick', 'ChannelsController.kick')
  Route.get('/:channelId/', 'ChannelsController.show')
  Route.delete('/:channelId/', 'ChannelsController.destroy')
  
}).prefix('/channels').middleware('auth')

Route.group(() => {
  Route.get('/:channelId', 'MessagesController.index')
  Route.post('/:channelId/', 'MessagesController.create')
  
}).prefix('/messages').middleware('auth')

Route.get('/users/by-nickname/:nickname', 'UsersController.byNickname').middleware('auth')
