const { ethers } = require("ethers");

const {
  createWallet,
  getAddress,
  extractAddressParts,
} = require("../config/wallet");
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
} = require("./tools");

async function callCheckInForKey(privateKey) {
    const abi = ["function checkIn() public"];
    const wallet = createWallet(privateKey, provider);
    const checkInContract = new ethers.Contract('0x8Dc5b3f1CcC75604710d9F464e3C5D2dfCAb60d8', abi, wallet);
    
    let success = false;
    while (!success) {
      try {
        const address = getAddress(privateKey, provider);
        log("DEBUG", "Wallet address: " + address);
    
        const claimNestContract = new ethers.Contract('0xA34420e04DE6B34F8680EE87740B379103DC69f6', stakeABI, wallet);
        log("INFO", "CheckIn and Claiming Nest Staking rewards");
        const claimNest = await claimNestContract.claim();
        const claimNestTx = await claimNest.wait();
        log("SUCCESS", "Reward staking has been claimed: https://testnet-explorer.plumenetwork.xyz/tx/" + claimNestTx.hash);
    
        const nestBalance = await getTokenBalance(wallet, "0xd806259C3389Da7921316fb5489490EA5E2f88C6");
        log('DEBUG', "NEST balance: " + nestBalance);
        
        const checkIn = await checkInContract.checkIn();
        const checkInTx = await checkIn.wait();
        log("SUCCESS", "CheckIn successful: https://testnet-explorer.plumenetwork.xyz/tx/" + checkInTx.hash);
    
        success = true;

        const tgMessage = `${extractAddressParts(address)} | Daily Check In Successfully ✅`;
        await sendTelegramMessage(tgMessage);
      } catch (error) {
        if (error.message.includes("execution reverted")) {
          log('ERROR', "Please try again the next day.");
          success = true;
        } else {
          log('ERROR', "Error calling checkIn: " + error.message);
          log("ERROR", "Retrying in 5 seconds...");
          await delay(5);
        }
      }
    }
}

async function checkIn() {
    for (const PRIVATE_KEY of PRIVATE_KEYS) {
      await callCheckInForKey(PRIVATE_KEY);
      await delay(5);
    }
    log("INFO", "Check-in completed for all wallets.");
}

module.exports = {
    'checkIn': checkIn,
};