"use client";

import { useState, useEffect } from "react";
import { getFreighterPublicKey, fundWithFriendbot } from "../lib/stellar";

export default function WalletConnect({
  onConnect,
}: {
  onConnect: (pubKey: string) => void;
}) {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [funding, setFunding] = useState(false);

  useEffect(() => {
    getFreighterPublicKey().then((key) => {
      if (key) {
        setPublicKey(key);
        onConnect(key);
      }
    });
  }, [onConnect]);

  const handleConnect = async () => {
    setLoading(true);
    try {
      const key = await getFreighterPublicKey();
      if (key) {
        setPublicKey(key);
        onConnect(key);
      } else {
        alert("Freighter not found or connection rejected.");
      }
    } catch (e) {
      console.error(e);
      alert("Error connecting wallet.");
    } finally {
      setLoading(false);
    }
  };

  const handleFund = async () => {
    if (!publicKey) return;
    setFunding(true);
    const success = await fundWithFriendbot(publicKey);
    if (success) {
      alert("Testnet XLM funded successfully!");
    } else {
      alert("Failed to fund from Friendbot. You may already be funded.");
    }
    setFunding(false);
  };

  return (
    <div className="flex items-center space-x-4 bg-gray-800 p-4 rounded-lg shadow-md border border-gray-700">
      {publicKey ? (
        <>
          <div className="text-green-400 font-mono bg-gray-900 px-3 py-1 rounded-md">
            {publicKey.slice(0, 4)}...{publicKey.slice(-4)}
          </div>
          <button
            onClick={handleFund}
            disabled={funding}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white px-4 py-2 rounded transition"
          >
            {funding ? "Funding..." : "Get Testnet XLM"}
          </button>
        </>
      ) : (
        <button
          onClick={handleConnect}
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 text-white px-4 py-2 rounded transition"
        >
          {loading ? "Connecting..." : "Connect Wallet"}
        </button>
      )}
    </div>
  );
}
