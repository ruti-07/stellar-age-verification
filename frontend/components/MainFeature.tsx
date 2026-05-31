"use client";

import { useState, useEffect, useCallback } from "react";
import {
  initializeContract,
  addCommitment,
  verifyAge,
  isVerified,
} from "../lib/contract";

export default function MainFeature({ publicKey }: { publicKey: string }) {
  const [status, setStatus] = useState<"unverified" | "verified" | "checking">("checking");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [adminKey, setAdminKey] = useState("");
  const [commitmentHex, setCommitmentHex] = useState("");
  const [userCommitmentHex, setUserCommitmentHex] = useState("");

  const checkStatus = useCallback(async () => {
    try {
      const verified = await isVerified(publicKey);
      setStatus(verified ? "verified" : "unverified");
    } catch (e) {
      console.error(e);
      setStatus("unverified");
    }
  }, [publicKey]);

  useEffect(() => {
    if (publicKey) {
      checkStatus();
    }
  }, [publicKey, checkStatus]);

  const generateCommitment = async () => {
    // In a real app, hash ID + birthdate + salt
    // Here we generate a random 32-byte hex for demonstration
    const randomBytes = new Uint8Array(32);
    crypto.getRandomValues(randomBytes);
    const hex = Array.from(randomBytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return hex;
  };

  const handleInitialize = async () => {
    setLoading(true);
    setMessage("");
    try {
      await initializeContract(adminKey || publicKey);
      setMessage("✅ Contract initialized successfully!");
    } catch (e: any) {
      // Error(Contract, #2) = AlreadyInitialized — this is fine
      if (e.message?.includes("#2")) {
        setMessage("✅ Contract is already initialized. You can add commitments and verify.");
      } else {
        setMessage(`Error: ${e.message}`);
      }
    }
    setLoading(false);
  };

  const handleAddCommitment = async () => {
    setLoading(true);
    setMessage("");
    try {
      let hex = commitmentHex;
      if (!hex) {
        hex = await generateCommitment();
        setCommitmentHex(hex);
      }
      await addCommitment(publicKey, hex);
      setMessage(`Commitment added! Save this hex for verification: ${hex}`);
    } catch (e: any) {
      setMessage(`Error: ${e.message}`);
    }
    setLoading(false);
  };

  const handleVerify = async () => {
    setLoading(true);
    setMessage("");
    try {
      await verifyAge(publicKey, userCommitmentHex);
      setMessage("Successfully verified!");
      checkStatus();
    } catch (e: any) {
      setMessage(`Verification failed: ${e.message}`);
    }
    setLoading(false);
  };

  if (status === "checking") {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
        <span className="ml-3 text-gray-400">Checking verification status...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 w-full max-w-2xl mt-8">
      {status === "verified" ? (
        <div className="bg-green-900/30 border border-green-500 p-8 rounded-xl text-center shadow-lg">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 mb-4">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-green-400">Verified Age (18+)</h2>
          <p className="text-gray-300 mt-3 text-lg">Your wallet has been verified via zero-knowledge commitment.</p>
        </div>
      ) : (
        <div className="bg-gray-800 p-8 rounded-xl border border-gray-700 shadow-lg">
          <h2 className="text-2xl font-bold text-white mb-6">Age Verification</h2>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Enter 64-character Commitment Hex"
              className="w-full bg-gray-900 text-white p-4 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition"
              value={userCommitmentHex}
              onChange={(e) => setUserCommitmentHex(e.target.value)}
            />
            <button
              onClick={handleVerify}
              disabled={loading || !userCommitmentHex}
              className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-purple-900 text-white px-4 py-4 rounded-lg font-bold text-lg transition shadow-md"
            >
              {loading ? "Processing..." : "Verify Age"}
            </button>
          </div>
        </div>
      )}

      <div className="bg-gray-800 p-8 rounded-xl border border-gray-700 shadow-lg space-y-6">
        <h2 className="text-xl font-bold text-white border-b border-gray-700 pb-4">Admin Controls</h2>
        
        <div className="space-y-3">
          <label className="text-sm font-semibold text-gray-400">Initialize Contract</label>
          <div className="flex space-x-3">
            <input
              type="text"
              placeholder="Admin Public Key (defaults to connected)"
              className="flex-1 bg-gray-900 text-white p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
            />
            <button
              onClick={handleInitialize}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-900 text-white px-6 py-2 rounded-lg font-medium transition"
            >
              Initialize
            </button>
          </div>
        </div>

        <div className="space-y-3 pt-4">
          <label className="text-sm font-semibold text-gray-400">Register Commitment</label>
          <div className="flex space-x-3">
            <input
              type="text"
              placeholder="Commitment Hex (leave blank to auto-generate)"
              className="flex-1 bg-gray-900 text-white p-3 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
              value={commitmentHex}
              onChange={(e) => setCommitmentHex(e.target.value)}
            />
            <button
              onClick={handleAddCommitment}
              disabled={loading}
              className="bg-green-600 hover:bg-green-500 disabled:bg-green-900 text-white px-6 py-2 rounded-lg font-medium transition whitespace-nowrap"
            >
              Add Commitment
            </button>
          </div>
        </div>
      </div>

      {message && (
        <div className="bg-gray-900 border border-gray-700 p-4 rounded-lg text-white font-mono text-sm break-all shadow-inner">
          {message}
        </div>
      )}
    </div>
  );
}
