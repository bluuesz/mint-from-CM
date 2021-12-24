import "../styles/globals.css";
import type { AppProps } from "next/app";
import { WalletBalanceProvider } from "../hooks/useWalletBalance";
import dynamic from "next/dynamic";

require("@solana/wallet-adapter-react-ui/styles.css");

const WalletConnectionProvider = dynamic(
  () => import("../components/WalletConnectionProvider"),
  {
    ssr: false,
  }
);

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <WalletConnectionProvider>
      <WalletBalanceProvider>
        <Component {...pageProps} />
      </WalletBalanceProvider>
    </WalletConnectionProvider>
  );
}

export default MyApp;
