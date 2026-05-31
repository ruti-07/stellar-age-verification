import {
  isConnected as freighterIsConnected,
  requestAccess,
  signTransaction,
} from '@stellar/freighter-api';
import { rpc } from '@stellar/stellar-sdk';

export function getNetworkConfig() {
  return {
    rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || 'https://soroban-testnet.stellar.org',
    networkPassphrase: process.env.NEXT_PUBLIC_NETWORK_PASSPHRASE || 'Test SDF Network ; September 2015',
    horizonUrl: process.env.NEXT_PUBLIC_HORIZON_URL || 'https://horizon-testnet.stellar.org',
  };
}

export async function getFreighterPublicKey(): Promise<string | null> {
  try {
    const connectionResult = await freighterIsConnected();
    if (!connectionResult.isConnected) {
      return null;
    }
    const { address, error } = await requestAccess();
    if (error) {
      console.error('Freighter requestAccess error:', error);
      return null;
    }
    return address || null;
  } catch (e) {
    console.error('Freighter connection error:', e);
    return null;
  }
}

export async function signAndSubmitTransaction(xdrString: string): Promise<string> {
  const { networkPassphrase, rpcUrl } = getNetworkConfig();
  
  // Sign the transaction with Freighter
  const { signedTxXdr, error } = await signTransaction(xdrString, {
    networkPassphrase,
  });

  if (error || !signedTxXdr) {
    throw new Error(`Freighter signing failed: ${error || "Unknown error"}`);
  }

  // Submit the signed XDR directly to the Soroban RPC via JSON-RPC.
  // We avoid TransactionBuilder.fromXDR() because the Freighter extension
  // may produce envelope types newer than what our SDK version can parse
  // (causes "Bad union switch" errors).
  const sendResponse = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'sendTransaction',
      params: { transaction: signedTxXdr },
    }),
  });

  const sendResult = await sendResponse.json();

  if (sendResult.error) {
    throw new Error(`RPC error: ${JSON.stringify(sendResult.error)}`);
  }

  const result = sendResult.result;

  if (result.status === 'ERROR') {
    throw new Error(`Transaction submission failed: ${JSON.stringify(result)}`);
  }

  const txHash: string = result.hash;

  // Poll for confirmation (up to 30s)
  for (let i = 0; i < 15; i++) {
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const pollResponse = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getTransaction',
        params: { hash: txHash },
      }),
    });

    const pollResult = await pollResponse.json();
    const txStatus = pollResult.result?.status;

    if (txStatus === 'SUCCESS') {
      return txHash;
    }
    if (txStatus === 'FAILED') {
      throw new Error(`Transaction failed on-chain: ${JSON.stringify(pollResult.result)}`);
    }
    // status is NOT_FOUND — keep polling
  }

  throw new Error(`Transaction timed out after 30s. Hash: ${txHash}`);
}

export async function fundWithFriendbot(publicKey: string): Promise<boolean> {
  try {
    const response = await fetch(`https://friendbot.stellar.org/?addr=${publicKey}`);
    return response.ok;
  } catch (error) {
    console.error('Failed to fund via Friendbot:', error);
    return false;
  }
}
