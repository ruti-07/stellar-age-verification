# ZK Age Verification (Stellar dApp)

This project is a decentralized application on the Stellar network that simulates a Zero-Knowledge (ZK) inspired age-verification system. It allows an admin to register valid (hashed) ID commitments and lets users submit a hash of their ID, birthdate, and salt. The smart contract checks the hash against the registry and marks the user as verified (18+) without ever exposing or storing actual personal data on-chain.

## Tech Stack
- **Smart Contract**: Rust with Soroban SDK (`soroban-sdk` v21.0.0)
- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Stellar SDK**: `@stellar/stellar-sdk`
- **Wallet**: Freighter browser extension (`@stellar/freighter-api`)
- **Network**: Stellar Testnet

## Prerequisites
- **Rust** installed:
  ```bash
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
  ```
- **Wasm target** added:
  ```bash
  rustup target add wasm32-unknown-unknown
  ```
- **Stellar CLI** installed:
  ```bash
  cargo install --locked stellar-cli
  ```
- **Node.js** v18 or later
- **Freighter Wallet** browser extension installed from [freighter.app](https://freighter.app)

## Project Structure
```text
.
├── contracts/
│   ├── Cargo.toml         # Rust smart contract dependencies and configuration
│   └── src/
│       └── lib.rs         # Full Soroban smart contract source code
├── frontend/
│   ├── app/
│   │   ├── globals.css    # Global Tailwind styles
│   │   ├── layout.tsx     # Next.js Root Layout
│   │   └── page.tsx       # Next.js main entry page
│   ├── components/
│   │   ├── MainFeature.tsx   # Contract interactions (verify, initialize, etc)
│   │   └── WalletConnect.tsx # Freighter wallet connect and fund buttons
│   ├── lib/
│   │   ├── contract.ts    # Contract interaction logic wrapping stellar-sdk
│   │   └── stellar.ts     # Stellar/Freighter connection and network config
│   ├── package.json       # Frontend dependencies
│   ├── postcss.config.js  # PostCSS configuration for Tailwind
│   ├── tailwind.config.ts # Tailwind CSS configuration
│   └── tsconfig.json      # TypeScript configuration
├── .env.example           # Example environment variables required for frontend
└── README.md              # Project documentation
```

## Step 1 — Build the Smart Contract
```bash
cd contracts
cargo build --target wasm32-unknown-unknown --release
```
This command compiles your Rust code into a WebAssembly (.wasm) file. The optimized file will be located at `target/wasm32-unknown-unknown/release/zk_age_verification.wasm`.

## Step 2 — Set Up a Testnet Identity
Create an identity to deploy your contract:
```bash
stellar keys generate my-key --network testnet --fund
stellar keys address my-key
```
This automatically generates a keypair and funds the new address on the Stellar Testnet using Friendbot.

## Step 3 — Deploy Contract to Testnet
Deploy the newly compiled `.wasm` file to the Stellar Testnet:
```bash
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/zk_age_verification.wasm \
  --source my-key \
  --network testnet
```
**Important:** Copy the returned `Contract ID` string. You will need it in Step 5.

## Step 4 — Install Frontend Dependencies
```bash
cd ../frontend
npm install
```

## Step 5 — Configure Environment Variables
Copy the example environment configuration:
```bash
cd ..
cp .env.example frontend/.env.local
```
Open `frontend/.env.local` and paste the Contract ID from Step 3 into the `NEXT_PUBLIC_CONTRACT_ID` field:
```env
NEXT_PUBLIC_CONTRACT_ID=CBEVXH7CIWOZPDZJH6BFVZDTMFE4GRHJUIT65XLOEREHPDSHWOLY6CK6
```

## Step 6 — Run the Frontend
```bash
cd frontend
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

## Step 7 — Using the App
1. Install Freighter at [https://freighter.app](https://freighter.app) and set it to Testnet mode.
   *(Settings → Network → Testnet)*
2. Click **"Connect Wallet"** on the webpage to link your Freighter wallet.
3. Click **"Get Testnet XLM"** to fund your wallet via Friendbot if you have an empty balance.
4. **Admin Initialization**: Use the Admin Controls section to initialize the contract (defaults to your current wallet address).
5. **Register Commitment**: Generate a hash commitment in the Admin Controls and add it to the smart contract. Save the 64-character hex.
6. **Verify Age**: Under Age Verification, paste the hex commitment. If valid, your age will be verified on-chain, and the contract will mark you as verified while destroying the commitment to prevent reuse.

## Smart Contract Functions

### `initialize` (Write)
- **Parameters**: `admin` (Address)
- **Description**: Sets the global admin for the contract. Can only be called once.

### `add_commitment` (Write)
- **Parameters**: `admin` (Address), `commitment` (BytesN<32>)
- **Description**: Allows the admin to insert a valid ID hash (commitment) into the age-verification registry.

### `verify_age` (Write)
- **Parameters**: `user` (Address), `commitment` (BytesN<32>)
- **Description**: Allows a user to verify themselves by providing a valid commitment. Marks the user as verified and removes the commitment to prevent reuse.

### `is_verified` (Read)
- **Parameters**: `user` (Address)
- **Description**: Checks whether a given user is marked as verified by the contract.

## Common Errors & Fixes
- **"Transaction simulation failed"** → Contract not deployed, or wrong `CONTRACT_ID` in `.env.local`.
- **"Freighter not found"** → Install the Freighter extension and refresh the page.
- **"Account not found"** → Click "Get Testnet XLM" to fund your wallet first.
- **"wasm32 target not found"** → Run: `rustup target add wasm32-unknown-unknown`
- **"CommitmentNotFound"** → You are trying to verify with a hash that has not been registered by the admin or has already been consumed.

## Testnet Resources
- Stellar Testnet Explorer: [https://stellar.expert/explorer/testnet/contract/CBEVXH7CIWOZPDZJH6BFVZDTMFE4GRHJUIT65XLOEREHPDSHWOLY6CK6](https://stellar.expert/explorer/testnet/contract/CBEVXH7CIWOZPDZJH6BFVZDTMFE4GRHJUIT65XLOEREHPDSHWOLY6CK6)
- Stellar Lab (manual transactions): [https://lab.stellar.org](https://lab.stellar.org)
- Friendbot: [https://friendbot.stellar.org/?addr=YOUR_PUBLIC_KEY](https://friendbot.stellar.org/?addr=YOUR_PUBLIC_KEY)
