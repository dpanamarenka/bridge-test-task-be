import { NestFactory } from '@nestjs/core';
import { JsonRpcProvider } from 'ethers';

import { AppModule } from './app.module';
import { AppService } from './app.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const appService = app.get(AppService);
  const sepoliaProvider = new JsonRpcProvider(process.env.RPC_URL_SEPOLIA);
  const coreProvider = new JsonRpcProvider(process.env.RPC_URL_CORE);

  sepoliaProvider.on('block', async (txHash) => {
    await appService.monitorSepoliaTransactions(txHash);
  });
  coreProvider.on('block', async (txHash) => {
    await appService.monitorCoreTransactions(txHash);
  });

  await app.listen(4000);
}
bootstrap();
