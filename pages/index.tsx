import type { NextPage } from "next";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import useCandyMachine from "../hooks/useCandyMachine";
import { useWalletBalance } from "../hooks/useWalletBalance";
import { useWallet } from "@solana/wallet-adapter-react";
import { useCallback, useState } from "react";
import { CandyMachineState, getCandyMachineState } from "../utils/candyMachine";
import * as anchor from "@project-serum/anchor";
import Header from "../components/Header";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { shortenAddress } from "../utils/shortenAddress";
import Countdown from "react-countdown";
import { Toaster } from "react-hot-toast";

const rpcHost = process.env.NEXT_PUBLIC_SOLANA_RPC_HOST!;

const connection = new anchor.web3.Connection(rpcHost);

const Home: NextPage = () => {
  const { balance } = useWalletBalance();
  const wallet = useWallet();
  const [candyMachineId, setCandyMachineId] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [candyMachine, setCandyMachine] = useState<CandyMachineState>();
  const [isSoldOut, setIsSoldOut] = useState<boolean>(true);
  const [isMintLive, setIsMintLive] = useState(false);
  const { isMinting, startMint, isSoldOut: soldOut } = useCandyMachine();

  const getCandyMachine = useCallback(
    async (candyMachineId: string) => {
      if (candyMachineId.length <= 0) return;

      setLoading((_) => true);
      const anchorWallet = {
        publicKey: wallet.publicKey,
        signAllTransactions: wallet.signAllTransactions,
        signTransaction: wallet.signTransaction,
      } as anchor.Wallet;

      const candyMachine = await getCandyMachineState(
        anchorWallet,
        candyMachineId as unknown as anchor.web3.PublicKey,
        connection
      );

      console.log({
        candyMachine,
        price: candyMachine.price / LAMPORTS_PER_SOL,
      });

      setCandyMachine((_) => candyMachine);
      setLoading((_) => false);
      setIsSoldOut((_) => candyMachine.itemsRemaining === 0);
    },
    [wallet.publicKey, wallet.signAllTransactions, wallet.signTransaction]
  );

  return (
    <div className="flex flex-col w-full h-screen min-w-full">
      <Header
        connected={wallet.connected}
        balance={balance}
        walletAddress={wallet.publicKey?.toBase58() || ""}
      />
      <div className="flex flex-col items-center justify-center h-full">
        <Toaster position="top-right" />
        {candyMachine ? (
          <div className="w-full max-w-xl px-8 pt-6 pb-8 mb-4 bg-white rounded shadow-md">
            <h1 className="text-lg font-semibold">CandymMachine Info</h1>

            <p className="mt-4 text-sm">
              <span className="font-bold">Name:</span>{" "}
              {candyMachine.candyMachine.program.idl.name}
            </p>

            <p className="mt-4 text-sm">
              <span className="font-bold">Available/Minted/Total:</span>{" "}
              {candyMachine.itemsRemaining}/{candyMachine.itemsRedeemed}/
              {candyMachine.itemsAvailable}
            </p>

            <p className="mt-4 text-sm">
              <span className="font-bold">Price:</span>{" "}
              {candyMachine.price / LAMPORTS_PER_SOL}
            </p>

            <p className="mt-4 text-sm">
              <span className="font-bold">SellerFeeBasisPoints:</span>{" "}
              {candyMachine.sellerFeeBasisPoints / LAMPORTS_PER_SOL}
            </p>

            <p className="mt-4 text-sm">
              <span className="font-bold">Creators:</span>{" "}
              {candyMachine.creators
                .map((creator) => shortenAddress(creator.address.toBase58(), 6))
                .join(", ")}
            </p>

            {wallet.connected ? (
              <>
                {new Date(candyMachine.goLiveDate).getTime() < Date.now() ? (
                  <>
                    {isSoldOut || soldOut ? (
                      <p className="mt-5 text-lg font-bold text-center">
                        SOLD OUT
                      </p>
                    ) : (
                      <button
                        className={`w-full px-4 py-2 mt-5 font-bold text-white bg-gray-500 rounded hover:bg-gray-700 focus:outline-none focus:shadow-outline ${
                          isMinting && "bg-gray-700"
                        }`}
                        type="button"
                        onClick={() =>
                          startMint(
                            candyMachine.candyMachine,
                            candyMachine.candyMachineConfigId,
                            candyMachine.treasury
                          )
                        }
                      >
                        {isMinting ? "minting..." : "mint"}
                      </button>
                    )}
                  </>
                ) : (
                  <div className="mt-5 text-lg font-bold text-center">
                    <Countdown
                      className=""
                      date={candyMachine.goLiveDate}
                      onMount={({ completed }) =>
                        completed && setIsMintLive(true)
                      }
                      onComplete={() => setIsMintLive(true)}
                    />
                  </div>
                )}
              </>
            ) : (
              <WalletMultiButton
                style={{
                  marginTop: 20,
                  backgroundColor: "#1F2937",
                  width: "100%",
                }}
              />
            )}
          </div>
        ) : (
          <form className="w-full max-w-xl px-8 pt-6 pb-8 mb-4 bg-white rounded shadow-md">
            <div className="mb-4">
              <label
                className="block mb-2 text-sm font-bold text-gray-700"
                htmlFor="candyMachineId"
              >
                Candy Machine ID
              </label>
              <input
                className="w-full px-3 py-2 leading-tight text-gray-700 border rounded shadow appearance-none focus:outline-none focus:shadow-outline"
                id="candyMachineId"
                type="text"
                value={candyMachineId}
                onChange={(e) => setCandyMachineId(e.target.value)}
                placeholder="Candy Machine ID"
              />
            </div>

            <div className="flex items-center justify-between">
              <button
                className={`w-full px-4 py-2 font-bold text-white bg-gray-500 rounded hover:bg-gray-700 focus:outline-none focus:shadow-outline ${
                  loading && "bg-gray-700"
                }`}
                type="button"
                disabled={loading}
                onClick={() => getCandyMachine(candyMachineId)}
              >
                {loading ? "loading..." : "fetch candymachine"}
              </button>
            </div>
          </form>
        )}
        <p className="text-xs text-center text-gray-500">
          &copy;{new Date().getFullYear()} Bluuesz. Code on{" "}
          <a className="text-indigo-800 " href="github.com">
            github
          </a>
          .
        </p>
      </div>
    </div>
  );
};

export default Home;
