import { redis } from "googleapis/build/src/apis/redis";
import Redis from "ioredis";

class RedisClientSingleton {
  private static instance: Redis;

  private constructor() {} // prevent direct construction

  public static getInstance():Redis {
    if (!RedisClientSingleton.instance) {
      RedisClientSingleton.instance = new Redis({
        host: "127.0.0.1",
        port: 6379,
        // password: 'your-password', // if needed
        // db: 0
      });
    }
    return RedisClientSingleton.instance;
  }
}

const redisClient = RedisClientSingleton.getInstance();
export default redisClient;
