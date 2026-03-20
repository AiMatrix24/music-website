import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';

const DEPLOYER_PRIVATE_KEY =
  process.env.DEPLOYER_PRIVATE_KEY ??
  '0x0000000000000000000000000000000000000000000000000000000000000001';

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.24',
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks: {
    hardhat: {},
    polygonAmoy: {
      url: process.env.POLYGON_AMOY_RPC_URL ?? '',
      accounts: [DEPLOYER_PRIVATE_KEY],
      chainId: 80002,
    },
    polygon: {
      url: process.env.POLYGON_MAINNET_RPC_URL ?? '',
      accounts: [DEPLOYER_PRIVATE_KEY],
      chainId: 137,
    },
  },
  etherscan: {
    apiKey: process.env.POLYGONSCAN_API_KEY ?? '',
  },
};

export default config;
