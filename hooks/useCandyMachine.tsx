import { useState } from "react";
import * as anchor from "@project-serum/anchor";
import {
  awaitTransactionSignatureConfirmation,
  CandyMachine,
  mintMultipleToken,
  mintOneToken,
} from "../utils/candyMachine";
import toast from "react-hot-toast";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletBalance } from "./useWalletBalance";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";

const rpcHost = process.env.NEXT_PUBLIC_SOLANA_RPC_HOST!;
const connection = new anchor.web3.Connection(rpcHost);

const txTimeout = 30000;

export default function useCandyMachine() {
  const { setBalance } = useWalletBalance();
  const wallet = useWallet();

  const [isMinting, setIsMinting] = useState(false);
  const [isSoldOut, setIsSoldOut] = useState(false);

  const startMint = async (
    candyMachine: CandyMachine,
    candyMachineConfigId: PublicKey,
    treasury: PublicKey
  ) => {
    try {
      setIsMinting(true);
      if (wallet.connected && candyMachine?.program && wallet.publicKey) {
        const mintTxId = await mintOneToken(
          candyMachine,
          candyMachineConfigId,
          wallet.publicKey,
          treasury
        );

        const status = await awaitTransactionSignatureConfirmation(
          mintTxId,
          txTimeout,
          connection,
          "singleGossip",
          false
        );

        if (!status?.err) {
          toast.success(
            "Congratulations! Mint succeeded! Check your wallet :)"
          );
        } else {
          toast.error("Mint failed! Please try again!");
        }
      }
    } catch (error: any) {
      let message = error.message || "Minting failed! Please try again!";
      if (!error.message) {
        if (error.message.indexOf("0x138")) {
        } else if (error.message.indexOf("0x137")) {
          message = `SOLD OUT!`;
        } else if (error.message.indexOf("0x135")) {
          message = `Insufficient funds to mint. Please fund your wallet.`;
        }
      } else {
        if (error.code === 311) {
          message = `SOLD OUT!`;
          setIsSoldOut(true);
        } else if (error.code === 312) {
          message = `Minting period hasn't started yet.`;
        }
      }
      toast.error(message);
    } finally {
      if (wallet?.publicKey) {
        const balance = await connection.getBalance(wallet?.publicKey);
        setBalance(balance / LAMPORTS_PER_SOL);
      }
      setIsMinting(false);
    }
  };

  const startMintMultiple = async (
    candyMachine: CandyMachine,
    candyMachineConfigId: PublicKey,
    price: number,
    treasury: PublicKey,
    quantity: number
  ) => {
    try {
      setIsMinting(true);
      if (wallet.connected && candyMachine?.program && wallet.publicKey) {
        const oldBalance =
          (await connection.getBalance(wallet?.publicKey)) / LAMPORTS_PER_SOL;
        const futureBalance = oldBalance - price * quantity;

        const signedTransactions: any = await mintMultipleToken(
          candyMachine,
          candyMachineConfigId,
          wallet.publicKey,
          treasury,
          quantity
        );

        const promiseArray = [];

        for (let index = 0; index < signedTransactions.length; index++) {
          const tx = signedTransactions[index];
          promiseArray.push(
            awaitTransactionSignatureConfirmation(
              tx,
              txTimeout,
              connection,
              "singleGossip",
              true
            )
          );
        }

        const allTransactionsResult = await Promise.all(promiseArray);
        let totalSuccess = 0;
        let totalFailure = 0;

        for (let index = 0; index < allTransactionsResult.length; index++) {
          const transactionStatus = allTransactionsResult[index];
          if (!transactionStatus?.err) {
            totalSuccess += 1;
          } else {
            totalFailure += 1;
          }
        }

        let newBalance =
          (await connection.getBalance(wallet?.publicKey)) / LAMPORTS_PER_SOL;

        while (newBalance > futureBalance) {
          // await sleep(1000);
          newBalance =
            (await connection.getBalance(wallet?.publicKey)) / LAMPORTS_PER_SOL;
        }

        if (totalSuccess) {
          toast.success(
            `Congratulations! ${totalSuccess} mints succeeded! Your NFT's should appear in your wallet soon :)`,
            { duration: 6000, position: "bottom-center" }
          );
        }

        if (totalFailure) {
          toast.error(
            `Some mints failed! ${totalFailure} mints failed! Check your wallet :(`,
            { duration: 6000, position: "bottom-center" }
          );
        }
      }
    } catch (error: any) {
      let message = error.message || "Minting failed! Please try again!";
      if (!error.message) {
        if (error.message.indexOf("0x138")) {
        } else if (error.message.indexOf("0x137")) {
          message = `SOLD OUT!`;
        } else if (error.message.indexOf("0x135")) {
          message = `Insufficient funds to mint. Please fund your wallet.`;
        }
      } else {
        if (error.code === 311) {
          message = `SOLD OUT!`;
          setIsSoldOut(true);
        } else if (error.code === 312) {
          message = `Minting period hasn't started yet.`;
        }
      }
      toast.error(message);
    } finally {
      if (wallet?.publicKey) {
        const balance = await connection.getBalance(wallet?.publicKey);
        setBalance(balance / LAMPORTS_PER_SOL);
      }
      setIsMinting(false);
    }
  };

  return {
    isSoldOut,
    isMinting,
    startMint,
    startMintMultiple,
  };
}
