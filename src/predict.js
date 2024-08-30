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

const pairs = {
    0: "ETH/USDT",
    1: "BTC/USDT",
    2: "ARB/USDT",
    3: "EUR/USD",
    4: "USD/JPY",
    5: 'GBP/USD',
    6: "SOL/USDT",
    7: "USD/HKD",
    8: "TIA/USDT",
    9: 'USD/VND',
    10: 'MKR/USDT',
    11: "USD/SGD",
    12: "ONDO/USDT",
    13: 'USD/INR'
};
  
function getPredictionMessage(predictPair, predictType) {
    const pair = pairs[predictPair];
    const prediction = predictType ? 'up' : "down";
    return pair + " is predicted to " + prediction + " in the next 1 hour.";
}
  
async function callPredictPriceMovement(privateKey, predictPair, predictType) {
    let success = false;
    while (!success) {
        try {
          const wallet = createWallet(privateKey, provider);
          const address = wallet.address;
          log("DEBUG", "Wallet address: " + address);
          const predictContract = new ethers.Contract("0x032139f44650481f4d6000c078820B8E734bF253", ["function predictPriceMovement(uint256 pairIndex, bool isLong) public"], wallet);
          try {
            const prediction = await predictContract.predictPriceMovement(predictPair, predictType);
            const predictMessage = getPredictionMessage(predictPair, predictType);
            log("INFO", predictMessage);
            
            const predictTx = await prediction.wait();
            log('SUCCESS', "Transaction successful: https://testnet-explorer.plumenetwork.xyz/tx/" + predictTx.hash);
            success = true;
            const tgMessage = `${extractAddressParts(address)} | Plume Prediction Successfully ✅`;
            await sendTelegramMessage(tgMessage);
          } catch (error) {
            if (error.message.includes("Wait for cooldown")) {
                const errorMsg = "Please try again in 1 hour!"
                log("ERROR", errorMsg);
                success = true;
                const tgMessage = `${extractAddressParts(address)} | Plume Prediction Failed, ${errorMsg} ❌`;
                await sendTelegramMessage(tgMessage);
            }
          }
        } catch (error) {
          log('ERROR', "Critical error: " + error.message);
          log("ERROR", "Retrying in 5 seconds...");
          await delay(5);
        }
    }
}
  
async function predict() {
    for (const PRIVATE_KEY of PRIVATE_KEYS) {
      const randomPair = Math.floor(Math.random() * 14) + 0;
      const randomPredict = Math.random() < 0.13;
      await callPredictPriceMovement(PRIVATE_KEY, randomPair, randomPredict);
      await delay(5);
    }
    log('INFO', "Prediction completed for all Wallet.");
}

module.exports = {
    'predict': predict,
}