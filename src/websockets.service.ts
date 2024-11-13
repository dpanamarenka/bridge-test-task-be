import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { Event, Message } from './constants';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class WebsocketsService {
  @WebSocketServer() server: Server;

  afterInit() {
    console.log('WebSockets started');
  }

  sendMessage(event: Event, message: Message) {
    this.server.emit(event, message);
  }
}
