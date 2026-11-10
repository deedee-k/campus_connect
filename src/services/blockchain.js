import { BrowserProvider, Contract, JsonRpcProvider, keccak256, toUtf8Bytes } from "ethers";

//  Connect to the public Sepolia network
const SEPOLIA_RPC = "https://rpc.sepolia.org"; 


const CONTRACT_ADDRESS = "0x49cb840AE7218b928E33A4fBdfB1B8d7D98A1A4c"; 

const ABI = [
  "function anchor(bytes32 refId, bytes32 contentHash) external",
  "function verify(bytes32 refId, bytes32 contentHash) external view returns (bool)",
  "function deposit(bytes32 txId) external payable",
  "function releasePayment(bytes32 txId, address payable seller) external"
];

// Read-only verification (no MetaMask popup needed)
export async function verifyListingOnChain(listingId, contentHashHex) {
  const provider = new JsonRpcProvider(SEPOLIA_RPC);
  const contract = new Contract(CONTRACT_ADDRESS, ABI, provider);
  const refId = keccak256(toUtf8Bytes(listingId));
  const hashBytes32 = contentHashHex.length === 66 ? contentHashHex : '0x' + contentHashHex.padStart(64, '0');
  return await contract.verify(refId, hashBytes32);
}

// Writing to the chain (MetaMask will pop up for the user to sign)
export async function anchorListingOnChain(listingId, contentHashHex) {
  if (!window.ethereum) throw new Error("Please install MetaMask");
  const provider = new BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const contract = new Contract(CONTRACT_ADDRESS, ABI, signer);
  
  const refId = keccak256(toUtf8Bytes(listingId));
  const hashBytes32 = contentHashHex.length === 66 ? contentHashHex : '0x' + contentHashHex.padStart(64, '0');
  
  console.log("Anchoring listing to Sepolia...");
  const tx = await contract.anchor(refId, hashBytes32);
  await tx.wait();
  console.log("✅ Anchored! Tx:", tx.hash);
  return tx.hash;
}

export async function anchorTransactionOnChain(txId, contentHashHex, amount) {
  if (!window.ethereum) throw new Error("Please install MetaMask");
  const provider = new BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const contract = new Contract(CONTRACT_ADDRESS, ABI, signer);
  
  const refId = keccak256(toUtf8Bytes(txId));
  const hashBytes32 = contentHashHex.length === 66 ? contentHashHex : '0x' + contentHashHex.padStart(64, '0');

  // 1. Anchor the hash
  await (await contract.anchor(refId, hashBytes32)).wait();

  // 2. Deposit funds into escrow
  const depositAmount = BigInt(Math.floor(amount * 1000000000000000));
  await (await contract.deposit(refId, { value: depositAmount })).wait();
  
  return true;
}

export async function releaseEscrowPayment(txId) {
  if (!window.ethereum) throw new Error("Please install MetaMask");
  const provider = new BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const contract = new Contract(CONTRACT_ADDRESS, ABI, signer);
  
  const refId = keccak256(toUtf8Bytes(txId));
  const tx = await contract.releasePayment(refId, await signer.getAddress());
  await tx.wait();
  return true;
}