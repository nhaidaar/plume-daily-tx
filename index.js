require("dotenv").config();
const readline = require("readline");
const chalk = require("chalk");
const { printName } = require("./utils/name");

const { createToken } = require("./src/arc");
const { checkIn } = require("./src/checkIn");
const { faucetETH, faucetGOON } = require("./src/faucet");
const { kumaBond } = require("./src/kumabond");
const { landShare } = require("./src/landshare");
const { predict } = require("./src/predict");
const { stake } = require("./src/stake");
const { swapTokens } = require("./src/swap");
const { runAllTasks } = require("./src/main");

function promptUser(_0x3fb497) {
  return new Promise(_0x572bc9 => {
    const _0x461ac6 = readline.createInterface({
      'input': process.stdin,
      'output': process.stdout
    });
    _0x461ac6.question(chalk.blueBright(_0x3fb497), _0x43573a => {
      _0x461ac6.close();
      _0x572bc9(_0x43573a);
    });
  });
}

async function main() {
  printName();
  async function _0x1f6b85() {
    console.log(chalk.yellow("Available Scripts:"));
    console.log("1. CheckIn");
    console.log("2. Claim Faucet ETH");
    console.log("3. Claim Faucet GOON");
    console.log("4. Swap GOON/goonUSD");
    console.log("5. Stake goonUSD");
    console.log("6. Predict ETH/BTC/ARB Price");
    console.log("7. Create Asset Tokenized");
    console.log("8. Swap and Stake LAND");
    console.log("9. Mint and Sell KumaBond");
    console.log("10. Run All Tasks Sequentially");
    console.log("0. Exit Program");
    const prompt = await promptUser("\nChoose the script to run: ");
    switch (prompt) {
      case '1':
        await checkIn();
        break;
      case '2':
        await faucetETH();
        break;
      case '3':
        await faucetGOON();
        break;
      case '4':
        await swapTokens();
        break;
      case '5':
        await stake();
        break;
      case '6':
        await predict();
        break;
      case '7':
        await createToken();
        break;
      case '8':
        await landShare();
        break;
      case '9':
        await kumaBond();
        break;
      case '10':
        await runAllTasks();
        break;
      case '0':
        console.log(chalk.green("Exiting program. Goodbye!"));
        process.exit(0x0);    
      default:
        console.log(chalk.red("Invalid choice. Please restart and choose 1 - 8."));
    }
    _0x1f6b85();
  }
  
  await _0x1f6b85();
}
main()["catch"](console.error);