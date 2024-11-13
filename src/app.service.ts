import { Injectable } from '@nestjs/common';
import { JsonRpcProvider, Wallet, formatUnits } from 'ethers';

import { Event, MessageType } from './constants';
import { WebsocketsService } from './websockets.service';

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
            `Detected new transaction to ${this.bridgeAddress} with hash ${tx.hash}`,
          );
          console.log(`Sum: ${formatUnits(tx.value, 'ether')} ETH`);

          const receipt = await tx.wait();
          if (receipt.status === 1) {
            console.log(
              `Transaction submitted. Transfer funds to Core Testnet...`,
            );
            this.websocketsService.sendMessage(Event.BRIDGE_EVENT, {
              from: tx.from,
              amount: formatUnits(tx.value, 'ether'),
              chain: 'Sepolia',
              type: MessageType.BRIDGE,
            });

            const txCore = await this.coreWallet.sendTransaction({
              to: tx.from,
              value: tx.value,
            });

            this.websocketsService.sendMessage(Event.SUCCESS_EVENT, {
              txLink: `https://scan.test.btcs.network/tx/${txCore.hash}`,
              type: MessageType.SUCCESS,
            });

            console.log(
              `Funds successfully transfered to Core Testnet. Hash: ${txCore.hash}, Address: ${tx.from}`,
            );
          }
        }
      }
    } catch (error) {
      console.error('Error occured:', error);

      this.websocketsService.sendMessage(Event.ERROR_EVENT, {
        message: error?.message || JSON.stringify(error),
        type: MessageType.ERROR,
      });
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
            `Detected new transaction to ${this.bridgeAddress} with hash ${tx.hash}`,
          );
          console.log(`Sum: ${formatUnits(tx.value, 'ether')} ETH`);

          throw new Error('Test error');

          const receipt = await tx.wait();
          if (receipt.status === 1) {
            console.log(
              `Transaction submitted. Transfer funds to Sepolia Testnet...`,
            );
            this.websocketsService.sendMessage(Event.BRIDGE_EVENT, {
              from: tx.from,
              amount: formatUnits(tx.value, 'ether'),
              chain: 'Core',
              type: MessageType.BRIDGE,
            });

            const txCore = await this.sepoliaWallet.sendTransaction({
              to: tx.from,
              value: tx.value,
            });

            this.websocketsService.sendMessage(Event.SUCCESS_EVENT, {
              txLink: `https://sepolia.etherscan.io/tx/${txCore.hash}`,
              type: MessageType.SUCCESS,
            });

            console.log(
              `Funds successfully transfered to Sepolia Testnet. Hash: ${txCore.hash}, Address: ${tx.from}`,
            );
          }
        }
      }
    } catch (error) {
      console.error('Error occured:', error);

      this.websocketsService.sendMessage(Event.ERROR_EVENT, {
        message: error?.message || JSON.stringify(error),
        type: MessageType.ERROR,
      });
    }
  }
}
