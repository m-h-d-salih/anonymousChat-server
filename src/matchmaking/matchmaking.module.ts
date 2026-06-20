import { Module } from '@nestjs/common';
import { RedisModule } from '../redis/redis.module';
import { MatchmakingService } from './matchmaking.service';

@Module({
  imports: [RedisModule],
  providers: [MatchmakingService],
  exports: [MatchmakingService],
})
export class MatchmakingModule {}