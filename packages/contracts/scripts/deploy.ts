import { ethers } from 'hardhat';

/**
 * Deployment script for OPYNX smart contracts.
 *
 * ⚠ WARNING: ALL tests must pass before deployment. Never deploy with failing tests.
 *
 * Usage:
 *   Testnet:  npx hardhat run scripts/deploy.ts --network polygonAmoy
 *   Mainnet:  npx hardhat run scripts/deploy.ts --network polygon
 *
 * Prerequisites:
 *   - DEPLOYER_PRIVATE_KEY in .env.local
 *   - For mainnet: Gnosis Safe (3-of-5) deployed and address ready
 *   - For testnet: Testnet MATIC from faucet.polygon.technology
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();

  console.log('═══════════════════════════════════════');
  console.log('OPYNX Smart Contract Deployment');
  console.log('═══════════════════════════════════════');
  console.log(`Network:  ${network.name} (chainId: ${network.chainId})`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Balance:  ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} MATIC`);
  console.log('');

  // ─── Configuration ───
  // Gelato Trusted Forwarder on Polygon
  const TRUSTED_FORWARDER =
    process.env.GELATO_TRUSTED_FORWARDER ??
    '0xd8253782c45a12053594b9deB72d8e8aB2Fca54c'; // Gelato Polygon default

  // USDC address
  const isMainnet = network.chainId === 137n;
  let usdcAddress: string;

  if (isMainnet) {
    // Production USDC on Polygon
    usdcAddress = '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359';
    console.log('⚠  MAINNET DEPLOYMENT — Using production USDC');
  } else {
    // Deploy MockUSDC on testnet
    console.log('Deploying MockUSDC (testnet only)...');
    const MockUSDC = await ethers.getContractFactory('MockUSDC');
    const mockUsdc = await MockUSDC.deploy();
    await mockUsdc.waitForDeployment();
    usdcAddress = await mockUsdc.getAddress();
    console.log(`  MockUSDC: ${usdcAddress}`);
  }

  // Admin address (deployer for testnet, Gnosis Safe for mainnet)
  const adminAddress = isMainnet
    ? (process.env.GNOSIS_SAFE_ADDRESS ?? deployer.address)
    : deployer.address;

  if (isMainnet && adminAddress === deployer.address) {
    console.log('⚠  WARNING: Using deployer as admin. Set GNOSIS_SAFE_ADDRESS for production!');
  }

  // ─── Deploy PaymentSplitter ───
  console.log('\nDeploying PaymentSplitter...');
  const PaymentSplitter = await ethers.getContractFactory('PaymentSplitter');
  const splitter = await PaymentSplitter.deploy(
    TRUSTED_FORWARDER,
    usdcAddress,
    adminAddress
  );
  await splitter.waitForDeployment();
  const splitterAddr = await splitter.getAddress();
  console.log(`  PaymentSplitter: ${splitterAddr}`);

  // ─── Deploy AttributionRegistry ───
  console.log('Deploying AttributionRegistry...');
  const AttributionRegistry = await ethers.getContractFactory('AttributionRegistry');
  const registry = await AttributionRegistry.deploy(TRUSTED_FORWARDER);
  await registry.waitForDeployment();
  const registryAddr = await registry.getAddress();
  console.log(`  AttributionRegistry: ${registryAddr}`);

  // ─── Deploy SubscriptionManager ───
  console.log('Deploying SubscriptionManager...');
  const SubscriptionManager = await ethers.getContractFactory('SubscriptionManager');
  const subManager = await SubscriptionManager.deploy(TRUSTED_FORWARDER);
  await subManager.waitForDeployment();
  const subManagerAddr = await subManager.getAddress();
  console.log(`  SubscriptionManager: ${subManagerAddr}`);

  // ─── Summary ───
  console.log('\n═══════════════════════════════════════');
  console.log('DEPLOYMENT COMPLETE');
  console.log('═══════════════════════════════════════');
  console.log('Add these to your .env.local:\n');
  console.log(`PAYMENT_SPLITTER_ADDRESS=${splitterAddr}`);
  console.log(`ATTRIBUTION_REGISTRY_ADDRESS=${registryAddr}`);
  console.log(`SUBSCRIPTION_MANAGER_ADDRESS=${subManagerAddr}`);
  console.log(`USDC_ADDRESS=${usdcAddress}`);
  console.log(`GELATO_TRUSTED_FORWARDER=${TRUSTED_FORWARDER}`);

  if (isMainnet) {
    console.log('\n⚠  NEXT STEPS:');
    console.log('  1. Verify contracts on Polygonscan (npx hardhat verify ...)');
    console.log('  2. Fund Gelato 1Balance with USDC at app.gelato.network/1balance');
    console.log('  3. Transfer PaymentSplitter admin to Gnosis Safe if not already set');
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
