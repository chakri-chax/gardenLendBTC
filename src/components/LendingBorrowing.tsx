/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { ethers } from 'ethers';
import '../App.css';
import ABI from './ABI/LendingBorrowing.json';
import tokenABI from './ABI/tokenABI.json';
import LendBtc from './LendBTC';
import {  bytesBtcAdress, truncateAddress, usdtToken, contractAddress } from "../Global";
import styles from '../styles/SupplyCard.module.css';
import BorrowStyles from '../styles/BorrowCard.module.css';
import HeaderStyles from '../styles/Header.module.css';
import DashBoardStyles from '../styles/Dashboard.module.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
const LendingBorrowing: React.FC = () => {
  const lendBtcRef = useRef<any>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [account, setAccount] = useState<string>('');
  const [usdtAmount, setUsdtAmount] = useState<number | null>(null);
  const [btcBal, setBtcBal] = useState<number | null>(null);
  const [btcInr, setBtcInr] = useState<number | null>(null);
  const [usdtBal, setUsdtBal] = useState<number>(0);
  const [usdtInr, setUsdtInr] = useState<number | null>(null);
  const [netAPY, setNetAPY] = useState<number | null>(null);
  const [conversionRate, setConversionRate] = useState<number>(62761);
  const [lendBtcComponent, setLendBtcComponent] = useState<JSX.Element | null>(null);
  const [limit, setLimit] = useState<number | null>(null);
  const [possibleBTCWithdrawal, setPossibleBTCWithdrawal] = useState<number>(0);
  const [Loader, setLoader] = useState<boolean>(false);
  const [, setUnisatInstalled] = useState(false);
  const [BTCconnected, setBTCConnected] = useState(false);
  const [BTCaddress, setBTCAddress] = useState("");
  const [BTCbalance, setBTCBalance] = useState(0);
  const [ETHBalance, setETHBalance] = useState(0);
  const explorerUrl = " https://sepolia.etherscan.io/"
  const contract = useMemo(() => new ethers.Contract(contractAddress, ABI, signer), [signer]);
  const getBTCInfo = async () => {
    const unisat = (window as any).unisat;
    const [address] = await unisat.getAccounts();
    setBTCAddress(address);
    const balance = await unisat.getBalance();
    setBTCBalance(balance.total);
  };
  useEffect(() => {
    const checkUnisat = async () => {
      let unisat = (window as any).unisat;
      for (let i = 1; i < 10 && !unisat; i++) {
        await new Promise((resolve) => setTimeout(resolve, 100 * i));
        unisat = (window as any).unisat;
      }
      if (unisat) {
        setUnisatInstalled(true);
        const accounts = await unisat.getAccounts();
        if (accounts.length > 0) {
          setBTCConnected(true);
          getBTCInfo();
        }
      }
      else {
        setUnisatInstalled(false);
      }
    };
    checkUnisat();
  }, []);
  const connectBTCWallet = async () => {
    const unisat = (window as any).unisat;
    const result = await unisat.requestAccounts();
    if (result.length > 0) {
      setBTCConnected(true);
      getBTCInfo();
    }
  };
  useEffect(() => {
    if (btcBal) {
      fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd')
        .then(res => res.json())
        .then(data => {
          setConversionRate(data.bitcoin.usd);
        })
        .catch(err => console.error(err));
    }
  }, [btcBal]);
    const checkUsdtBalance =useCallback(async () => {
      if (contract && account) {
        try {
          const borrowedUsdtAmt = await contract.borrowedAmt(usdtToken, account);
          if (borrowedUsdtAmt) {
            const amt = ethers.formatEther(borrowedUsdtAmt);
            setUsdtBal(Number(amt));
            getUsdtToInr().then(price => {
              if (!usdtBal) return;
              setUsdtInr(usdtBal * price);
            });
          }
        } catch (error) {
          console.error('Error fetching USDT balance:', error);
        }
      }
    }, [contract, account, usdtBal]);
  useEffect(() => {
    const id = setInterval(() => {
      checkUsdtBalance();
    }, 10000);
    return () => {
      clearInterval(id);
    };
  }, [checkUsdtBalance]);
  useEffect(() => {
    checkUsdtBalance();
  }, [checkUsdtBalance]);
  useEffect(() => {
    if (conversionRate && btcBal !== null) {
      const newLimit = possibleBTCWithdrawal * conversionRate;
      setLimit(newLimit);
    }
  }, [conversionRate, btcBal, possibleBTCWithdrawal, usdtBal]);
  const checkLendBtcBalance = useCallback(async () => {
    if (contract && account) {
      try {
        const lendBTCAmt = await contract.lentBtc(bytesBtcAdress, account);
        const availBal = await contract.availableBtc(bytesBtcAdress, account);
        setPossibleBTCWithdrawal(Number(ethers.formatUnits(availBal, 8)));
        setBtcBal(Number(ethers.formatUnits(lendBTCAmt, 8)));
        getBtcToInr().then(price => {
          if (!btcBal) return;
          setBtcInr(btcBal * price);
        });
      } catch (error) {
        console.error('Error fetching BTC balance:', error);
      }
    }
  }, [account, contract, btcBal]);
  useEffect(() => {
    if (account) {
      // setInterval(checkLendBtcBalance, 5000);
      checkLendBtcBalance();
    }
  }, [usdtBal, account, usdtAmount, checkLendBtcBalance]);
  useEffect(() => {
    const id = setInterval(() => {
      checkLendBtcBalance();
    }, 10000);
    return () => {
      clearInterval(id);
    };
  }, [checkLendBtcBalance]);
  useEffect(() => {
    checkLendBtcBalance();
  }, [checkLendBtcBalance]);
  const renderLendBtcComponent = (address: string) => {
    return <LendBtc ref={lendBtcRef} address={address} />;
  };
  useEffect(() => {
    setLendBtcComponent(renderLendBtcComponent(account));
  }, [ account]);
  const connectMetaMask = async () => {
    if (window.ethereum !== null) {
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      setSigner(signer);
      const account = await signer.getAddress();
      setAccount(account);
      const balance = await provider.getBalance(account);
      setETHBalance(Number(ethers.formatEther(balance)));
    } else {
      throw new Error("MetaMask not Found");
    }
  };
  const borrow = async () => {
    if (!contract || !account || !usdtAmount || !conversionRate) return;
    if (contract && account) {
      try {
        setLoader(true);
        const amt = ethers.parseUnits(usdtAmount.toString(), 18);
        setUsdtAmount(0);
        const btcConsuming = usdtAmount / conversionRate;     
        const satosis = BigInt((btcConsuming * 1e8).toFixed(0));
        const tx = await contract.borrow(usdtToken, amt, bytesBtcAdress, satosis, { from: account, gasLimit: (1000000) }); // Setting a higher gas limit for testing
        await tx.wait();
        setLoader(false);
        const url = `${explorerUrl}/tx/${tx.hash}`;
        toast.success(<>Borrowed Successfully <br/><a href={url} target="_blank" >view on explorer</a></>);
      } catch (error) {
        console.error('Error borrowing:', error);
        toast.error("Failed");
      }
    }
  };
  async function checkAndApprove( owner: string, spender: string, amount: any) {
    const tokenContract = new ethers.Contract(usdtToken, tokenABI, signer);
    const allowance = await tokenContract.allowance(owner, spender);
    if (allowance<amount) {
      const tx = await tokenContract.approve(spender, amount);
      await tx.wait();
  }
}
  const repayUsdt = async () => {
    if (!contract || !account || !usdtAmount || !conversionRate) return; 
    if (contract && account && usdtAmount > 0 && conversionRate > 0) {
      try {
        setLoader(true);
        const amt = ethers.parseUnits(usdtAmount.toString(), 18);
        setUsdtAmount(0);
        await checkAndApprove(account, contractAddress, amt);
        const btcConsuming = usdtAmount / conversionRate;
        const satosis = BigInt((btcConsuming * 1e8).toFixed(0)); 
        const tx = await contract.repay(usdtToken, amt, satosis, bytesBtcAdress, { from: account, gasLimit: 1000000 }); // Setting a higher gas limit for testing
        await tx.wait();
        setLoader(false);
        const url = `${explorerUrl}/tx/${tx.hash}`;
        toast.success(<>Repayed USDT Successfully <br/><a href={url} target="_blank" >view on explorer</a></>);
      } catch (error) {
        console.error('Error repaying:', error);
        toast.error("Failed to repay");
      }
    } else {
      toast.error("Invalid input parameters");
    }
  };
  async function getBtcToInr() {
    const url = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=inr';
    try {
      const response = await fetch(url);
      const data = await response.json();
      return data.bitcoin.inr;
    } catch (error) {
      return 5616358;
    }
  }
  async function getUsdtToInr() {
    const url = 'https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=inr';
    try {
      const response = await fetch(url);
      const data = await response.json();
      return data.tether.inr;
    } catch (error) {
      return 83.74;
    }
  }
  useEffect(() => {
    netAPYCalc()
  })
  async function netAPYCalc() {
    const btcReward = 0.08;
    const usdtInterst = 0.05;
    if (!btcInr || !usdtInr) return;
    const apy = ((btcInr * btcReward) - (usdtInr * usdtInterst)) / (btcInr - usdtInr);
    setNetAPY(apy);
    return apy;
  }

  return (
    <>
      <ToastContainer />
      <div className={DashBoardStyles.dashboard}>
        <header className={HeaderStyles.header}>
          <div className={HeaderStyles.logo}>
            <span>Garden</span>
          </div>
          <nav className={HeaderStyles.nav}>
            <ul>
              <li><b>Lend</b></li>
              <li>Swap</li>
              <li>Stake</li>
              <li>Faucet</li>
            </ul>
          </nav>
          <div className={HeaderStyles.user}>
            {BTCconnected ?
              (<><button className="button-white" >{truncateAddress(BTCaddress, 6, 4)}</button><div>BTC: {(BTCbalance/1e8).toFixed(4)}</div></>) : (<button className="button-white" onClick={connectBTCWallet}>Connect BTC Wallet </button>)}
          </div>
          <div className={HeaderStyles.user}>
            {account ? (<><button className="button-white" >{truncateAddress(account, 6, 4)}</button> <div>SepETH: {ETHBalance.toFixed(4)}</div></>) : (<button className="button-white" onClick={connectMetaMask}>Connect MetaMask</button>
            )}
          </div>
        </header>
        <div className={DashBoardStyles.marketHeader}>
          <h1>Bitcoin Lending Platform <div> (BTC/USDT)</div></h1>
          <div className={DashBoardStyles.marketDetails}>
            <div className={DashBoardStyles.marketDetailBox}>
              <div>Net APY</div>
              <div className={DashBoardStyles.amount}>{netAPY?.toFixed(2) ?? 0.00}%</div>
            </div>
            <div className={DashBoardStyles.marketDetailBox}>
              <div>Collateral</div>
              <div className={DashBoardStyles.amount}>80%</div>
            </div>
            <div className={DashBoardStyles.marketDetailBox}>
              <div>Liquidation Threshold </div>
              <div className={DashBoardStyles.amount}>85%</div>
            </div>
          </div>
        </div>
        <main className={DashBoardStyles.main}>
          <div className={styles.card}>
            <h2>Your Lendings</h2>
            <hr />
            <div className={styles.details}><br />
              <div className={styles.row}>
                <div className={styles.asset}>
                  <div className='input-style'>Balance: {(btcBal ? btcBal : 0).toFixed(4)} BTC</div>
                  <div>₹ {(btcInr && btcInr > 10 ? btcInr : 0).toFixed(2)}</div>
                </div>
                <div className={styles.asset}>
                  <div className='input-style'>Available to Withdraw</div>
                  <div>{(possibleBTCWithdrawal ? possibleBTCWithdrawal : 0).toFixed(4)} BTC</div>
                </div>
              </div>
              {lendBtcComponent}
            </div>
          </div>
          <div className={BorrowStyles.card}>
            <h2>Your borrowings</h2>
            <hr />
            <div className={BorrowStyles.details}><br />
              <div className={BorrowStyles.row}>
                <div className={BorrowStyles.asset}>
                  <div className='input-style'> Balance:{(usdtBal ? usdtBal : 0).toFixed(4)}USDT</div>
                  <div>₹ {(usdtInr ? usdtInr : 0).toFixed(2)}</div>
                </div>
                <div className={BorrowStyles.asset}>
                  <div className='input-style'>Available to Borrow  </div>
                  <div>{(limit ? limit : 0).toFixed(4)} USDT</div>
                </div>
              </div>
              <div className={styles.row}>
                <div className={BorrowStyles.asset}>
                  <input
                    type="number"
                    placeholder="Enter USDT Amount"
                    value={usdtAmount ?? ''}
                    onChange={(e) => setUsdtAmount(Number(e.target.value))}
                    className="input-style"
                  />
                </div>
                <div className={BorrowStyles.borrowActions}>
                  <button className={BorrowStyles.borrowButton} onClick={borrow}>Borrow</button>
                  <button className={BorrowStyles.repayButton} onClick={repayUsdt}>Repay</button>
                </div>
              </div>
            </div>
            {Loader && <div className="loader"></div>}
          </div>
        </main>
      </div>
    </>
  );
};
export default LendingBorrowing;
