import { WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket
 } from "@nestjs/websockets";

 import { Server,Socket } from "socket.io";
import { WsCurrentUser } from "./decorators/ws-current-user.decorator";
import { UseGuards } from "@nestjs/common";
import { WsAuthGuard } from "./guards/ws-auth.guard";
import { MatchmakingService } from "src/matchmaking/matchmaking.service";
import { v4 as uuidv4 } from 'uuid';

 @WebSocketGateway({
  cors:{origin:'*'}
 })
 export class ChatGateway implements OnGatewayConnection,OnGatewayDisconnect{
  @WebSocketServer()
  server!:Server; //  ! = definite assignment assertion means "trust me, this will be assigned before it's used."

  // Track which user is on which socket, and which room they're in
  private userSockets=new Map<string,Socket>();
  private userRooms=new Map<string,string>();

  constructor(private matchmaking:MatchmakingService){}

   // Called automatically when a client connects
  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`)
  }

    // Called automatically when a client disconnects
  async handleDisconnect(client: Socket) {
    const user=client.data.user;
    if(!user) return;
    console.log(`${user.displayName} disconnected`);

    await this.matchmaking.leaveQueue(user.id);
    const roomId=this.userRooms.get(user.id);
    if(roomId){
      client.to(roomId).emit('strangerDisconnected');
      this.userRooms.delete(user.id)
    }
    this.userSockets.delete(user.id);
  }

  // Client sends "joinRoom" event → we put them in the room
  /*
  @ConnectedSocket()  →  "Nest, fill this parameter with the connected socket"
  client              →  "I'll refer to it as 'client' in my code"  
  : Socket            →  "TypeScript, it should have .join(), .to(), .emit(), .id, etc."
  */
 @UseGuards(WsAuthGuard)
  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @ConnectedSocket() client:Socket,
    @MessageBody() roomId:string,
    @WsCurrentUser() user:any
  ){
    client.join(roomId)
    console.log(`Client ${user.displayName} joined room ${roomId}`);

    // Notify others in the room
    client.to(roomId).emit('userJoined',{userId:client.id,displayName:user.displayName})

    return {event:'joinedRoom',data:roomId}
  }

  @UseGuards(WsAuthGuard)
  @SubscribeMessage('findStranger')
  async handleFindStranger(
    @ConnectedSocket() client:Socket,
    @WsCurrentUser() user:any,
  ){
    // Store the socket reference so we can reach this user later
    this.userSockets.set(user.id,client);
    // Check if already in queue
    const alreadyQueue=await this.matchmaking.isInQueue(user.id);
    if(alreadyQueue){
      return {event:'error',data:'Already searching'};
    }

     // Add to queue
     await this.matchmaking.joinQueue(user.id);
     console.log(`${user.displayName} is searching for a stranger...`)
      // Try to find a match
    const match = await this.matchmaking.tryMatch();
    if (!match) {
      // No match yet — user stays in queue, waiting
      return { event: 'searching', data: 'Waiting for a stranger...' };
    }
    // Match found!
       const [userId1, userId2] = match;
       const roomId=uuidv4();

       const socket1=this.userSockets.get(userId1)
       const socket2=this.userSockets.get(userId2)
          if (!socket1 || !socket2) {
      // One of them disconnected between queue and match — put the other back
      if (socket1) await this.matchmaking.joinQueue(userId1);
      if (socket2) await this.matchmaking.joinQueue(userId2);
      return;
    }
     // Both join the room
    socket1.join(roomId);
    socket2.join(roomId);

    this.userRooms.set(userId1,roomId);
    this.userRooms.set(userId2,roomId);

    // Notify both users
    socket1.emit('matched', { roomId });
    socket2.emit('matched', { roomId });

     console.log(`Matched! ${userId1} + ${userId2} in room ${roomId}`);
  }

  // Client sends "sendMessage" event → we forward to the room
  @UseGuards(WsAuthGuard)
  @SubscribeMessage('sendMessage')
  handleMessage(
    @ConnectedSocket()
     client:Socket,
    @MessageBody() payload:{message:string},
    @WsCurrentUser() user: any,
  ){
      const roomId = this.userRooms.get(user.id);
    if (!roomId) return;

      client.to(roomId).emit('newMessage', {
      senderId: user.id,
      displayName: user.displayName,
      message: payload.message,
      timestamp: new Date().toISOString(),
    });
  }

  @UseGuards(WsAuthGuard)
  @SubscribeMessage('leaveChat')
  async handleLeaveChat(
 @ConnectedSocket() client:Socket,
 @WsCurrentUser() user:any
  ){
    const roomId=this.userRooms.get(user.id);
    if(!roomId) return;

    client.to(roomId).emit('strangerDisconnected');
    client.leave(roomId);
    this.userRooms.delete(user.id);
     console.log(`${user.displayName} left room ${roomId}`);
  }
 }