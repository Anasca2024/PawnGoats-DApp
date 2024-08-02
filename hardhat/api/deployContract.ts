import { ethers } from "hardhat";
import { task } from "hardhat/config";

task("deploy", "Deploy the contract", async (_, hre) => {
    const BusinessContract = await ethers.getContractFactory(
        "BusinessContract"
    );
    const businessContract = await BusinessContract.deploy();

    console.log(
        "BusinessContract address:",
        await businessContract.getAddress()
    );
});

// async function main() {
//     const [deployer] = await ethers.getSigners();

//     console.log(
//         "Deploying contracts with the account:",
//         await deployer.getAddress()
//     );

//     //   console.log("Account balance:", (await deployer.getBalance()).toString());

//     const BusinessContract = await ethers.getContractFactory(
//         "BusinessContract"
//     );
//     const businessContract = await BusinessContract.deploy();

//     console.log(
//         "BusinessContract address:",
//         await businessContract.getAddress()
//     );
// }

// main()
//     .then(() => process.exit(0))
//     .catch((error) => {
//         console.error(error);
//         process.exit(1);
//     });
