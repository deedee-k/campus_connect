const API_URL = import.meta.env.VITE_AI_API_URL || 'http://localhost:5000';

export async function anchorListingOnChain(listingId, contentHashHex) {
  try {
    const res = await fetch(`${API_URL}/anchor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refId: listingId, contentHash: contentHashHex })
    });
    const data = await res.json();
    if (data.success) {
      console.log("✅ Anchored by backend! Tx:", data.txHash);
      return data.txHash;
    }
    return null;
  } catch (err) {
    console.error("Backend anchor failed:", err);
    return null;
  }
}

export async function anchorTransactionOnChain(txId, contentHashHex, amount) {
  return anchorListingOnChain(txId, contentHashHex);
}

export async function verifyListingOnChain(listingId, contentHashHex) {
  // Read-only verification using public RPC
  const { JsonRpcProvider, Contract, keccak256, toUtf8Bytes } = await import("ethers");
  const provider = new JsonRpcProvider("https://rpc.sepolia.org");
  const contract = new Contract(
    "0x0aCCE10AC00dd05aF572E4fe54c175446DB0b41a", 
    ["function verify(bytes32 refId, bytes32 contentHash) external view returns (bool)"], 
    provider
  );
  const refId = keccak256(toUtf8Bytes(listingId));
  const hashBytes32 = contentHashHex.length === 66 ? contentHashHex : '0x' + contentHashHex.padStart(64, '0');
  return await contract.verify(refId, hashBytes32);
}