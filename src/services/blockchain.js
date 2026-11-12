import { BrowserProvider, Contract, JsonRpcProvider, keccak256, toUtf8Bytes } from "ethers";

const SEPOLIA_RPC = "https://rpc.sepolia.org"; 
const CONTRACT_ADDRESS = "0xc47326E7524321E13Ae7b9314f0E906Fcc1868cd"; 

const ABI = [
  "function anchor(bytes32 refId, bytes32 contentHash) external",
  "function verify(bytes32 refId, bytes32 contentHash) external view returns (bool)"
];

// Read-only verification
export async function verifyListingOnChain(listingId, contentHashHex) {
  const provider = new JsonRpcProvider(SEPOLIA_RPC);
  const contract = new Contract(CONTRACT_ADDRESS, ABI, provider);
  const refId = keccak256(toUtf8Bytes(listingId));
  const hashBytes32 = contentHashHex.length === 66 ? contentHashHex : '0x' + contentHashHex.padStart(64, '0');
  return await contract.verify(refId, hashBytes32);
}

// Anchor a listing hash
export async function anchorListingOnChain(listingId, contentHashHex) {
  if (!window.ethereum) throw new Error("Please install MetaMask");
  const provider = new BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const contract = new Contract(CONTRACT_ADDRESS, ABI, signer);
  
  const refId = keccak256(toUtf8Bytes(listingId));
  const hashBytes32 = contentHashHex.length === 66 ? contentHashHex : '0x' + contentHashHex.padStart(64, '0');
  
  const tx = await contract.anchor(refId, hashBytes32);
  await tx.wait();
  return tx.hash;
}

// Anchor a transaction hash (No escrow deposit)
export async function anchorTransactionOnChain(txId, contentHashHex, amount) {
  if (!window.ethereum) throw new Error("Please install MetaMask");
  const provider = new BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const contract = new Contract(CONTRACT_ADDRESS, ABI, signer);
  
  const refId = keccak256(toUtf8Bytes(txId));
  const hashBytes32 = contentHashHex.length === 66 ? contentHashHex : '0x' + contentHashHex.padStart(64, '0');

  const tx = await contract.anchor(refId, hashBytes32);
  await tx.wait();
  return true;
}