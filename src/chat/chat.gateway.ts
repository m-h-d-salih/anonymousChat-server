import { WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket
 } from "@nestjs/websockets";

 import { Server,Socket } from "socket.io";

 @WebSocketGateway({
  cors:{origin:'*'}
 })
 export class ChatGateway implements OnGatewayConnection,OnGatewayDisconnect{
  @WebSocketServer()
  server!:Server; //  ! = definite assignment assertion means "trust me, this will be assigned before it's used."

   // Called automatically when a client connects
  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`)
  }

    // Called automatically when a client disconnects
  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  // Client sends "joinRoom" event → we put them in the room
  /*
  @ConnectedSocket()  →  "Nest, fill this parameter with the connected socket"
  client              →  "I'll refer to it as 'client' in my code"  
  : Socket            →  "TypeScript, it should have .join(), .to(), .emit(), .id, etc."
  */
  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @ConnectedSocket() client:Socket,
    @MessageBody() roomId:string
  ){
    client.join(roomId)
    console.log(`Client ${client.id} joined room ${roomId}`);

    // Notify others in the room
    client.to(roomId).emit('userJoined',{userId:client.id})

    return {event:'joinedRoom',data:roomId}
  }

  // Client sends "sendMessage" event → we forward to the room
  @SubscribeMessage('sendMessage')
  handleMessage(
    @ConnectedSocket()
     client:
     Socket,
    @MessageBody() payload:{roomId:string;message:string}
  ){
     console.log(`Message in ${payload.roomId}: ${payload.message}`);

     client.to(payload.roomId).emit('new message',{
      sender:client.id,
      message:payload.message,
       timestamp: new Date().toISOString(),
     })
  }
 }