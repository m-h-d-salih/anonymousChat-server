import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { validateEnv } from './config/env.validation';

async function bootstrap() {
   validateEnv();
   const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

    process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Rejection:', reason);
  });

  // Catch unhandled errors so the app doesn't crash
  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
  });

  await app.listen(3000);
}
bootstrap();
