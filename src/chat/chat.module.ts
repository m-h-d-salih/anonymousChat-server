import { Module } from '@nestjs/common';
import {PrismaModule} from '../prisma/prisma.module'
import { ChatGateway } from './chat.gateway';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WsAuthGuard } from './guards/ws-auth.guard';

@Module({
  imports:[
    PrismaModule,
    JwtModule.registerAsync({
      imports:[ConfigModule],
      inject:[ConfigService],
      useFactory:(config:ConfigService)=>({
        secret:config.get<string>('JWT_SECRET'),
        signOptions:{expiresIn:config.get<string>('JWT_EXPIRES_IN') as any},
      }),
    }),
  ],
  providers: [ChatGateway,WsAuthGuard]
})
export class ChatModule {}
