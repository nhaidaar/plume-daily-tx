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
    approveToken,
} = require("./tools");

async function stakeLandshare(privateKey) {
  let success = false;
  while (!success) {
    try {
      const wallet = createWallet(privateKey, provider);
      const address = wallet.address;
      log("DEBUG", "Wallet address: " + address);

      const gnUsdBalance = await getTokenBalance(wallet, '0x5c1409a46cd113b3a667db6df0a8d7be37ed3bb3');
      log("DEBUG", "gnUSD Balance: " + gnUsdBalance + " gnUSD");
      if (parseFloat(gnUsdBalance) <= 0) {
        log("ERROR", "Insufficient goonUSD balance for swap.");
        success = true;
        const tgMessage = `${extractAddressParts(address)} | Stake Landshare Failed, Insufficient goonUSD balance for swap. ❌`;
        await sendTelegramMessage(tgMessage);
        return;
      }

      const swapAbi = ["function swap() public"];
      log('INFO', "Swapping 0.1 gnUSD for LAND");
      await approveToken("0x5c1409a46cd113b3a667db6df0a8d7be37ed3bb3", '0xd2AadE12760d5e176F93C8F1C6Ae10667c8FCa8b', 0.1, wallet);
      
      const swapLandContract = new ethers.Contract('0xd2AadE12760d5e176F93C8F1C6Ae10667c8FCa8b', swapAbi, wallet);
      const swapLand = await swapLandContract.swap();
      const swapLandTx = await swapLand.wait();
      log("SUCCESS", "Swap to LAND successful: https://testnet-explorer.plumenetwork.xyz/tx/" + swapLandTx.hash);

      const landBalance = await getTokenBalance(wallet, "0x45934E0253955dE498320D67c0346793be44BEC0");
      log("DEBUG", "LAND Balance: " + landBalance + " LAND");
      if (parseFloat(landBalance) <= 0) {
        log('ERROR', "Insufficient LAND balance for staking.");
        success = true;
        const tgMessage = `${extractAddressParts(address)} | Stake Landshare Failed, Insufficient LAND balance for staking. ❌`;
        await sendTelegramMessage(tgMessage);
        return;
      }

      const landAmount = ethers.parseUnits('0.1', 0x12);
      await approveToken("0x45934E0253955dE498320D67c0346793be44BEC0", "0x5374Cf69C5610950526C668A7B540df6686531b4", landAmount, wallet);
      log("INFO", "Staking 0.1 LAND in LandShare");
      const depositLandAbi = ["function deposit(uint256 _pid, uint256 _amount) public returns (bool)"];
      const depositLandContract = new ethers.Contract("0x5374Cf69C5610950526C668A7B540df6686531b4", depositLandAbi, wallet);
      const depositLandTx = await depositLandContract.deposit(0, landAmount);
      log("SUCCESS", "Stake LAND successful: https://testnet-explorer.plumenetwork.xyz/tx/" + depositLandTx.hash);

      success = true;
      const tgMessage = `${extractAddressParts(address)} | Stake Landshare Successfully ✅`;
      await sendTelegramMessage(tgMessage);
    } catch (error) {
      const wallet = createWallet(privateKey, provider);
      const address = wallet.address;

      if (error.message.includes("execution reverted: \"TF\"")) {
        log('ERROR', "Insufficient goonUSD balance for swap.");
        success = true;
        const tgMessage = `${extractAddressParts(address)} | Stake Landshare Failed, Insufficient goonUSD balance for swap. ❌`;
        await sendTelegramMessage(tgMessage);
      } else {
        log("ERROR", "Transaction error: " + error.message, error);
        log("ERROR", "Retrying in 5 seconds...");
        await delay(5);
      }
    }
  }
}

async function landShare() {
    for (const PRIVATE_KEY of PRIVATE_KEYS) {
      await stakeLandshare(PRIVATE_KEY);
      await delay(5);
    }
    log('INFO', "Swap and Stake in Landshare completed for all Wallet.");
}

module.exports = {
    'landShare': landShare
};