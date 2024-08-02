require("dotenv").config();
const { ethers } = require("ethers");
const express = require("express");
const cors = require('cors'); // Add this line

const app = express();
app.use(cors({origin:'http://localhost:4200'})); // And this line

app.use(express.json());

// Models
const Order = require("../models/Order");
const SubContractVars = require("../models/SubContractVars");

// Import the smart contract (Deployed using hardhat/deployContract.ts)
const contractJson = require("../contractJson/BusinessContract.json");

// Initialize the provider and contract
const provider = new ethers.providers.JsonRpcProvider(process.env.GANACHE_URL);
const businessContract = new ethers.Contract(
    process.env.CONTRACT_ADDRESS,
    contractJson.abi,
    provider
);

// Assign businessWallet as the signer
const businessWallet = new ethers.Wallet(
    process.env.OWNER_PRIVATE_KEY,
    provider
);
const businessContractWithSigner = businessContract.connect(businessWallet);

// MARK: Getters
app.get("/getOrder", async (req, res) => {
    try {
        const orderID = req.query.orderID;
        const orderData = await businessContractWithSigner.getOrder(orderID);
        const OrderObject = new Order(orderData);
        res.json({ success: true, order: OrderObject });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get("/getSubContractOrder", async (req, res) => {
    try {
        const orderID = req.query.orderID;
        const subContractOrder =
            await businessContractWithSigner.getSubContractOrder(orderID);
        const SubContractOverObject = new Order(subContractOrder);
        res.json({ success: true, subContractOrder: SubContractOverObject });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post("/getPendingOrders", async (req, res) => {
    try {
        const transaction = await businessContractWithSigner.getAllOrders();

        const receipt = await transaction.wait();

        // Get the order number from the emitted event
        const AllOrdersEvent = receipt.events?.find(
            (e) => e.event === "AllOrders"
        );

        const allOrders = AllOrdersEvent?.args?.allOrders;
        const orderObjects = allOrders.map((order) => new Order(order));

        const pendingOrders = orderObjects.filter(
            (order) => order.status === "PENDING"
        );
        res.json({ success: true, orders: pendingOrders });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post("/getActiveOrders", async (req, res) => {
    try {
        const transaction = await businessContractWithSigner.getAllOrders();

        const receipt = await transaction.wait();

        // Get the order number from the emitted event
        const AllOrdersEvent = receipt.events?.find(
            (e) => e.event === "AllOrders"
        );

        const allOrders = AllOrdersEvent?.args?.allOrders;
        const orderObjects = allOrders.map((order) => new Order(order));

        const activeOrders = orderObjects.filter(
            (order) =>
                order.status !== "PENDING" && order.status !== "COMPLETED"
        );
        res.json({ success: true, orders: activeOrders });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post("/getCompletedOrders", async (req, res) => {
    try {
        const transaction = await businessContractWithSigner.getAllOrders();

        const receipt = await transaction.wait();

        // Get the order number from the emitted event
        const AllOrdersEvent = receipt.events?.find(
            (e) => e.event === "AllOrders"
        );

        const allOrders = AllOrdersEvent?.args?.allOrders;
        const orderObjects = allOrders.map((order) => new Order(order));

        const completedOrders = orderObjects.filter(
            (order) => order.status === "COMPLETED"
        );
        res.json({ success: true, orders: completedOrders });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get("/getSubContractAddress", async (req, res) => {
    try {
        const orderID = req.query.orderID;
        const subContractAddress =
            await businessContractWithSigner.getSubContractAddress(orderID);
        res.json({ success: true, subContractAddress: subContractAddress });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get("/getSubContractVars", async (req, res) => {
    try {
        const orderID = req.query.orderID;
        const subContractVars =
            await businessContractWithSigner.getSubContractVars(orderID);
        const SubContractVarsObject = new SubContractVars(subContractVars);
        res.json({ success: true, subContractVars: SubContractVarsObject });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post("/checkRepayAmount", async (req, res) => {
    try {
        const orderID = req.query.orderID;
        const transaction = await businessContractWithSigner.checkRepayAmount(
            orderID
        );

        receipt = await transaction.wait();

        // Get the order number from the emitted event
        const RepayAmountEvent = receipt.events?.find(
            (e) => e.event === "LoanRepayAmount"
        );

        const repayAmount = RepayAmountEvent?.args?.repayAmount.toString();

        res.json({ success: true, repayAmount: repayAmount });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get("/getBusinessContractBalance", async (req, res) => {
    try {
        const balance = ethers.utils.formatEther(
            await provider.getBalance(process.env.CONTRACT_ADDRESS)
        );
        res.json({ success: true, balance: balance });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get("/getSubContractBalance", async (req, res) => {
    try {
        const orderID = req.query.orderID;
        const subContractAddress =
            await businessContractWithSigner.getSubContractAddress(orderID);
        const balance = ethers.utils.formatEther(
            await provider.getBalance(subContractAddress)
        );
        res.json({ success: true, balance: balance });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// MARK: Main Functions
app.post("/createOrder", async (req, res) => {
    try {
        const { price, itemName, description, interestRate } = req.body;
        const transaction = await businessContractWithSigner.createOrder(
            price,
            itemName,
            description,
            interestRate
        );

        // Wait for the transaction to be mined
        receipt = await transaction.wait();

        // Get the order number from the emitted event
        const orderCreatedEvent = receipt.events?.find(
            (e) => e.event === "OrderCreated"
        );
        const orderNum = orderCreatedEvent?.args?.orderNum.toNumber();

        // Return the order number to the client
        res.json({ success: true, orderNum: orderNum });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post("/acceptOrder", async (req, res) => {
    try {
        const orderID = req.body.orderID;
        const transaction = await businessContractWithSigner.acceptOrder(
            orderID
        );
        await transaction.wait();
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post("/ownerWithdrawStakeEarly", async (req, res) => {
    try {
        const orderID = req.body.orderID;
        const transaction =
            await businessContractWithSigner.ownerWithdrawStakeEarly(orderID);
        await transaction.wait();
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post("/assignPawnerShippingHash", async (req, res) => {
    try {
        const orderID = req.body.orderID;
        const shippingNumber = req.body.shippingNumber;
        const transaction =
            await businessContractWithSigner.assignPawnerShippingHash(
                orderID,
                shippingNumber,
                {
                    gasLimit: 10000000,
                }
            );
        await transaction.wait();
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post("/assignOwnerShippingHash", async (req, res) => {
    try {
        const orderID = req.body.orderID;
        const shippingNumber = req.body.shippingNumber;
        const transaction =
            await businessContractWithSigner.assignOwnerShippingHash(
                orderID,
                shippingNumber
            );
        await transaction.wait();
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post("/ownerConfirmShipping", async (req, res) => {
    try {
        const orderID = req.body.orderID;
        const transaction =
            await businessContractWithSigner.ownerConfirmShipping(orderID, {
                gasLimit: 10000000,
            });
        await transaction.wait();
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post("/pawnerConfirmShipping", async (req, res) => {
    try {
        const orderID = req.body.orderID;
        const transaction =
            await businessContractWithSigner.pawnerConfirmShipping(orderID, {
                gasLimit: 10000000,
            });
        await transaction.wait();
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
