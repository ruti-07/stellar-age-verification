"use client";

import { useState } from "react";
import WalletConnect from "../components/WalletConnect";
import MainFeature from "../components/MainFeature";

export default function Home() {
  const [publicKey, setPublicKey] = useState<string | null>(null);

  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col items-center py-12 px-4 selection:bg-purple-500/30">
      <div className="max-w-4xl w-full">
        <header className="mb-12 flex flex-col sm:flex-row items-center justify-between border-b border-gray-800 pb-6">
          <div>
            <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 mb-2 sm:mb-0 drop-shadow-sm tracking-tight">
              ZK Age Verification
            </h1>
            <p className="text-gray-400 text-sm hidden sm:block mt-2">
              Privacy-preserving age checks on Stellar Testnet
            </p>
          </div>
          <WalletConnect onConnect={setPublicKey} />
        </header>

        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          {publicKey ? (
            <MainFeature publicKey={publicKey} />
          ) : (
            <div className="text-center py-20 px-8 bg-gray-900/50 rounded-2xl border border-gray-800 backdrop-blur-sm shadow-xl max-w-lg w-full">
              <div className="w-20 h-20 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <p className="text-2xl font-semibold text-white mb-3">Connect your Wallet</p>
              <p className="text-gray-400">Please connect your Freighter wallet to continue. Ensure you are on the <span className="text-purple-400 font-medium">Stellar Testnet</span>.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
