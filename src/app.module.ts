import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ChatModule } from './chat/chat.module';
import { RedisModule } from './redis/redis.module';
import { MatchmakingService } from './matchmaking/matchmaking.service';
import { MatchmakingModule } from './matchmaking/matchmaking.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    ChatModule,
    RedisModule,
    MatchmakingModule,
  ],
  providers: [MatchmakingService],
})
export class AppModule {}