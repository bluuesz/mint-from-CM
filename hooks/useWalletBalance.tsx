import { useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import {
  createContext,
  Dispatch,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from "react";
import * as anchor from "@project-serum/anchor";

interface BalanceContext {
  balance: number;
  setBalance: Dispatch<SetStateAction<number>>;
}

const BalanceContext = createContext<BalanceContext>({} as BalanceContext);

const rpcHost = process.env.NEXT_PUBLIC_SOLANA_RPC_HOST!;

const connection = new anchor.web3.Connection(rpcHost);

export const WalletBalanceProvider: React.FC = ({ children }) => {
  const wallet = useWallet();

  const [balance, setBalance] = useState(0);

  useEffect(() => {
    (async () => {
      if (wallet?.publicKey) {
        const balance = await connection.getBalance(wallet.publicKey);
        setBalance(balance / LAMPORTS_PER_SOL);
      }
    })();
  }, [wallet]);

  useEffect(() => {
    (async () => {
      if (wallet?.publicKey) {
        const balance = await connection.getBalance(wallet.publicKey);
        setBalance(balance / LAMPORTS_PER_SOL);
      }
    })();
  }, [wallet]);

  return (
    <BalanceContext.Provider value={{ balance, setBalance }}>
      {children}
    </BalanceContext.Provider>
  );
};

export const useWalletBalance = (): BalanceContext => {
  const context = useContext(BalanceContext);

  if (!context) {
    throw new Error(
      "useWalletBalance is not possible for the use without WalletBalanceProvider"
    );
  }

  return context;
};
