import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config";

const config: HardhatUserConfig = {
    solidity: {
        version: "0.8.24",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200,
            },
        },
    },
    networks: {
        hardhat: {
            gas: 12000000, // Set the maximum gas per block
            blockGasLimit: 0x1fffffffffffff, // Set the gas limit for a block
        }
    },
};

export default config;
