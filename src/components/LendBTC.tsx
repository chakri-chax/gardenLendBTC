import { useState, useImperativeHandle, forwardRef } from 'react';
import { Assets, Actions, parseStatus } from '@gardenfi/orderbook';
import { garden, lendBTC, bytesBtcAdress, evmWallet, withdrawBTC } from '../Global';
import styles from '../styles/SupplyCard.module.css'
import { toast } from 'react-toastify';
interface LendBtcProps {
  address: string;
}
const actions = {
  lend: 1,
  withdraw: 2,
};
const LendBtc = forwardRef(({ address }: LendBtcProps, ref) => {
  const [, setSwapStatus] = useState<number | null>(null);
  const [lendLoader, setLendLoader] = useState<boolean>(false);
  const [amount, setBtcAmount] = useState<number | null>(null);
  const [, setOrderId] = useState<number | null>(null);
  useImperativeHandle(ref, () => ({
    createWalletsAndOrderbook: (action: number) => createWalletsAndOrderbook(action),
  }));
  const orderBtcToWbtc = async (sendAmount: number, receiveAmount: number) => {
    const id = await garden.swap(
      Assets.bitcoin_testnet.BTC,
      Assets.ethereum_sepolia.WBTC,
      sendAmount,
      receiveAmount
    );
    return id;
  };
  const orderWbtcToBtc = async (sendAmount: number, receiveAmount: number) => {
    const id = await garden.swap(
      Assets.ethereum_sepolia.WBTC,
      Assets.bitcoin_testnet.BTC,
      sendAmount,
      receiveAmount
    );
    return id;
  };
  const createWalletsAndOrderbook = async (action: number) => {
    if (!amount) return;
    const sendAmount = amount * 1e8;
    const receiveAmount = (1 - 0.3 / 100) * sendAmount;
    console.log("sendAmount", sendAmount, receiveAmount);
    const data = {
      bytesBtcAdress,
      receiveAmount,
      address,
    }
    console.log("data", data);
    async function interact() {
      if (action === actions.lend) {
        await lendBTC(bytesBtcAdress, receiveAmount, address).then((res) => {
          if (res === 3) {
            setLendLoader(false);
          }
        });
      } else if (action === actions.withdraw) {
        await withdrawBTC(bytesBtcAdress, receiveAmount, address).then((res) => {
          if (res === 3) {
            setLendLoader(false);
          }
        });
      }
    }
    const id = action === actions.lend
      ? await orderBtcToWbtc(sendAmount, receiveAmount)
      : await orderWbtcToBtc(sendAmount, receiveAmount);
    setOrderId(id);
    toast.info(`Swap Order ${id} created`);
    garden.subscribeOrders(await evmWallet.getAddress(), async (orders) => {
      const order = orders.find((order) => order.ID === id);
      if (!order) return;
      const action = parseStatus(order);
      if (action === Actions.UserCanInitiate || action === Actions.UserCanRedeem) {
        const swapper = garden.getSwap(order);
        const swapOutput = await swapper.next();
        toast.success(`Order ${swapOutput.action}d`);
        console.log('completed swapOutput with action', swapOutput.action);
        if (swapOutput.action === "Redeem") {
          await interact();
        }
        setSwapStatus(order.status);
      }
    });
  };
  const initiateLend = async () => {
    setBtcAmount(null);
    setLendLoader(true);
    await createWalletsAndOrderbook(actions.lend);
  };
  const initiateWithdraw = async () => {
    setBtcAmount(0);
    setLendLoader(true);
    await createWalletsAndOrderbook(actions.withdraw);
  };
  return (
    <>
      <div className={styles.row}>
        <div className={styles.asset}>
          <input
            type="number"
            placeholder="Enter BTC Amount"
            value={amount ?? ''}
            onChange={(e) => setBtcAmount(Number(e.target.value))}
            className="input-style"
          />
        </div>
        <div className={styles.supplyActions}>&nbsp;
          <button className={styles.supplyButton} onClick={initiateLend}>Lend </button>
          <button className={styles.withdrawButton} onClick={initiateWithdraw}>Withdraw</button>
        </div>
      </div>
      {lendLoader && (<div className="loader"></div>)}
    </>
  );
});
export default LendBtc;