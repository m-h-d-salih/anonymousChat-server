import { SubscribeMessage, WebSocketGateway,WebSocketServer,
  MessageBody,
  ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WsAuthGuard } from '../chat/guards/ws-auth.guard';
import { WsCurrentUser } from '../chat/decorators/ws-current-user.decorator';
import { ContactChatService } from './contact-chat.service';
import { UseGuards } from '@nestjs/common';

@WebSocketGateway({
  cors: { origin: '*' },
})
export class ContactChatGateway {
   @WebSocketServer()
  server!: Server;
  private userSockets=new Map<string,Socket>();
  
  constructor(private contactChat:ContactChatService){}

  @UseGuards(WsAuthGuard)
   @SubscribeMessage('registerUser')
     handleRegister(
    @ConnectedSocket() client: Socket,
    @WsCurrentUser() user: any,
  ){
     this.userSockets.set(user.id, client);
    console.log(`${user.displayName} registered for contact messaging`);
    return { event: 'registered', data: 'Ready for contact messaging' };
  }

   @UseGuards(WsAuthGuard)
  @SubscribeMessage('getContacts')
    async handleGetContacts(
    @WsCurrentUser() user: any,
  ) {
    const contacts = await this.contactChat.getContacts(user.id);
    return { event: 'contactsList', data: contacts };
  }

  @UseGuards(WsAuthGuard)
  @SubscribeMessage('openContactChat')
  async handleOpenChat(
    @ConnectedSocket() client:Socket,
    @MessageBody() contactId:string,
    @WsCurrentUser() user:any,
  ){
    client.join(`contact:${contactId}`);
    const messages=await this.contactChat.getMessages(user.id,contactId);
    return {event:'chatHistory',data:{contactId,messages}};
  }

  @UseGuards(WsAuthGuard)
  @SubscribeMessage('loadMoreMessages')
  async handleLoadMore(
    @MessageBody() payload:{contactId:string,cursor:string},
     @WsCurrentUser() user: any,
  ){
    const messages=await this.contactChat.getMessages(
      user.id,
      payload.contactId,
      payload.cursor,
    )
    return { event: 'olderMessages', data: { contactId: payload.contactId, messages } };
  }

    @UseGuards(WsAuthGuard)
  @SubscribeMessage('sendContactMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { contactId: string; message: string },
    @WsCurrentUser() user: any,
  ){
     const saved = await this.contactChat.saveMessage(
      user.id,
      payload.contactId,
      payload.message,
    );

    client.to(`contact:${payload.contactId}`).emit('newContactMessage',{
      contactId:payload.contactId,
      message:saved,
    })

     // If the other user is online but hasn't opened this chat, notify them
     const otherUserId=await this.contactChat.getOtherUserId(payload.contactId,user.id);
     if(otherUserId){
      const otherSocket=this.userSockets.get(otherUserId);
      if (otherSocket && !otherSocket.rooms.has(`contact:${payload.contactId}`)){
        otherSocket.emit('newMessageNotification', {
          contactId: payload.contactId,
          from: user.displayName,
          preview: payload.message.substring(0, 50),
        })
      }
     }
      return { event: 'messageSent', data: saved };
  }
  
}
