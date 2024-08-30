const fetch = require("node-fetch");
const { ethers } = require("ethers");

const { 
    log, 
    delay, 
} = require("../utils/logger");

const stakeABI = [
    {
        'inputs': [
            {
                'internalType': "uint256",
                'name': 'amount',
                'type': "uint256"
            }
        ],
        'name': "stake",
        'outputs': [],
        'stateMutability': "nonpayable",
        'type': "function"
    }, 
    {
        'inputs': [],
        'name': 'claim',
        'outputs': [],
        'stateMutability': "nonpayable",
        'type': "function"
    }
];

const ERC20_ABI = [
    {
        'constant': true,
        'inputs': [
            {
                'name': "_owner",
                'type': "address"
            }
        ],
        'name': 'balanceOf',
        'outputs': [
            {
                'name': "balance",
                'type': "uint256"
            }
        ],
        'type': "function"
    }, 
    {
        'constant': false,
        'inputs': [
            {
                'name': '_spender',
                'type': "address"
            },
            {
                'name': '_value',
                'type': 'uint256'
            }
        ],
        'name': "approve",
        'outputs': [
            {
               'name': "success",
                'type': "bool"
            }
        ],
        'type': 'function'
    }
];

async function getTokenBalance(wallet, token) {
    const contract = new ethers.Contract(token, ERC20_ABI, wallet);
    const balance = await contract.balanceOf(wallet.address);
    return ethers.formatUnits(balance, 0x12);
}

async function approveToken(contractAddress, _0x29e2c2, amount, wallet) {
    const approveContract = new ethers.Contract(contractAddress, ["function approve(address spender, uint256 amount) public returns (bool)"], wallet);
    try {
      const approveTransaction = await approveContract.approve(_0x29e2c2, ethers.parseUnits(amount.toString(), 0x12));
      await approveTransaction.wait();
    } catch (error) {
      log("ERROR", "Approval error: " + error.message, error);
      throw error;
    }
}

const twocaptcha_turnstile = (sitekey, pageurl) => new Promise(async (resolve) => {
    try {
        const captchaKey = process.env.CAPTCHA_KEY;
        const getToken = await fetch(`https://2captcha.com/in.php?key=${captchaKey}&method=turnstile&sitekey=${sitekey}&pageurl=${pageurl}&json=1`, {
            method: 'GET',
        })
        .then(res => res.json())
        .then(res => {
            if (res == 'ERROR_WRONG_USER_KEY' || res == 'ERROR_ZERO_BALANCE') {
                return resolve(res);
            } else {
                return res;
            }
        });

        if (getToken.status != 1) {
            resolve('FAILED_GETTING_TOKEN');
        }
    
        const task = getToken.request;

        for (let i = 0; i < 60; i++) {
            const token = await fetch(
                `https://2captcha.com/res.php?key=${captchaKey}&action=get&id=${task}&json=1`
            ).then(res => res.json());
            
            if (token.status == 1) {
                resolve(token);
                break;
            }
            await delay(1);
        }
    } catch (error) {
        resolve('FAILED_GETTING_TOKEN ' + error);
    }
});
  
module.exports = {
    'getTokenBalance': getTokenBalance,
    'approveToken': approveToken,
    'stakeABI': stakeABI,
    'ERC20_ABI': ERC20_ABI,
    'twocaptcha_turnstile': twocaptcha_turnstile,
};