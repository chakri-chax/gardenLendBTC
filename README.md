# DeFi Lending and Borrowing Component

This React component enables seamless lending and borrowing between Bitcoin (BTC) and Tether (USDT) within a decentralized finance (DeFi) context. It leverages ethers.js for Ethereum blockchain interactions and the GardenSDK for backend operations.

## Features

- **Lending BTC**: Users can lend their BTC. The backend bot, powered by the GardenSDK, collects Wrapped Bitcoin (WBTC) and returns USDT to the user.
- **Withdrawing BTC**: Users can withdraw their BTC.
- **Borrowing USDT**: Users can borrow USDT based on their BTC collateral.
- **Repaying USDT Debt**: Users can repay their USDT debt.

## Key Functionalities

### Lending BTC
Users can lend their BTC through the component. The backend bot collects the BTC, converts it to Wrapped Bitcoin (WBTC), and returns an equivalent amount of USDT to the user.

### Withdrawing BTC
Users can withdraw their BTC from the platform.

### Borrowing USDT
Users can borrow USDT by using their BTC as collateral. The component fetches real-time BTC to USDT conversion rates from CoinGecko and calculates the maximum borrow limits based on the user's BTC balance.

### Repaying USDT Debt
Users can repay their USDT debt through the component.

## UI Features

- **Balance Display**: Shows current BTC and USDT balances.
- **Input Fields**: Allows users to input amounts for lending, borrowing, withdrawing, and repaying.
- **Action Buttons**: Provides buttons for executing lending, borrowing, withdrawing, and repaying actions.

## Technical Details

- **Blockchain Interactions**: Uses ethers.js to interact with the Ethereum blockchain.
- **Backend Operations**: Utilizes the GardenSDK to handle backend tasks such as converting BTC to WBTC and managing transactions.
- **Real-Time Data**: Fetches real-time BTC to USDT conversion rates from CoinGecko.

## Getting Started

1. **Clone the Repository**
   ```bash
   git clone https://github.com/chakri-chax/gardenLendBTC.git
   cd gardenLendBTC
   bun install
Configure Private Keys: 
   Replace your BTC Testnet private key and EVM Sepolia private key in ./Global.tsx.

   ```bash
   bun run dev


 

