import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../../store/authStore';
import { fetchMyTransactions, updateDeliveryStatus } from '../../services/transactions';
import { 
  Receipt, Package, ShoppingBag, ArrowUpRight, ArrowDownLeft, 
  Calendar, CreditCard 
} from 'lucide-react';
import { toast } from 'sonner';

export default function Transactions() {
  const profile = useAuth((s) => s.profile);
  const qc = useQueryClient();

  const { data = [], isLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: fetchMyTransactions,
  });

  const updateStatusMut = useMutation({
    mutationFn: ({ id, status }) => updateDeliveryStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('Delivery status updated');
    },
  });

  const purchases = data.filter((t) => t.buyer_id === profile?.id);
  const sales = data.filter((t) => t.seller_id === profile?.id);

  // Group transactions by Date (Day)
  const groupedByDate = data.reduce((acc, tx) => {
    const dateStr = new Date(tx.created_at).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(tx);
    return acc;
  }, {});

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Order History</h1>
        <p className="text-sm text-slate-500 mt-1">Track your purchases and sales.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Stat icon={Receipt} label="Total trades" value={data.length} tone="violet" />
        <Stat icon={ShoppingBag} label="Purchases" value={purchases.length} tone="emerald" />
        <Stat icon={Package} label="Sales" value={sales.length} tone="fuchsia" />
      </div>

      {isLoading && (
        <div className="card p-12 text-center text-slate-500">Loading history…</div>
      )}

      {!isLoading && !data.length && (
        <div className="card p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-violet-50 text-violet-500 grid place-items-center mx-auto">
            <Receipt size={24} />
          </div>
          <h3 className="mt-4 font-semibold text-slate-900">No transactions yet</h3>
          <p className="text-sm text-slate-500 mt-1">Your completed orders will appear here.</p>
          <Link to="/" className="btn-primary mt-4 inline-flex">Browse listings</Link>
        </div>
      )}

      {!isLoading && data.length > 0 && (
        <div className="space-y-6">
          {Object.entries(groupedByDate).map(([date, transactions]) => {
            const orderTotal = transactions.reduce((sum, tx) => sum + Number(tx.amount), 0);
            const paymentMethod = transactions[0]?.payment_method || 'Card';

            return (
              <div key={date} className="card overflow-hidden">
                <div className="bg-slate-50 border-b px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-sm">
                  <div className="flex items-center gap-4 font-medium text-slate-700">
                    <span className="flex items-center gap-1.5"><Calendar size={14}/> {date}</span>
                    <span className="hidden sm:flex items-center gap-1.5 text-slate-500">
                      <CreditCard size={14}/> Paid via {paymentMethod}
                    </span>
                  </div>
                  <div className="text-slate-900">
                    Order Total: <strong className="text-violet-700">M {orderTotal.toFixed(2)}</strong>
                  </div>
                </div>

                <div className="divide-y divide-slate-100">
                  {transactions.map((t) => {
                    const isPurchase = t.buyer_id === profile?.id;
                    const other = isPurchase ? t.seller : t.buyer;
                    
                    return (
                      <div key={t.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 hover:bg-slate-50/50">
                        {t.listing?.image_url ? (
                          <img src={t.listing.image_url} alt="" className="w-16 h-16 rounded-lg object-cover bg-slate-100" />
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-slate-100 grid place-items-center text-slate-400">
                            <Package size={20} />
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <Link to={`/listing/${t.listing?.id}`} className="font-medium text-slate-900 hover:text-violet-700 truncate block">
                            {t.listing?.title || 'Item removed'}
                          </Link>
                          <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                            <span className="bg-slate-100 px-2 py-0.5 rounded">Qty: {t.quantity || 1}</span>
                            <span>•</span>
                            <span>{t.listing?.category}</span>
                          </div>

                          {isPurchase && (
                            <div className="mt-3">
                              <div className="flex items-center gap-2 text-xs font-medium mb-1">
                                <span className="text-slate-500">Status:</span>
                                <span className={`px-2 py-0.5 rounded-full ${
                                  t.delivery_status === 'Delivered' ? 'bg-emerald-100 text-emerald-700' :
                                  t.delivery_status === 'Shipped' ? 'bg-blue-100 text-blue-700' :
                                  'bg-amber-100 text-amber-700'
                                }`}>
                                  {t.delivery_status || 'Processing'}
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-1 mt-2 w-full max-w-xs">
                                <div className={`h-1.5 flex-1 rounded-full ${t.delivery_status ? 'bg-violet-600' : 'bg-slate-200'}`}></div>
                                <div className={`h-1.5 flex-1 rounded-full ${t.delivery_status === 'Shipped' || t.delivery_status === 'Delivered' ? 'bg-violet-600' : 'bg-slate-200'}`}></div>
                                <div className={`h-1.5 flex-1 rounded-full ${t.delivery_status === 'Delivered' ? 'bg-violet-600' : 'bg-slate-200'}`}></div>
                              </div>
                              <div className="flex justify-between text-[10px] text-slate-400 mt-1 max-w-xs">
                                <span>Processing</span>
                                <span>Shipped</span>
                                <span>Delivered</span>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="text-right sm:min-w-[150px]">
                          <div className="mb-1">
                            {isPurchase ? (
                              <span className="badge-emerald inline-flex items-center gap-1">
                                <ArrowDownLeft size={12} /> Purchase
                              </span>
                            ) : (
                              <span className="badge-violet inline-flex items-center gap-1">
                                <ArrowUpRight size={12} /> Sale
                              </span>
                            )}
                          </div>
                          <p className="font-bold text-slate-900">M {Number(t.amount).toFixed(2)}</p>
                          
                          {isPurchase ? (
                            <p className="text-xs text-slate-500 mt-0.5">From: {other?.name}</p>
                          ) : (
                            <div className="mt-2 text-left">
                              <p className="text-xs text-slate-500 mb-1">To: {other?.name}</p>
                              <select 
                                value={t.delivery_status || 'Processing'}
                                onChange={(e) => updateStatusMut.mutate({ id: t.id, status: e.target.value })}
                                className="text-xs border rounded p-1 bg-white cursor-pointer"
                              >
                                <option value="Processing">Processing</option>
                                <option value="Shipped">Shipped</option>
                                <option value="Delivered">Delivered</option>
                              </select>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Stat({ icon: Icon, label, value, tone }) {
  const tones = {
    violet: 'bg-violet-50 text-violet-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    fuchsia: 'bg-fuchsia-50 text-fuchsia-600',
  };
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-500">{label}</span>
        <span className={`w-8 h-8 rounded-lg grid place-items-center ${tones[tone]}`}>
          <Icon size={16} />
        </span>
      </div>
      <p className="text-2xl font-bold text-slate-900 mt-3">{value}</p>
    </div>
  );
}