const { ethers } = require("ethers");

const {
  provider,
  PRIVATE_KEYS,
} = require('../config/config');

const { extractAddressParts } = require("../config/wallet");

const { 
    log, 
    delay,
} = require("../utils/logger");
const { sendTelegramMessage } = require("../utils/telegram");

const abiKUMAMint = ["function mintAICK() public", "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"];
const abiKUMABonds = ["function approve(address to, uint256 tokenId) public"];
const abiSell = ["function sellBond(uint256 tokenId) public"];

async function mintApproveSellNFT(wallet) {
  let success = false;
  while (!success) {
    try {
      const KUMAMintContract = new ethers.Contract("0x8504a242d86C7D84Fd11E564e6291f0A20d6C2a2", abiKUMAMint, wallet);
      const KUMABondsContract = new ethers.Contract('0x763Ccc2Cb06Eb8932208C5714ff5c010894Ac98d', abiKUMABonds, wallet);
      const sellKUMAContract = new ethers.Contract("0xA4E9ddAD862A1B8b5F8e3d75a3AAd4C158E0faaB", abiSell, wallet);
      const KUMAMint = await KUMAMintContract.mintAICK();
      const KUMAMintTx = await KUMAMint.wait();
      const KUMAMintTxExists = KUMAMintTx.logs.find(logs => logs.topics[0] === '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef');
      if (KUMAMintTxExists) {
        const NftId = KUMAMintTxExists.topics[0x3];
        const KumaNftId = ethers.toBigInt(NftId).toString();
        log("SUCCESS", "Mint successful: https://testnet-explorer.plumenetwork.xyz/tx/" + KUMAMintTx.hash);
        log('INFO', "Token ID: " + KumaNftId);
        const KUMABonds = await KUMABondsContract.approve("0xA4E9ddAD862A1B8b5F8e3d75a3AAd4C158E0faaB", KumaNftId);
        await KUMABonds.wait();
        const sellKUMA = await sellKUMAContract.sellBond(KumaNftId);
        await sellKUMA.wait();
        log("SUCCESS", "Kuma Bond " + KumaNftId + " sold: https://testnet-explorer.plumenetwork.xyz/tx/" + sellKUMA.hash);
        success = true;

        const tgMessage = `${extractAddressParts(wallet.address)} | Kuma NFT Successfully ✅`;
        await sendTelegramMessage(tgMessage);
      } else {
        log("ERROR", "Transfer event not found in logs");
        log("ERROR", "Retrying in 5 seconds...");
        await delay(5);
      }
    } catch (error) {
      if (error.message.includes("execution reverted: \"Wallet already minted\"")) {
        log('ERROR', "Wallet already minted. ");
        success = true;
        const tgMessage = `${extractAddressParts(wallet.address)} | Kuma NFT already minted before ❌`;
        await sendTelegramMessage(tgMessage);
      } else {
        log("ERROR", "Error processing wallet: " + error.message);
        log("ERROR", "Retrying in 5 seconds...");
        await delay(5);
      }
    }
  }
}

async function mintAndSellKuma(privateKey) {
  try {
    const wallet = new ethers.Wallet(privateKey, provider);
    const address = wallet.address;
    log("DEBUG", "Wallet address: " + address);
    await mintApproveSellNFT(wallet);
  } catch (error) {
    log("ERROR", "Transaction error: " + error.message);
  }
}

async function kumaBond() {
  for (const PRIVATE_KEY of PRIVATE_KEYS) {
    await mintAndSellKuma(PRIVATE_KEY);
    await delay(5);
  }
  log('INFO', "Mint and Sell Kuma Bond completed for all wallets.");
}

module.exports = {
    'kumaBond': kumaBond,
}