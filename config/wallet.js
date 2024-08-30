const { ethers } = require('ethers');

function createWallet(privateKey, provider) {
  return new ethers.Wallet(privateKey, provider);
}

function getAddress(privateKey, provider) {
  const wallet = createWallet(privateKey, provider);
  return wallet.address;
}

function extractAddressParts(address) {
  const firstThree = address.slice(0, 4);
  const lastFour = address.slice(-4);
  return `${firstThree}...${lastFour}`;
}

module.exports = { createWallet, getAddress, extractAddressParts };
