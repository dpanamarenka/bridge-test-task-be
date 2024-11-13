import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WebsocketsService } from './websockets.service';

@Module({
  imports: [ConfigModule.forRoot()],
  controllers: [AppController],
  providers: [WebsocketsService, AppService],
})
export class AppModule {}
