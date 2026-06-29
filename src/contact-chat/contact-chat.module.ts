import { Module } from '@nestjs/common';
import { ContactChatGateway } from './contact-chat.gateway';
import { ContactChatService } from './contact-chat.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WsAuthGuard } from 'src/chat/guards/ws-auth.guard';

@Module({
  imports:[
    PrismaModule,
      JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRES_IN') as any },
      }),
    }),
  ],

  providers: [ContactChatGateway, ContactChatService, WsAuthGuard],
})
export class ContactChatModule {}
