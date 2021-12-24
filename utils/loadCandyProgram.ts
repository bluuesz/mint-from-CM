import { Keypair } from "@solana/web3.js";
import * as anchor from "@project-serum/anchor"
import { log } from "console";

export async function loadCandyProgram(
  wallet: anchor.Wallet,
  env: string,
  candyMachineProgramId: string,
  customRpcUrl?: string,
) {
  if (customRpcUrl) console.log('USING CUSTOM URL', customRpcUrl);

  const solConnection = new anchor.web3.Connection(
    process.env.NEXT_PUBLIC_SOLANA_RPC_HOST!
  );

  const provider = new anchor.Provider(solConnection, wallet, {
    preflightCommitment: 'recent',
  });
  const idl = await anchor.Program.fetchIdl(candyMachineProgramId, provider);

  if(!idl) throw new Error("Invalid idl")

  const program = new anchor.Program(idl, candyMachineProgramId, provider);
  log('program id from anchor', program.programId.toBase58());
  return program;
}
