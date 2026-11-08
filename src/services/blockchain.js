import { JsonRpcProvider, ContractFactory, keccak256, toUtf8Bytes } from "ethers";
import { fetchAndLoadSolc } from "web-solc";

const source = `
pragma solidity ^0.8.0;

contract CampusConnectLedger {
    mapping(bytes32 => bytes32) private hashes;
    mapping(bytes32 => uint256) private escrowBalances;

    // Anchor the listing data hash
    function anchor(bytes32 refId, bytes32 contentHash) external {
        hashes[refId] = contentHash;
    }

    // Verify the listing data hash
    function verify(bytes32 refId, bytes32 contentHash) external view returns (bool) {
        return hashes[refId] == contentHash;
    }

    // Lock funds in escrow for a transaction
    function deposit(bytes32 txId) external payable {
        escrowBalances[txId] += msg.value;
    }

    // Release funds to the seller once the buyer confirms delivery
    function releasePayment(bytes32 txId, address payable seller) external {
        uint256 amount = escrowBalances[txId];
        require(amount > 0, "No funds in escrow");
        escrowBalances[txId] = 0;
        seller.transfer(amount);
    }
}
`;

const provider = new JsonRpcProvider("http://127.0.0.1:7545");

let deployedContract = null;
let solcInstance = null;

async function getContract() {
  if (deployedContract) return deployedContract;

  try {
    if (!solcInstance) {
      console.log("Loading Solidity compiler in browser...");
      solcInstance = await fetchAndLoadSolc("^0.8.0");
    }

    const input = {
      language: 'Solidity',
      sources: { 'test.sol': { content: source } },
      settings: {
        optimizer: { enabled: true, runs: 200 },
        evmVersion: 'london',
        outputSelection: { '*': { '*': ['abi', 'evm.bytecode.object'] } }
      }
    };

    const output = await solcInstance.compile(input);
    const contractData = output.contracts['test.sol']['CampusConnectLedger'];
    const abi = contractData.abi;
    const bytecode = "0x" + contractData.evm.bytecode.object;

    const signer = await provider.getSigner(0);
    const factory = new ContractFactory(abi, bytecode, signer);
    deployedContract = await factory.deploy();
    await deployedContract.waitForDeployment();
    
    console.log("🔗 Ledger deployed at:", await deployedContract.getAddress());
    
    if (solcInstance.stopWorker) solcInstance.stopWorker();
    
    return deployedContract;
  } catch (err) {
    console.error("Failed to deploy contract:", err);
    throw err;
  }
}

// --- LISTING VERIFICATION ---
export async function anchorListingOnChain(listingId, contentHashHex) {
  try {
    const contract = await getContract();
    const refId = keccak256(toUtf8Bytes(listingId));
    const hashBytes32 = contentHashHex.length === 66 ? contentHashHex : '0x' + contentHashHex.padStart(64, '0');

    console.log("Anchoring listing to blockchain...");
    const tx = await contract.anchor(refId, hashBytes32);
    await tx.wait();
    console.log("✅ Listing anchored! Tx:", tx.hash);
    return tx.hash;
  } catch (err) {
    console.error("Blockchain anchor failed:", err);
    return null;
  }
}

export async function verifyListingOnChain(listingId, contentHashHex) {
  const contract = await getContract();
  const refId = keccak256(toUtf8Bytes(listingId));
  const hashBytes32 = contentHashHex.length === 66 ? contentHashHex : '0x' + contentHashHex.padStart(64, '0');
  return await contract.verify(refId, hashBytes32);
}

// --- ESCROW TRANSACTIONS ---
export async function anchorTransactionOnChain(txId, contentHashHex, amount) {
  try {
    const contract = await getContract();
    const refId = keccak256(toUtf8Bytes(txId));
    const hashBytes32 = contentHashHex.length === 66 ? contentHashHex : '0x' + contentHashHex.padStart(64, '0');

    console.log("Anchoring transaction hash...");
    await (await contract.anchor(refId, hashBytes32)).wait();

    // Convert amount to BigInt for the blockchain deposit
    const depositAmount = BigInt(Math.floor(amount * 1000000000000000));
    
    console.log(`Depositing M${amount} into escrow...`);
    await (await contract.deposit(refId, { value: depositAmount })).wait();
    
    console.log("💰 Escrow funded successfully!");
    return true;
  } catch (err) {
    console.error("Blockchain transaction failed:", err);
    return false;
  }
}

export async function releaseEscrowPayment(txId) {
  try {
    const contract = await getContract();
    const signer = await provider.getSigner(0); 
    const refId = keccak256(toUtf8Bytes(txId));
    
    console.log("Releasing funds from escrow...");
    const tx = await contract.releasePayment(refId, await signer.getAddress());
    await tx.wait();
    console.log("✅ Funds successfully released to seller!");
    return true;
  } catch (err) {
    console.error("Failed to release payment:", err);
    return false;
  }
}