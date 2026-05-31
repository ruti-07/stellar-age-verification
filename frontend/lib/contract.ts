import { Address, scValToNative, xdr, rpc, TransactionBuilder, Contract } from '@stellar/stellar-sdk';
import { getNetworkConfig, signAndSubmitTransaction } from './stellar';

const getContractId = () => {
  const contractId = process.env.NEXT_PUBLIC_CONTRACT_ID;
  if (!contractId) {
    throw new Error('Contract ID is not set in environment variables.');
  }
  return contractId;
};

async function simulateAndAssemble(
  publicKey: string,
  methodName: string,
  args: xdr.ScVal[]
): Promise<string> {
  const { rpcUrl, networkPassphrase } = getNetworkConfig();
  const server = new rpc.Server(rpcUrl);
  const contractId = getContractId();

  const account = await server.getAccount(publicKey);
  const contract = new Contract(contractId);

  const tx = new TransactionBuilder(account, {
    fee: "10000",
    networkPassphrase,
  })
    .addOperation(contract.call(methodName, ...args))
    .setTimeout(30)
    .build();

  const simulated = await server.simulateTransaction(tx);
  
  if (rpc.Api.isSimulationError(simulated)) {
    throw new Error(`Simulation failed: ${simulated.error}`);
  }

  if (rpc.Api.isSimulationRestore(simulated)) {
    throw new Error(`Contract state needs to be restored from archival.`);
  }

  // assembleTransaction takes exactly 2 args: (rawTransaction, simulationResponse)
  const assembled = rpc.assembleTransaction(tx, simulated).build();
  return assembled.toXDR();
}

export async function initializeContract(adminPublicKey: string): Promise<string> {
  const args = [new Address(adminPublicKey).toScVal()];
  const txXdr = await simulateAndAssemble(adminPublicKey, 'initialize', args);
  return signAndSubmitTransaction(txXdr);
}

export async function addCommitment(adminPublicKey: string, commitmentHex: string): Promise<string> {
  const commitmentBytes = Buffer.from(commitmentHex, 'hex');
  if (commitmentBytes.length !== 32) {
    throw new Error('Commitment must be exactly 32 bytes (64 hex characters).');
  }
  const args = [
    new Address(adminPublicKey).toScVal(),
    xdr.ScVal.scvBytes(commitmentBytes)
  ];
  
  const txXdr = await simulateAndAssemble(adminPublicKey, 'add_commitment', args);
  return signAndSubmitTransaction(txXdr);
}

export async function verifyAge(userPublicKey: string, commitmentHex: string): Promise<string> {
  const commitmentBytes = Buffer.from(commitmentHex, 'hex');
  if (commitmentBytes.length !== 32) {
    throw new Error('Commitment must be exactly 32 bytes (64 hex characters).');
  }
  const args = [
    new Address(userPublicKey).toScVal(),
    xdr.ScVal.scvBytes(commitmentBytes)
  ];
  
  const txXdr = await simulateAndAssemble(userPublicKey, 'verify_age', args);
  return signAndSubmitTransaction(txXdr);
}

export async function isVerified(userPublicKey: string): Promise<boolean> {
  const { rpcUrl, networkPassphrase } = getNetworkConfig();
  const server = new rpc.Server(rpcUrl);
  const contractId = getContractId();

  try {
    const account = await server.getAccount(userPublicKey);
    const contract = new Contract(contractId);

    const tx = new TransactionBuilder(account, {
      fee: "10000",
      networkPassphrase,
    })
      .addOperation(contract.call('is_verified', new Address(userPublicKey).toScVal()))
      .setTimeout(30)
      .build();

    const simulated = await server.simulateTransaction(tx);
    
    if (rpc.Api.isSimulationError(simulated)) {
      return false;
    }
    
    if (rpc.Api.isSimulationSuccess(simulated) && simulated.result?.retval) {
      const result = scValToNative(simulated.result.retval);
      // Strictly compare — scValToNative might return non-boolean truthy values
      return result === true;
    }
    
    return false;
  } catch (e) {
    console.error('isVerified error:', e);
    return false;
  }
}

