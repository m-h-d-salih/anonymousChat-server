import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class MatchmakingService {
  private readonly QUEUE_KEY = 'matchmaking:queue';

  constructor(private redis: RedisService) {}

  async joinQueue(userId: string): Promise<void> {
    const score = Date.now();
    await this.redis.zadd(this.QUEUE_KEY, score, userId);
  }

  async leaveQueue(userId: string): Promise<void> {
    await this.redis.zrem(this.QUEUE_KEY, userId);
  }

  async tryMatch(): Promise<[string, string] | null> {
    const result = await this.redis.zpopmin(this.QUEUE_KEY, 2);

    // zpopmin returns [member1, score1, member2, score2]
    if (result.length < 4) {
      // Less than 2 users in queue — put back if one was popped
      if (result.length === 2) {
        await this.redis.zadd(this.QUEUE_KEY, Number(result[1]), result[0]);
      }
      return null;
    }

    return [result[0], result[2]];
  }

  async isInQueue(userId: string): Promise<boolean> {
    const score = await this.redis.zscore(this.QUEUE_KEY, userId);
    return score !== null;
  }
}