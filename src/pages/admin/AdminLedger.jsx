import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { ShieldCheck, Database, Search, AlertCircle, Wallet, ExternalLink, CheckCircle2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import {
  verifyListingOnChain,
  connectMetaMask,
  getConnectedMetaMaskAccount,
  isMetaMaskAvailable,
  getSepoliaAddressUrl,
  getSepoliaTxUrl,
  CONTRACT_ADDRESS,
} from '../../services/blockchain';
import { toast } from 'sonner';

export default function AdminLedger() {
  const [search, setSearch] = useState('');
  const [walletAddress, setWalletAddress] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [verifyingId, setVerifyingId] = useState(null);

  // Check if MetaMask is already connected
  useEffect(() => {
    getConnectedMetaMaskAccount().then((acc) => {
      if (acc) setWalletAddress(acc);
    });

    if (window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        setWalletAddress(accounts[0] || null);
      };
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      };
    }
  }, []);

  const handleConnectWallet = async () => {
    if (!isMetaMaskAvailable()) {
      toast.error('MetaMask extension not detected. Please install MetaMask to use Sepolia.');
      return;
    }
    setConnecting(true);
    try {
      const account = await connectMetaMask();
      setWalletAddress(account);
      toast.success('MetaMask connected to Sepolia testnet!');
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to connect MetaMask');
    } finally {
      setConnecting(false);
    }
  };

  // Fetch all transactions
  const { data = [], isLoading } = useQuery({
    queryKey: ['admin-ledger'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          listing:listings ( title ),
          buyer:profiles!transactions_buyer_id_fkey ( name ),
          seller:profiles!transactions_seller_id_fkey ( name )
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const handleVerify = async (tx) => {
    if (!tx.content_hash) {
      toast.info('This is a legacy transaction created before blockchain tracking was enabled.');
      return;
    }

    setVerifyingId(tx.id);
    try {
      const isValid = await verifyListingOnChain(tx.id, tx.content_hash);
      if (isValid) {
        toast.success(`Transaction ${tx.id.slice(0, 8)} verified on Sepolia blockchain!`);
      } else {
        toast.error(`Transaction ${tx.id.slice(0, 8)} has been tampered with!`);
      }
    } catch (err) {
      console.error('Blockchain verification error:', err);
      toast.error('Could not verify transaction on Sepolia network');
    } finally {
      setVerifyingId(null);
    }
  };

  const filtered = data.filter(
    (tx) =>
      tx.id.includes(search) ||
      tx.buyer?.name.toLowerCase().includes(search.toLowerCase()) ||
      tx.seller?.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header with MetaMask connection status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Database className="text-violet-600" size={24} /> Blockchain Ledger
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Immutable proof-of-transaction anchored to Ethereum Sepolia.
          </p>
        </div>

        {/* MetaMask Button / Indicator */}
        <div className="flex items-center gap-3">
          {walletAddress ? (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-2 rounded-xl text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Sepolia: {walletAddress.slice(0, 6)}…{walletAddress.slice(-4)}</span>
            </div>
          ) : (
            <button
              onClick={handleConnectWallet}
              disabled={connecting}
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-medium text-xs px-3.5 py-2 rounded-xl shadow-sm transition-colors"
            >
              <Wallet size={16} />
              {connecting ? 'Connecting...' : 'Connect MetaMask (Sepolia)'}
            </button>
          )}

          <a
            href={getSepoliaAddressUrl(CONTRACT_ADDRESS)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 border border-slate-200 hover:border-violet-300 text-slate-700 hover:text-violet-700 bg-white px-3 py-2 rounded-xl text-xs font-medium transition-colors"
          >
            Contract <ExternalLink size={14} />
          </a>
        </div>
      </div>

      {/* Info card */}
      <div className="card p-4 flex items-start gap-3 bg-violet-50 border-violet-100">
        <ShieldCheck className="text-violet-600 mt-0.5 shrink-0" size={20} />
        <div className="text-sm text-violet-900">
          <p className="font-semibold">Ethereum Sepolia Testnet Ledger</p>
          <p className="text-xs text-violet-700 mt-0.5">
            Every transaction is cryptographically hashed with SHA-256 and anchored to the smart contract on Sepolia.
            MetaMask signs anchor transactions directly, and verification runs live against the Sepolia testnet.
          </p>
        </div>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          className="input pl-9 w-full"
          placeholder="Search by TX ID, Buyer, or Seller..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="card p-12 text-center text-slate-500">Loading ledger...</div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left min-w-[700px]">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 whitespace-nowrap">TX ID / Hash</th>
                  <th className="px-4 py-3">Item</th>
                  <th className="px-4 py-3">Buyer → Seller</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3 text-right">Sepolia Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-mono text-xs text-slate-900 whitespace-nowrap">
                        ID: {tx.id.slice(0, 8)}…
                      </p>

                      {tx.content_hash ? (
                        <>
                          <p className="font-mono text-[10px] text-slate-400 mt-0.5 whitespace-nowrap">
                            Hash: {tx.content_hash.slice(0, 12)}…
                          </p>
                          {tx.blockchain_tx_hash && (
                            <a
                              href={getSepoliaTxUrl(tx.blockchain_tx_hash)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] text-violet-600 hover:text-violet-800 font-medium underline mt-0.5"
                            >
                              View Block/Tx <ExternalLink size={9} />
                            </a>
                          )}
                        </>
                      ) : (
                        <p className="text-[10px] text-amber-600 mt-0.5 flex items-center gap-1 whitespace-nowrap">
                          <AlertCircle size={10} /> Legacy (No Hash)
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium max-w-[150px] truncate">
                      {tx.listing?.title || 'Item removed'}
                    </td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                      {tx.buyer?.name} → {tx.seller?.name}
                    </td>
                    <td className="px-4 py-3 font-bold text-violet-700 whitespace-nowrap">
                      M {Number(tx.amount).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleVerify(tx)}
                        disabled={!tx.content_hash || verifyingId === tx.id}
                        className="btn-outline text-xs py-1 px-3 disabled:opacity-50 whitespace-nowrap inline-flex items-center gap-1"
                      >
                        {verifyingId === tx.id ? (
                          'Verifying...'
                        ) : tx.content_hash ? (
                          <>
                            <CheckCircle2 size={12} className="text-violet-600" />
                            Verify on Sepolia
                          </>
                        ) : (
                          'No Hash'
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-slate-500">
                      No transactions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
