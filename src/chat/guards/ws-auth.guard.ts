import { CanActivate,ExecutionContext,Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { WsException } from "@nestjs/websockets";
import { PrismaService } from "src/prisma/prisma.service";
import { Socket } from "socket.io";

@Injectable()
export class WsAuthGuard implements CanActivate{
    constructor(
        private jwt:JwtService,
        private prisma:PrismaService
    ) {}
    async canActivate(context: ExecutionContext):  Promise<boolean>{
        const client:Socket=context.switchToWs().getClient();
        const token=client.handshake.auth?.token;
console.log('WS Guard - token received:', token ? 'yes' : 'no');
        if(!token){
            throw new WsException('No token provided');
        }

        try {
            const payload=this.jwt.verify(token);
            const user=await this.prisma.user.findUnique({
                where:{id:payload.sub}
            })
              if (!user || user.isBanned) {
        throw new WsException('Unauthorized');
      }
      const {password,...safe}=user;
      client.data.user = safe;
      return true
        } catch (error) {
             throw new WsException('Invalid token');
        }
    }
}
