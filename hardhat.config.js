require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hardhat: {
      chainId: 31337
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337
    },
    // Sepolia testnet configuration (uncomment and add your keys)
    // sepolia: {
    //   url: `https://sepolia.infura.io/v3/${INFURA_PROJECT_ID}`,
    //   accounts: [PRIVATE_KEY]
    // },
    // Goerli testnet configuration
    // goerli: {
    //   url: `https://goerli.infura.io/v3/${INFURA_PROJECT_ID}`,
    //   accounts: [PRIVATE_KEY]
    // }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};
