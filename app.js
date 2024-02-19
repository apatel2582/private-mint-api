"use strict";
const fs = require("fs");
const path = require("path");
const express = require("express");
const { Gateway, Wallets } = require("fabric-network");
const os = require("os");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
const port = 3001;

app.use(cors());
app.use(bodyParser.json());

// Function to get contract instance
async function getContractInstance() {
  // Define the connection profile path and wallet path
  const homeDirectory = os.homedir();
  const ccpPath = path.resolve(
    homeDirectory, // Use the homeDirectory variable here
    "fabric-samples/test-network",
    "organizations/peerOrganizations/org1.example.com",
    "connection-org1.json"
  );
  const ccp = JSON.parse(fs.readFileSync(ccpPath, "utf8"));

  // Setup the wallet to hold the credentials of the application user
  const walletPath = path.join(process.cwd(), "wallet");
  const wallet = await Wallets.newFileSystemWallet(walletPath);
  console.log(`Wallet path: ${walletPath}`);

  // Create a new gateway for connecting to the peer node
  const gateway = new Gateway();
  await gateway.connect(ccp, {
    wallet,
    identity: "User1@org1.example.com",
    discovery: { enabled: true, asLocalhost: true },
  });

  // Get the network (channel) our contract is deployed to
  const network = await gateway.getNetwork("mychannel");

  // Get the contract from the network
  const contract = network.getContract("private-mint-network");
  return contract;
}

// Define routes here
app.get("/", (req, res) => res.send("Private Mint API"));

app.post("/api/upsertWallet", async (req, res) => {
  const { userId } = req.body;
  try {
    const contract = await getContractInstance();
    // Assuming 'userId' is the only argument needed
    await contract.submitTransaction("upsertWallet", userId);
    res.json({ userId, message: "Wallet upserted successfully." });
  } catch (error) {
    res.status(500).json({ error: error.toString() });
  }
});

app.get("/api/getWallet/:userId", async (req, res) => {
  const { userId } = req.params;
  // Fabric SDK: Query `getWallet` chaincode function with userId
  try {
    const contract = await getContractInstance();
    const result = await contract.evaluateTransaction("getWallet", userId);
    res.json({ userId, wallet: JSON.parse(result.toString()) });
  } catch (error) {
    res.status(500).json({ error: error.toString() });
  }
});

app.post("/api/cheatAddFakeUSD", async (req, res) => {
  const { userId, amount } = req.body;
  // Fabric SDK: Invoke `cheatAddFakeUSD` chaincode function with userId and amount
  try {
    const contract = await getContractInstance();
    await contract.submitTransaction("cheatAddFakeUSD", userId, amount);
    res.json({ userId, amount, message: "FakeUSD added successfully." });
  } catch (error) {
    res.status(500).json({ error: error.toString() });
  }
});

app.post("/api/transferFakeUSD", async (req, res) => {
  const { fromUserId, toUserId, amount } = req.body;
  // Fabric SDK: Invoke `transferFakeUSD` chaincode function with fromUserId, toUserId, and amount
  try {
    const contract = await getContractInstance();
    await contract.submitTransaction(
      "transferFakeUSD",
      fromUserId,
      toUserId,
      amount
    );
    res.json({ fromUserId, toUserId, amount, message: "Transfer successful." });
  } catch (error) {
    res.status(500).json({ error: error.toString() });
  }
});

app.post("/api/purchasePMCoin", async (req, res) => {
  const { userId, pmCoinAmount } = req.body;
  // Fabric SDK: Invoke `purchasePMCoin` chaincode function with userId and pmCoinAmount
  try {
    const contract = await getContractInstance();
    await contract.submitTransaction("purchasePMCoin", userId, pmCoinAmount);
    res.json({ userId, pmCoinAmount, message: "PM Coin purchase successful." });
  } catch (error) {
    res.status(500).json({ error: error.toString() });
  }
});

// Start the Express server
app.listen(port, () => console.log(`Server running on port ${port}`));
