const fs = require("fs");
const path = require("path");

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

function getRandomData() {
    const rwa = path.join(__dirname, '../config/datarwa.json');
    const rwaData = JSON.parse(fs.readFileSync(rwa, "utf8")).items;
    const randomIndex = Math.floor(Math.random() * rwaData.length);
    return rwaData[randomIndex];
}
  
async function callCreateTokenForKey(privateKey) {
  let success = false;
    while (!success) {
      try {
        const wallet = createWallet(privateKey, provider);
        const address = wallet.address;
        log("DEBUG", "Wallet address: " + address);
        const createTokenContract = new ethers.Contract("0x485D972889Ee8fd0512403E32eE94dE5c7a5DC7b", ["function createToken(string name, string symbol, string description, uint256 rwaType, string image) public"], wallet);
        const data = getRandomData();
        const name = data.name;
        const description = data.description;
        const rwaType = data.rwaType;
        const image = data.image;
        try {
          const createTokenTx = await createTokenContract.createToken(name, 'ITEM', description, rwaType, image);
          log("SUCCESS", "Transaction successful: https://testnet-explorer.plumenetwork.xyz/tx/" + createTokenTx.hash);
          await createTokenTx.wait();
          log("SUCCESS", "Asset tokenized " + name + " created.");

          success = true;

          const tgMessage = `${extractAddressParts(address)} | Plume Arc Successfully ✅`;
          await sendTelegramMessage(tgMessage);
        } catch (error) {
          log("ERROR", "Error calling createToken: " + error.message);
          log("ERROR", "Retrying in 5 seconds...");
          await delay(5);
        }
      } catch (error) {
        log("ERROR", "Critical error: " + error.message);
        log("ERROR", "Retrying in 5 seconds...");
        await delay(5);
      }
    }
}
  
async function createToken() {
    for (const PRIVATE_KEY of PRIVATE_KEYS) {
      await callCreateTokenForKey(PRIVATE_KEY);
      await delay(5);
    }
    log("INFO", "Create Token completed for all Wallet.");
}

module.exports = {
    'createToken': createToken,
}