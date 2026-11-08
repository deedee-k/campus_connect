import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../../store/authStore';
import { fetchMyTransactions, updateDeliveryStatus } from '../../services/transactions';
import { Package, Truck, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function SellerOrders() {
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
      toast.success('Order status updated!');
    },
    onError: (err) => {
      console.error(err);
      toast.error(err.message || 'Failed to update status');
    }
  });

  // Only show SALES (where I am the seller)
  const sales = data.filter((t) => t.seller_id === profile?.id);

  // Group by status
  const pendingOrders = sales.filter(s => !s.delivery_status || s.delivery_status === 'Processing');
  const shippedOrders = sales.filter(s => s.delivery_status === 'Shipped');
  const completedOrders = sales.filter(s => s.delivery_status === 'Delivered');

  const renderOrder = (t) => {
    const status = t.delivery_status || 'Processing';

    return (
      <div key={t.id} className="card p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        {t.listing?.image_url ? (
          <img src={t.listing.image_url} alt="" className="w-16 h-16 rounded-lg object-cover bg-slate-100" />
        ) : (
          <div className="w-16 h-16 rounded-lg bg-slate-100 grid place-items-center text-slate-400">
            <Package size={20} />
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-900 truncate">{t.listing?.title}</p>
          <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500">
            <span className="bg-slate-100 px-2 py-0.5 rounded">Qty: {t.quantity || 1}</span>
            <span>•</span>
            <span>Bought by: <strong>{t.buyer?.name}</strong></span>
          </div>
          <p className="text-sm font-semibold text-violet-700 mt-2">M {Number(t.amount).toFixed(2)}</p>
        </div>

        <div className="w-full sm:w-auto mt-4 sm:mt-0 flex flex-col items-end gap-2">
          {/* PROCESSING -> SHIPPED */}
          {status === 'Processing' && (
            <button 
              onClick={() => updateStatusMut.mutate({ id: t.id, status: 'Shipped' })}
              disabled={updateStatusMut.isPending}
              className="btn-primary w-full sm:w-auto bg-blue-600 hover:bg-blue-700 py-1.5 disabled:opacity-50"
            >
              <Truck size={16} /> 
              {updateStatusMut.isPending ? 'Updating...' : 'Mark as Shipped'}
            </button>
          )}

          {/* SHIPPED -> DELIVERED */}
          {status === 'Shipped' && (
            <button 
              onClick={() => updateStatusMut.mutate({ id: t.id, status: 'Delivered' })}
              disabled={updateStatusMut.isPending}
              className="btn-primary w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 py-1.5 disabled:opacity-50"
            >
              <CheckCircle size={16} /> 
              {updateStatusMut.isPending ? 'Updating...' : 'Mark as Delivered'}
            </button>
          )}

          {/* DELIVERED */}
          {status === 'Delivered' && (
            <span className="badge-emerald w-full sm:w-auto text-center justify-center py-1.5">
              <CheckCircle size={14} className="mr-1" /> Completed
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Seller Orders</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your sales and track deliveries.</p>
      </div>

      {isLoading && <div className="card p-12 text-center text-slate-500">Loading orders...</div>}

      {!isLoading && sales.length === 0 && (
        <div className="card p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-violet-50 text-violet-500 grid place-items-center mx-auto">
            <Package size={24} />
          </div>
          <h3 className="mt-4 font-semibold text-slate-900">No orders yet</h3>
          <p className="text-sm text-slate-500 mt-1">When someone buys your items, they will appear here.</p>
          <Link to="/sell" className="btn-primary mt-4 inline-flex">List an Item</Link>
        </div>
      )}

      {pendingOrders.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-amber-600 mb-3 flex items-center gap-2">
            <Package size={18} /> To Ship ({pendingOrders.length})
          </h2>
          <div className="space-y-3">{pendingOrders.map(renderOrder)}</div>
        </section>
      )}

      {shippedOrders.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-blue-600 mb-3 flex items-center gap-2">
            <Truck size={18} /> In Transit ({shippedOrders.length})
          </h2>
          <div className="space-y-3">{shippedOrders.map(renderOrder)}</div>
        </section>
      )}

      {completedOrders.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-emerald-600 mb-3 flex items-center gap-2">
            <CheckCircle size={18} /> Completed ({completedOrders.length})
          </h2>
          <div className="space-y-3">{completedOrders.map(renderOrder)}</div>
        </section>
      )}
    </div>
  );
}