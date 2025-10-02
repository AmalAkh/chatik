import Ws from 'App/Services/Ws'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import auth from 'Config/auth';
import User from 'App/Models/User';
import User from 'App/Models/ApiKey';
import ApiToken from 'App/Models/ApiToken';
import HttpContext from '@ioc:Adonis/Core/HttpContext'
import AuthManager from '@ioc:Adonis/Addons/Auth';
import { AuthenticationException } from '@adonisjs/auth/build/standalone';
import ChannelMember from 'App/Models/ChannelMember';



class SocketIOData
{
    user:User
    public constructor(user:User)
    {
        this.user = user;
    }
}

Ws.boot()

/**
 * Listen for incoming socket connections
 */
Ws.io.use(async (socket, next) => {
    
    try
    {
        const ctx = HttpContext.create('/', {}, socket.request)

        // Use the API guard to authenticate
        const auth = AuthManager.getAuthForRequest(ctx as any)
        const user = await auth.use('api').authenticate();
        socket.data = new SocketIOData(user);

        let memberShips =  await ChannelMember.query().where('user_id', user.id);

        for(let memberShip of memberShips)
        {
            socket.join(memberShip.channelId.toString());
        }

        next();
    }catch(error:unknown)
    {
        
        if (error instanceof AuthenticationException)
        {
            console.log("Auth failed");
            socket.emit("error", { message: "Authentication failed" }); 
            
            next(error);
            return;
        }
        return;
    }
 
    
  
});
Ws.io.on('connection', (socket) => {
    console.log("new connection");

    
    socket.on("new_message", (msg)=>
    {
        socket.to(msg.channelId).emit("new_message", msg);
       
    })
})
