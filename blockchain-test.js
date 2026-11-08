import { JsonRpcProvider, ContractFactory, keccak256, toUtf8Bytes } from "ethers";
import solc from "solc";

// 1. The Solidity Code
const source = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
contract CampusConnectLedger {
    mapping(bytes32 => bytes32) private hashes;
    function anchor(bytes32 refId, bytes32 contentHash) external {
        hashes[refId] = contentHash;
    }
    function verify(bytes32 refId, bytes32 contentHash) external view returns (bool) {
        return hashes[refId] == contentHash;
    }
}
`;

async function run() {
  console.log("Connecting to Ganache...");
  const provider = new JsonRpcProvider("http://127.0.0.1:7545");
  const signer = await provider.getSigner(0);

  console.log("Compiling contract for old EVM (London)...");
  // Compile the contract targeting the London EVM (no PUSH0)
  const input = {
    language: 'Solidity',
    sources: { 'test.sol': { content: source } },
    settings: {
      optimizer: { enabled: true, runs: 200 },
      evmVersion: 'london', // <--- THIS IS THE MAGIC FIX
      outputSelection: { '*': { '*': ['abi', 'evm.bytecode.object'] } }
    }
  };
  
  const output = JSON.parse(solc.compile(JSON.stringify(input)));
  const contractData = output.contracts['test.sol']['CampusConnectLedger'];
  const abi = contractData.abi;
  const bytecode = "0x" + contractData.evm.bytecode.object;

  console.log("Deploying contract to Ganache...");
  const factory = new ContractFactory(abi, bytecode, signer);
  const contract = await factory.deploy();
  await contract.waitForDeployment();
  
  console.log("✅ Contract deployed at:", await contract.getAddress());

  // --- TEST THE BLOCKCHAIN LOGIC ---
  console.log("\n--- Testing Integrity ---");
  
  const refId = keccak256(toUtf8Bytes("listing-123"));
  const correctHash = keccak256(toUtf8Bytes("original-data"));
  const tamperedHash = keccak256(toUtf8Bytes("tampered-data"));

  console.log("Anchoring original hash...");
  const tx = await contract.anchor(refId, correctHash);
  await tx.wait();
  console.log("Hash anchored!");

  const isValid = await contract.verify(refId, correctHash);
  console.log(`\nVerify Original Hash: ${isValid} (Expected: true)`);

  const isTampered = await contract.verify(refId, tamperedHash);
  console.log(`Verify Tampered Hash: ${isTampered} (Expected: false)`);
}

run().catch(console.error);