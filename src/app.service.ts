import { Injectable } from '@nestjs/common';
import {
  WebSocketProvider,
  JsonRpcProvider,
  Wallet,
  formatUnits,
} from 'ethers';

import { WebsocketsService, BRIDGE_EVENT } from './websockets.service';

@Injectable()
export class AppService {
  private sepoliaProvider: JsonRpcProvider;
  private coreProvider: JsonRpcProvider;
  private sepoliaWallet: Wallet;
  private coreWallet: Wallet;
  private bridgeAddress: string;

  constructor(private readonly websocketsService: WebsocketsService) {
    this.sepoliaProvider = new JsonRpcProvider(process.env.RPC_URL_SEPOLIA);
    this.coreProvider = new JsonRpcProvider(process.env.RPC_URL_CORE);
    this.sepoliaWallet = new Wallet(
      process.env.PRIVATE_KEY_SEPOLIA,
      this.sepoliaProvider,
    );
    this.coreWallet = new Wallet(
      process.env.PRIVATE_KEY_CORE,
      this.coreProvider,
    );
    this.bridgeAddress = process.env.BRIDGE_ADDRESS;
  }

  async monitorSepoliaTransactions(blockNumber: any): Promise<void> {
    try {
      const block = await this.sepoliaProvider.getBlock(blockNumber, true);
      const transactions = block.prefetchedTransactions;

      for (const tx of transactions) {
        if (
          tx &&
          tx.to &&
          tx.to.toLowerCase() === this.bridgeAddress.toLowerCase()
        ) {
          console.log(
            `Обнаружена транзакция на адрес ${this.bridgeAddress} с хэшем ${tx.hash}`,
          );
          console.log(`Сумма: ${formatUnits(tx.value, 'ether')} ETH`);

          // Подождем подтверждения транзакции
          const receipt = await tx.wait();
          if (receipt.status === 1) {
            console.log(
              `Транзакция подтверждена. Перевод средств в Core Testnet...`,
            );
            this.websocketsService.sendMessage(BRIDGE_EVENT, {
              from: tx.from,
              amount: formatUnits(tx.value, 'ether'),
              chain: 'Sepolia',
            });

            //   // Инициируем перевод эквивалентных средств в Core Testnet
            const txCore = await this.coreWallet.sendTransaction({
              to: tx.from, // Используйте тот же адрес получателя или укажите нужный
              value: tx.value, // Передаем ту же сумму
            });

            console.log(
              `Средства отправлены в Core Testnet. Hash: ${txCore.hash}, Address: ${tx.from}`,
            );
          }
        }
      }
    } catch (error) {
      console.error('Ошибка при обработке транзакции:', error);
    }
  }

  async monitorCoreTransactions(blockNumber: any): Promise<void> {
    try {
      const block = await this.coreProvider.getBlock(blockNumber, true);
      const transactions = block.prefetchedTransactions;

      for (const tx of transactions) {
        if (
          tx &&
          tx.to &&
          tx.to.toLowerCase() === this.bridgeAddress.toLowerCase()
        ) {
          console.log(
            `Обнаружена транзакция на адрес ${this.bridgeAddress} с хэшем ${tx.hash}`,
          );
          console.log(`Сумма: ${formatUnits(tx.value, 'ether')} ETH`);

          // Подождем подтверждения транзакции
          const receipt = await tx.wait();
          if (receipt.status === 1) {
            console.log(
              `Транзакция подтверждена. Перевод средств в Sepolia Testnet...`,
            );
            this.websocketsService.sendMessage(BRIDGE_EVENT, {
              from: tx.from,
              amount: formatUnits(tx.value, 'ether'),
              chain: 'Core',
            });

            //   // Инициируем перевод эквивалентных средств в Core Testnet
            const txCore = await this.sepoliaWallet.sendTransaction({
              to: tx.from, // Используйте тот же адрес получателя или укажите нужный
              value: tx.value, // Передаем ту же сумму
            });

            console.log(
              `Средства отправлены в Sepolia Testnet. Hash: ${txCore.hash}, Address: ${tx.from}`,
            );
          }
        }
      }
    } catch (error) {
      console.error('Ошибка при обработке транзакции:', error);
    }
  }
}
