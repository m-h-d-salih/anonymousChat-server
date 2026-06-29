import { Injectable,OnModuleInit,OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService extends Redis implements OnModuleInit,OnModuleDestroy {
    constructor(config:ConfigService){
        super({
           host: config.get<string>('REDIS_HOST') || 'localhost',
            port: parseInt(config.get<string>('REDIS_PORT') || '6379'),
        });
    }
    async onModuleInit() {
        this.on('connect',()=>console.log(`Redis connected`))
        this.on(`error`,(err)=>console.log(`Redis error: ${err}`))
    }
    async onModuleDestroy() {
        await this.quit();
    }
}
