import { BrowserProvider, JsonRpcProvider, Contract, keccak256, toUtf8Bytes } from 'ethers';

export const SEPOLIA_CHAIN_ID_HEX = '0xaa36a7'; // 11155111
export const SEPOLIA_CHAIN_ID_DEC = 11155111;
export const SEPOLIA_RPC_URL = 'https://rpc.sepolia.org';
export const SEPOLIA_EXPLORER_URL = 'https://sepolia.etherscan.io';

export const CONTRACT_ADDRESS =
  import.meta.env.VITE_CONTRACT_ADDRESS || '0x0aCCE10AC00dd05aF572E4fe54c175446DB0b41a';

export const CONTRACT_ABI = [
  {
    inputs: [
      { internalType: 'bytes32', name: 'refId', type: 'bytes32' },
      { internalType: 'bytes32', name: 'contentHash', type: 'bytes32' },
    ],
    name: 'anchor',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'refId', type: 'bytes32' },
      { internalType: 'bytes32', name: 'contentHash', type: 'bytes32' },
    ],
    name: 'verify',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
];

const API_URL = import.meta.env.VITE_AI_API_URL || 'http://localhost:5000';

/**
 * Check if MetaMask (or an EIP-1193 provider) is installed.
 */
export function isMetaMaskAvailable() {
  return typeof window !== 'undefined' && Boolean(window.ethereum);
}

/**
 * Request MetaMask to switch to the Sepolia testnet.
 * Automatically prompts to add the chain if it does not exist in the wallet.
 */
export async function switchOrAddSepolia() {
  if (!isMetaMaskAvailable()) {
    throw new Error('MetaMask is not installed. Please install MetaMask to use Sepolia testnet.');
  }

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: SEPOLIA_CHAIN_ID_HEX }],
    });
  } catch (err) {
    // Error 4902 indicates the chain has not been added to MetaMask
    if (err.code === 4902) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: SEPOLIA_CHAIN_ID_HEX,
            chainName: 'Sepolia Testnet',
            nativeCurrency: {
              name: 'Sepolia ETH',
              symbol: 'ETH',
              decimals: 18,
            },
            rpcUrls: [SEPOLIA_RPC_URL, 'https://ethereum-sepolia-rpc.publicnode.com'],
            blockExplorerUrls: [SEPOLIA_EXPLORER_URL],
          },
        ],
      });
    } else {
      throw err;
    }
  }
}

/**
 * Connect user's MetaMask wallet and ensure it's on Sepolia.
 * Returns the connected account address.
 */
export async function connectMetaMask() {
  if (!isMetaMaskAvailable()) {
    throw new Error('MetaMask is not installed. Please install MetaMask to connect your wallet.');
  }

  // Ensure network is Sepolia
  await switchOrAddSepolia();

  const accounts = await window.ethereum.request({
    method: 'eth_requestAccounts',
  });

  return accounts[0] || null;
}

/**
 * Non-intrusively check if MetaMask is already connected.
 */
export async function getConnectedMetaMaskAccount() {
  if (!isMetaMaskAvailable()) return null;
  try {
    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
    return accounts[0] || null;
  } catch {
    return null;
  }
}

/**
 * Format string/hex into standard bytes32 format for contract call.
 */
function toBytes32(contentHashHex) {
  const clean = contentHashHex.replace('0x', '');
  return clean.length === 64 ? '0x' + clean : '0x' + clean.padStart(64, '0');
}

/**
 * Anchor listing or transaction directly using MetaMask on Sepolia.
 */
export async function anchorWithMetaMask(refId, contentHashHex) {
  await switchOrAddSepolia();
  const provider = new BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();

  const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
  const refIdBytes = keccak256(toUtf8Bytes(refId));
  const hashBytes32 = toBytes32(contentHashHex);

  const tx = await contract.anchor(refIdBytes, hashBytes32);
  const receipt = await tx.wait();
  return receipt.hash || tx.hash;
}

/**
 * Main anchoring function:
 * 1. Prefers MetaMask on Sepolia when available.
 * 2. Falls back to backend /anchor route if MetaMask is not present.
 */
export async function anchorListingOnChain(listingId, contentHashHex) {
  if (isMetaMaskAvailable()) {
    try {
      console.log('🔗 Anchoring via MetaMask on Sepolia...');
      const txHash = await anchorWithMetaMask(listingId, contentHashHex);
      console.log('✅ Anchored on Sepolia via MetaMask! Tx:', txHash);
      return txHash;
    } catch (err) {
      console.warn('MetaMask anchor was rejected or failed. Trying backend fallback...', err);
    }
  }

  // Fallback to backend service
  try {
    const res = await fetch(`${API_URL}/anchor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refId: listingId, contentHash: contentHashHex }),
    });
    const data = await res.json();
    if (data.success) {
      console.log('✅ Anchored by backend! Tx:', data.txHash);
      return data.txHash;
    }
    return null;
  } catch (err) {
    console.error('Anchoring failed on both MetaMask and backend:', err);
    return null;
  }
}

export async function anchorTransactionOnChain(txId, contentHashHex, _amount) {
  return anchorListingOnChain(txId, contentHashHex);
}

/**
 * Verify integrity on Sepolia blockchain (read-only call).
 * Uses public Sepolia RPC by default so anyone can verify without needing MetaMask installed.
 */
export async function verifyListingOnChain(listingId, contentHashHex) {
  const provider = new JsonRpcProvider(SEPOLIA_RPC_URL);
  const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

  const refId = keccak256(toUtf8Bytes(listingId));
  const hashBytes32 = toBytes32(contentHashHex);

  return await contract.verify(refId, hashBytes32);
}

/**
 * Generate Etherscan block explorer link for Sepolia.
 */
export function getSepoliaTxUrl(txHash) {
  return `${SEPOLIA_EXPLORER_URL}/tx/${txHash}`;
}

export function getSepoliaAddressUrl(address = CONTRACT_ADDRESS) {
  return `${SEPOLIA_EXPLORER_URL}/address/${address}`;
}
