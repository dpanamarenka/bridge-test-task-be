import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

export const BRIDGE_EVENT = 'bridge-event';

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

  sendMessage(event: string, message: any) {
    this.server.emit(event, message);
  }
}
