const { ethers } = require("ethers");

const {
  createWallet,
  extractAddressParts,
} = require("../config/wallet");
const {
  provider,
  PRIVATE_KEYS,
  MIN_SWAP,
  MAX_SWAP
} = require('../config/config');

const { 
    log, 
    delay,
} = require("../utils/logger");
const { CrocEnv } = require("@crocswap-libs/sdk");
const { sendTelegramMessage } = require("../utils/telegram");
const { 
    getTokenBalance, 
    approveToken 
} = require("./tools");

async function performSwapForKey(privateKey) {
  let success = false;  
  while (!success) {
    try {
      const wallet = createWallet(privateKey, provider);
      const address = wallet.address;
      log('DEBUG', "Wallet address: " + address);

      const balance = await getTokenBalance(wallet, '0xba22114ec75f0d55c34a5e5a3cf384484ad9e733');
      log("DEBUG", "GOON Balance: " + balance);

      const crocEnv = new CrocEnv("0x99c0a0f", wallet);
      const amount = (Math.random() * (parseFloat(MAX_SWAP) - parseFloat(MIN_SWAP)) + parseFloat(MIN_SWAP)).toFixed(0x4);
      log("INFO", "Swapping " + amount + " GOON for goonUSD");

      await approveToken("0xba22114ec75f0d55c34a5e5a3cf384484ad9e733", '0x4c722A53Cf9EB5373c655E1dD2dA95AcC10152D1', amount, wallet);
      const swapTransaction = await crocEnv.sell("0xba22114ec75f0d55c34a5e5a3cf384484ad9e733", ethers.parseUnits(amount.toString(), 0x12))["for"]("0x5c1409a46cd113b3a667db6df0a8d7be37ed3bb3").swap();
      log("SUCCESS", "Transaction successful: https://testnet-explorer.plumenetwork.xyz/tx/" + swapTransaction.hash);

      success = true;
      const tgMessage = `${extractAddressParts(address)} | Swap GOON -> goonUSD Successfully ✅`;
      await sendTelegramMessage(tgMessage);
    } catch (error) {
      const wallet = createWallet(privateKey, provider);
      const address = wallet.address;
      let errorMessage = "";
      if (error.message.includes("execution reverted: \"TF\"")) {
        log("ERROR", "Insufficient GOON balance for swap.");
        errorMessage += "Insufficient GOON balance for swap.";
        success = true;
        const tgMessage = `${extractAddressParts(address)} | Swap GOON -> goonUSD Failed, ${errorMessage} ❌`;
        await sendTelegramMessage(tgMessage);
      } else {
        log('ERROR', "Transaction error: " + error.message, error);
        log("ERROR", "Retrying in 5 seconds...");
        await delay(5);
      }
    }
  }
}
async function swapTokens() {
    for (const PRIVATE_KEY of PRIVATE_KEYS) {
      await performSwapForKey(PRIVATE_KEY);
      await delay(5);
    }
    log("INFO", "Swap completed for all Wallet.");
}

module.exports = {
    'swapTokens': swapTokens
};