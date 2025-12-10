const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying Voting contract...\n");

  // Get the deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("📍 Deploying with account:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH\n");

  // Deploy the contract
  const Voting = await hre.ethers.getContractFactory("Voting");
  const voting = await Voting.deploy();
  
  await voting.waitForDeployment();
  const contractAddress = await voting.getAddress();
  
  console.log("✅ Voting contract deployed to:", contractAddress);
  console.log("🔗 Network:", hre.network.name);

  // Save the contract address and ABI for the frontend
  const contractsDir = path.join(__dirname, "..", "frontend", "src", "contracts");
  
  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir, { recursive: true });
  }

  // Save contract address
  const addressFile = path.join(contractsDir, "contract-address.json");
  fs.writeFileSync(
    addressFile,
    JSON.stringify({ Voting: contractAddress }, null, 2)
  );
  console.log("\n📄 Contract address saved to:", addressFile);

  // Copy the ABI
  const VotingArtifact = await hre.artifacts.readArtifact("Voting");
  const abiFile = path.join(contractsDir, "Voting.json");
  fs.writeFileSync(
    abiFile,
    JSON.stringify(VotingArtifact, null, 2)
  );
  console.log("📄 Contract ABI saved to:", abiFile);

  // Create a sample poll if on local network
  if (hre.network.name === "localhost" || hre.network.name === "hardhat") {
    console.log("\n🗳️  Creating sample poll...");
    
    const tx = await voting.createPoll(
      "What is the best blockchain for DApps?",
      ["Ethereum", "Solana", "Polygon", "Avalanche"],
      60 // 60 minutes duration
    );
    await tx.wait();
    
    console.log("✅ Sample poll created!");
  }

  console.log("\n🎉 Deployment complete!");
  console.log("\nNext steps:");
  console.log("1. cd frontend");
  console.log("2. npm install");
  console.log("3. npm start");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
