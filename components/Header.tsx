import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { FC } from "react";
import { shortenAddress } from "../utils/shortenAddress";

interface HeaderProps {
  connected: boolean;
  balance: number;
  walletAddress: string;
}

const Header: FC<HeaderProps> = ({ connected, balance, walletAddress }) => {
  return (
    <div className="flex items-center justify-between min-w-full p-6 bg-gray-800 text-gray-50">
      <h1>TEMP</h1>
      <div>
        <div className="flex items-center">
          {connected ? (
            <div className="flex flex-col">
              <div className="flex items-end mr-2">
                <p className="text-xs text-gray-400">balance </p>
                <p className="mx-1 font-bold leading-none">
                  {balance.toFixed(2)}
                </p>
                <p
                  className="font-bold leading-none text-transparent bg-clip-text"
                  style={{
                    backgroundImage: `linear-gradient(to bottom right, #00FFA3, #03E1FF, #DC1FFF)`,
                  }}
                >
                  SOL
                </p>
              </div>
              <p className="mt-2 text-center rounded-sm text-gray-50 0">
                {shortenAddress(walletAddress)}
              </p>
            </div>
          ) : (
            <WalletMultiButton
              style={{
                backgroundColor: "transparent",
                border: "2px solid #75a7c5",
                height: 40,
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Header;
