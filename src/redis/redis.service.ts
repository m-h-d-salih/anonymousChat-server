import { Injectable,OnModuleInit,OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService extends Redis implements OnModuleInit,OnModuleDestroy {
    constructor(){
        super({
            host:'localhost',
            port:6379
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
