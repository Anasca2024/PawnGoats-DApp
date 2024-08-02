require("dotenv").config();
const { ethers } = require("ethers");

// Create an ethers provider connected to the Ethereum node
const provider = new ethers.providers.JsonRpcProvider("HTTP://127.0.0.1:7545");

// Create a wallet using the private key
const wallet = new ethers.Wallet("0xf0626629020e74e493f3feee094f2a4f05a65e1307bbce389dde99fd54425a01", provider);

const SEND_AMOUNT_ETHER = "3";
// const DESTINATION_ADDRESS = "0xA45605D4b800F5Fc0a225B53eb9Da14866005a40";

const DESTINATION_ADDRESS = '0x31383A4d45d41f67740A08Dc53bd54927fdaD889' // nick ganache
// const DESTINATION_ADDRESS = "0x002e78d90bB1932Ee5324E13BdF89bAb3F2E8Eee" // Alex Ganache

async function repayLoan() {
    // Specify the amount of Ether to transfer (in wei)
    // const amountInWei = ethers.utils.parseEther(SEND_AMOUNT_ETHER);
    const amountInWei = "1000014660493827160";

    // Build the transaction
    const transaction = {
        to: DESTINATION_ADDRESS,
        value: amountInWei,
        gasLimit: 300000,
    };

    // Send the transaction
    const tx = await wallet.sendTransaction(transaction);

    // Wait for the transaction to be mined
    const receipt = await tx.wait();

    // Output transaction details
    console.log("Transaction Hash:", tx.hash);
    console.log("Block Number:", receipt.blockNumber);
}

repayLoan();
