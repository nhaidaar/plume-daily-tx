const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { HttpsProxyAgent } = require("https-proxy-agent");

const {
  createWallet,
  getAddress,
  extractAddressParts
} = require("../config/wallet");

const {
  provider,
  PRIVATE_KEYS,
  CONTRACT_ADDRESS,
} = require('../config/config');

const { 
    log, 
    delay,
} = require("../utils/logger");
const { sendTelegramMessage } = require("../utils/telegram");
const { twocaptcha_turnstile } = require("./tools");

const proxies = fs.readFileSync(path.join(__dirname, "../config/proxy.txt"), "utf-8").trim().split("\n");

function parseProxy(proxies) {
    const param = proxies.split(':');
    if (param.length === 0x4) {
      const [username, password, host, port] = param;
      return {
        'username': username,
        'password': password,
        'host': host,
        'port': port
      };
    } else {
      if (param.length === 0x2) {
        const [host, port] = param;
        return {
          'host': host,
          'port': port
        };
      } else {
        throw new Error("Invalid proxy format: " + error);
      }
    }
}

async function getAuth(walletAddress, token) {
    const captcha = await twocaptcha_turnstile("0x4AAAAAAAViEapSHoQXHmzu", "https://faucet.plumenetwork.xyz/");

    const defaultHeaders = {
      'User-Agent': captcha.useragent,
      'sec-ch-ua': "\"Not)A;Brand\";v=\"99\", \"Google Chrome\";v=\"127\", \"Chromium\";v=\"127\"",
      'Content-Type': "application/json",
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': "\"Windows\"",
      'sec-fetch-site': "same-origin",
      'sec-fetch-mode': "cors",
      'sec-fetch-dest': "empty",
      'referer': 'https://faucet.plumenetwork.xyz/',
      'accept-language': 'en-US,en;q=0.9',
      'pragma': "no-cache",
      'origin': "https://faucet.plumenetwork.xyz"
    };
  
    const result = await axios.post("https://faucet.plumenetwork.xyz/api/faucet", {
      'walletAddress': walletAddress,
      'verified': captcha.request,
      'token': token
    }, {
      'headers': defaultHeaders
    });
  
    return result.data;
}

async function claimFaucetETH(privateKey, proxies) {
    try {
        const address = getAddress(privateKey, provider);
        log("DEBUG", "Wallet address: " + address);

        log("INFO", "Requesting ETH tokens from the faucet...");
        const {
            host: host,
            port: port,
            username: username,
            password: password
        } = parseProxy(proxies);
        const proxyUrl = "http://" + username + ':' + password + '@' + host + ':' + port;
        const proxy = new HttpsProxyAgent(proxyUrl);
        axios.default.httpAgent = proxy;
        axios.default.httpsAgent = proxy;
        log("DEBUG", `Proxy is connected to ${host} !`);

        const {
            salt: salt,
            signature: signature
        } = await getAuth(address, "ETH");
        const wallet = createWallet(privateKey, provider);
        const data = "0x103fc4520000000000000000000000000000000000000000000000000000000000000060" + salt.substring(0x2) + "00000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000000000000000000345544800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000041" + signature.substring(0x2) + "00000000000000000000000000000000000000000000000000000000000000";
        const transaction = {
            'data': data,
            'to': CONTRACT_ADDRESS,
            'value': 0
        };
        const claimFaucetTransaction = await wallet.sendTransaction(transaction);
        await claimFaucetTransaction.wait();
        log("SUCCESS", "Transaction successful: https://testnet-explorer.plumenetwork.xyz/tx/" + claimFaucetTransaction.hash);

        const tgMessage = `${extractAddressParts(address)} | Plume ETH Faucet Successfully ✅`;
        await sendTelegramMessage(tgMessage);
    } catch (error) {
        const wallet = createWallet(privateKey, provider);
        const address = wallet.address;
        let errorMsg = "";
        if (error.message.includes("Invalid admin signature") || error.message.includes("Signature is already used")) {
            log("ERROR", "Please try again in 1 hours!");
            errorMsg += "Please try again in 1 hours!";
        } else {
            log("ERROR", "Failed to claim faucet for wallet !!!");
            errorMsg += "Unknown Error";
        }
        const tgMessage = `${extractAddressParts(address)} | Plume ETH Faucet Failed, ${errorMsg} ❌`;
        await sendTelegramMessage(tgMessage);
    }
}

async function faucetETH() {
    for (let index = 0; index < PRIVATE_KEYS.length; index++) {
        const PRIVATE_KEY = PRIVATE_KEYS[index];
        const proxy = proxies[index % proxies.length];
        await claimFaucetETH(PRIVATE_KEY, proxy);
        await delay(5);
    }
    log("INFO", "Faucet ETH completed for all Wallet.");
}

async function claimFaucetGOON(privateKey, proxies) {
    let success = false;
    while (!success) {
        try {
            const address = getAddress(privateKey, provider);
            log("DEBUG", "Wallet address: " + address);
            log("INFO", "Requesting GOON tokens from the faucet...");
            
            const {
                host: host,
                port: port,
                username: username,
                password: password
            } = parseProxy(proxies);
            const proxyUrl = "http://" + username + ':' + password + '@' + host + ':' + port;
            const proxy = new HttpsProxyAgent(proxyUrl);
            axios.default.httpAgent = proxy;
            axios.default.httpsAgent = proxy;
            log("DEBUG", `Proxy is connected to ${host} !`);
    
            const {
                salt: salt,
                signature: signature
            } = await getAuth(address, "GOON");
            const wallet = createWallet(privateKey, provider);
            const data = "0x103fc4520000000000000000000000000000000000000000000000000000000000000060" + salt.substring(0x2) + "00000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000004474f4f4e000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000041" + signature.substring(0x2) + '00000000000000000000000000000000000000000000000000000000000000';
            const transaction = {
                'data': data,
                'to': CONTRACT_ADDRESS,
                'value': 0
            };
            const claimFaucetTransaction = await wallet.sendTransaction(transaction);
            await claimFaucetTransaction.wait();
            log("SUCCESS", "Transaction successful: https://testnet-explorer.plumenetwork.xyz/tx/" + claimFaucetTransaction.hash);
    
            success = true;

            const tgMessage = `${extractAddressParts(address)} | Plume GOON Faucet Successfully ✅`;
            await sendTelegramMessage(tgMessage);
        } catch (error) {
            const wallet = createWallet(privateKey, provider);
            const address = wallet.address;
            let errorMsg = "";
            if (error.message.includes("Invalid admin signature") || error.message.includes("Signature is already used")) {
                success = true;
                log("ERROR", "Please try again in 2 hours!");
                errorMsg += "Please try again in 2 hours!";
                const tgMessage = `${extractAddressParts(address)} | Plume GOON Faucet Failed, ${errorMsg} ❌`;
                await sendTelegramMessage(tgMessage);
            } else {
                log('ERROR', "Failed to claim faucet for wallet !!!");
                log("ERROR", "Retrying in 5 seconds...");
                await delay(5);
            }
        }
    }
}
async function faucetGOON() {
    for (let index = 0; index < PRIVATE_KEYS.length; index++) {
        const PRIVATE_KEY = PRIVATE_KEYS[index];
        const proxy = proxies[index % proxies.length];
        await claimFaucetGOON(PRIVATE_KEY, proxy);
        await delay(5);
    }
    log("INFO", "Faucet GOON completed for all Wallet.");
}

module.exports = {
    'faucetETH': faucetETH,
    'faucetGOON': faucetGOON,
};