require("dotenv").config();
const { ethers } = require("ethers");

// Create an ethers provider connected to the Ethereum node
const provider = new ethers.providers.JsonRpcProvider(process.env.GANACHE_URL);

// Create a wallet using the private key
const wallet = new ethers.Wallet(process.env.PAWNER_PRIVATE_KEY, provider);

async function getUserBalance() {
    console.log(
        "User Balance:",
        ethers.utils.formatEther(await provider.getBalance(wallet.address))
    );
}

getUserBalance();
