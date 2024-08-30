const { ethers } = require("ethers");

const { createWallet, extractAddressParts } = require("../config/wallet");
const {
  provider,
  PRIVATE_KEYS,
} = require('../config/config');

const { 
    log, 
    delay,
} = require("../utils/logger");
const { sendTelegramMessage } = require("../utils/telegram");

const { 
    getTokenBalance, 
    stakeABI,
    ERC20_ABI,
} = require("./tools");

async function stakeTokens(privateKey) {
  let success = false;
  while (!success) {
    try {
      const wallet = createWallet(privateKey, provider);
      const address = wallet.address;
      log('DEBUG', "Wallet address: " + address);

      const balance = await getTokenBalance(wallet, '0x5c1409a46cd113b3a667db6df0a8d7be37ed3bb3');
      log("DEBUG", "goonUSD Balance: " + balance);
      if (parseFloat(balance) <= 0) {
        log('ERROR', "Insufficient goonUSD balance for staking.");
        success = true;
        const tgMessage = `${extractAddressParts(address)} | Nest Staking Failed, Insufficient goonUSD balance for staking. ❌`;
        await sendTelegramMessage(tgMessage);
        return;
      }

      const approveContract = new ethers.Contract('0x5c1409a46cd113b3a667db6df0a8d7be37ed3bb3', ERC20_ABI, wallet);
      const approveAmount = ethers.parseUnits(balance.toString(), 0x12);
      const approve = await approveContract.approve('0xA34420e04DE6B34F8680EE87740B379103DC69f6', approveAmount);
      const approveTx = await approve.wait();
      if (approveTx.status !== 1) {
        log("ERROR", "Approve Failed!");
        continue;
      }
      log("INFO", "Staking " + balance + " goonUSD in Nest Staking");

      const stakeContract = new ethers.Contract('0xA34420e04DE6B34F8680EE87740B379103DC69f6', stakeABI, wallet);
      const stake = await stakeContract.stake(approveAmount);
      const stakeTx = await stake.wait();
      if (stakeTx.status !== 1) {
        log('ERROR', "Stake Failed!");
        continue;
      }

      log("SUCCESS", "Stake gnUSD successful: https://testnet-explorer.plumenetwork.xyz/tx/" + stakeTx.hash);
      success = true;
      const tgMessage = `${extractAddressParts(address)} | Nest Staking Successfully ✅`;
      await sendTelegramMessage(tgMessage);
    } catch (error) {
      const wallet = createWallet(privateKey, provider);
      const address = wallet.address;
      if (error.message.includes("CALL_EXCEPTION")) {
        log("ERROR", "Insufficient balance!");
        success = true;
        const tgMessage = `${extractAddressParts(address)} | Nest Staking Failed, Insufficient balance! ❌`;
        await sendTelegramMessage(tgMessage);
      } else {
        log("ERROR", "Transaction error: " + error.message);
        log("ERROR", "Retrying in 5 seconds...");
        await delay(5);
      }
    }
  }
}

async function stake() {
  for (const PRIVATE_KEY of PRIVATE_KEYS) {
    await stakeTokens(PRIVATE_KEY);
    await delay(5);
  }
  log('INFO', "Staking completed for all wallets.");
}

module.exports = {
  'stake': stake,
}