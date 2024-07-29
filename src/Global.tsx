import {
    BitcoinNetwork,
    BitcoinWallet,
    BitcoinProvider,
    EVMWallet,
} from '@catalogfi/wallets';
import {
    Orderbook,
    Chains,
    Order
} from '@gardenfi/orderbook';
import {toast} from 'react-toastify';
import { GardenJS } from '@gardenfi/core';
import { ethers, JsonRpcProvider, Wallet } from 'ethers';
import ABI from '../src/components/ABI/LendingBorrowing.json'
const contractAddress = "0x55344B3DC124B733902D964E2e8A29d849bFf4a1";
// const btcAddress = "tb1qh9pvleahnevdd6kwfw34zf23yzlaqqfasdsp00"
const bytesBtcAdress = '0x74623171683970766c6561686e65766464366b77667733347a663233797a6c6171716661736473703030'
const usdtToken = '0x562409B4dffe2A925C2296b69C2bB27059986966'
const bitcoinWallet = BitcoinWallet.fromPrivateKey(
    'BTC_Testnet_PrivateKey',
    new BitcoinProvider(BitcoinNetwork.Testnet)
);
const evmWallet = new EVMWallet(
    new Wallet('ETH_Sepolia_PrivateKey', new JsonRpcProvider('https://sepolia.infura.io/v3/e427baed8ae44e6ba79e542b53c0a524'))
);
const signer = evmWallet.getSigner();
const account = await signer.getAddress();
const contract = new ethers.Contract(contractAddress, ABI, evmWallet.getSigner());
const getToken1 = async () => {
    if (!contract) {
        return;
    }
    const token1 = await contract.token1();
    return token1;
};
const lendBTC = async (bytesBtcAdress: string, btcAmount: number, from: string) => {
    if (contract && btcAmount) {
        try {
            const tx = await contract.lendBTC(bytesBtcAdress, btcAmount, from, { from: account })
            await tx.wait();
            console.log("tx", tx);
            toast.success('Lending BTC Successful');
            return 3;
        } catch (error) {
            toast.error('Transaction Failed');
        }
    }
    return 3;
};
const withdrawBTC = async (bytesBtcAdress: string, btcAmount: number, from: string) => {
    if (contract && btcAmount ) {
        try {
            const tx = await contract.withdrawBTC(bytesBtcAdress,from,btcAmount, { from: account })
            await tx.wait();
            toast.success('Withdrawing BTC Successful');
            return 3;
        } catch (error) {
            console.error('Error:', error);
            toast.error('Transaction Failed');
        }
    }
    return 3;
}
const getBtcBal = async (bytesBtcAdress: string, address: string) => {
    if (contract) {
        const btcBal = await contract.lentBtc(bytesBtcAdress, address)
        return btcBal
    }
}
const orderbook = await Orderbook.init({
    url: 'https://orderbook-testnet.garden.finance',
    signer: evmWallet.getSigner(),
    opts: {
        domain: window.location.host,
        store: localStorage,
    },
});
const wallets = {
    [Chains.bitcoin_testnet]: bitcoinWallet,
    [Chains.ethereum_sepolia]: evmWallet,
};
const garden = new GardenJS(orderbook, wallets);
const getRecentOrders = async () => {
    const address = await evmWallet.getAddress();
    return new Promise<Order[]>((resolve) => {
        garden.subscribeOrders(address, (orders: Order[]) => {
            if (orders && orders.length > 0) {
                const recentOrders = orders
                    .sort((a, b) => b.ID - a.ID)
                    .slice(0, 3);
                resolve(recentOrders);
            } else {
                resolve([]); 
            }
        });
    });
};
function truncateAddress(address: string, startLength = 6, endLength = 4) {
    if (!address) return '';
    return `${address.substring(0, startLength)}...${address.substring(address.length - endLength)}`;
}
export {
    garden, evmWallet, getRecentOrders, getToken1, lendBTC, bytesBtcAdress, bitcoinWallet, contract, getBtcBal, truncateAddress, usdtToken,contractAddress,withdrawBTC
}