import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { ShieldCheck, Database, Search, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { verifyListingOnChain } from '../../services/blockchain';
import { toast } from 'sonner';

export default function AdminLedger() {
  const [search, setSearch] = useState('');

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
      toast.info("This is a legacy transaction created before blockchain tracking was enabled.");
      return;
    }

    try {
      const isValid = await verifyListingOnChain(tx.id, tx.content_hash);
      if (isValid) {
        toast.success(`Transaction ${tx.id.slice(0, 8)} is verified on the blockchain!`);
      } else {
        toast.error(`Transaction ${tx.id.slice(0, 8)} has been tampered with!`);
      }
    } catch (err) {
      toast.error('Could not connect to local Ganache blockchain');
    }
  };

  const filtered = data.filter((tx) => 
    tx.id.includes(search) || 
    tx.buyer?.name.toLowerCase().includes(search.toLowerCase()) ||
    tx.seller?.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Database className="text-violet-600" size={24} /> Blockchain Ledger
        </h1>
        <p className="text-sm text-slate-500 mt-1">Immutable record of all marketplace transactions.</p>
      </div>

      <div className="card p-4 flex items-start gap-3 bg-violet-50 border-violet-100">
        <ShieldCheck className="text-violet-600 mt-0.5 shrink-0" size={20} />
        <p className="text-sm text-violet-900">
          Every new transaction below is anchored to the local Ganache blockchain. 
          You can verify the integrity of any record by clicking the verify button.
        </p>
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
          {/* Horizontal Scroll Wrapper for Mobile */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left min-w-[700px]">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 whitespace-nowrap">TX ID / Hash</th>
                  <th className="px-4 py-3">Item</th>
                  <th className="px-4 py-3">Buyer → Seller</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-mono text-xs text-slate-900 whitespace-nowrap">ID: {tx.id.slice(0, 8)}…</p>
                      
                      {tx.content_hash ? (
                        <p className="font-mono text-[10px] text-slate-400 mt-0.5 whitespace-nowrap">
                          Hash: {tx.content_hash.slice(0, 12)}…
                        </p>
                      ) : (
                        <p className="text-[10px] text-amber-600 mt-0.5 flex items-center gap-1 whitespace-nowrap">
                          <AlertCircle size={10} /> Legacy (No Hash)
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium max-w-[150px] truncate">{tx.listing?.title || 'Item removed'}</td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                      {tx.buyer?.name} → {tx.seller?.name}
                    </td>
                    <td className="px-4 py-3 font-bold text-violet-700 whitespace-nowrap">M {Number(tx.amount).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right">
                      <button 
                        onClick={() => handleVerify(tx)}
                        disabled={!tx.content_hash}
                        className="btn-outline text-xs py-1 px-2 disabled:opacity-50 whitespace-nowrap"
                      >
                        {tx.content_hash ? 'Verify' : 'No Hash'}
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