const { 
    log, 
    delay,
} = require("../utils/logger");

const { createToken } = require("./arc");
const { checkIn } = require("./checkIn");
const { faucetETH, faucetGOON } = require("./faucet");
const { kumaBond } = require("./kumabond");
const { landShare } = require("./landshare");
const { predict } = require("./predict");
const { stake } = require("./stake");
const { swapTokens } = require("./swap");

async function runAllTasks() {
    while (true) {
        await checkIn();
        await delay(3);
        await faucetETH();
        await delay(3);
        await faucetGOON();
        await delay(3);
        await swapTokens();
        await delay(3);
        await createToken();
        await delay(3);
        await landShare();
        await delay(3);
        await stake();
        await delay(3);
        await kumaBond();
        await delay(3);
        await predict();
        await delay(3);
        log("INFO", "All tasks completed for all wallets.");
    }
}

module.exports = {
  'runAllTasks': runAllTasks,
};