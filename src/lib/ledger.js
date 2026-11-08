import { JsonRpcProvider, Contract, keccak256, toUtf8Bytes } from "ethers";
import solc from "solc"; // You'll need to run: npm install solc in your React folder

// The Solidity code (same as your terminal test)
const source = `
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

// Compile it once when the file loads
const input = {
  language: 'Solidity',
  sources: { 'test.sol': { content: source } },
  settings: {
    optimizer: { enabled: true, runs: 200 },
    evmVersion: 'london',
    outputSelection: { '*': { '*': ['abi', 'evm.bytecode.object'] } }
  }
};
const output = JSON.parse(solc.compile(JSON.stringify(input)));
const contractData = output.contracts['test.sol']['CampusConnectLedger'];
const abi = contractData.abi;
const bytecode = "0x" + contractData.evm.bytecode.object;

// Connect to Ganache
const provider = new JsonRpcProvider("http://127.0.0.1:7545");

// Function to deploy a new instance and test it
export async function runBlockchainDemo() {
  const signer = await provider.getSigner(0);
  const factory = new ContractFactory(abi, bytecode, signer);
  const contract = await factory.deploy();
  await contract.waitForDeployment();

  const refId = keccak256(toUtf8Bytes("listing-123"));
  const correctHash = keccak256(toUtf8Bytes("original-data"));
  const tamperedHash = keccak256(toUtf8Bytes("tampered-data"));

  await (await contract.anchor(refId, correctHash)).wait();
  
  const isValid = await contract.verify(refId, correctHash);
  const isTampered = await contract.verify(refId, tamperedHash);

  return { address: await contract.getAddress(), isValid, isTampered };
}