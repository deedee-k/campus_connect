import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  PlusCircle, Trash2, CheckCircle, RotateCcw, Eye, PackageOpen,
} from 'lucide-react';
import { useMyListings, useListingActions } from '../../hooks/useSeller';
import { EmptyState } from '../../components/ui/EmptyState';
import { Spinner } from '../../components/ui/Spinner';

const STATUS_STYLES = {
  active: 'badge-emerald',
  sold: 'badge-slate',
  removed: 'badge-red',
};

export default function MyListings() {
  const { data = [], isLoading } = useMyListings();
  const { soldMut, reactivateMut, deleteMut } = useListingActions();

  async function handleSold(id) {
    try { await soldMut.mutateAsync(id); toast.success('Marked as sold'); }
    catch (e) { toast.error(e.message); }
  }

  async function handleReactivate(id) {
    try { await reactivateMut.mutateAsync(id); toast.success('Listing reactivated'); }
    catch (e) { toast.error(e.message); }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this listing permanently?')) return;
    try { await deleteMut.mutateAsync(id); toast.success('Listing deleted'); }
    catch (e) { toast.error(e.message); }
  }

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My listings</h1>
          <p className="text-sm text-slate-500 mt-1">{data.length} listing{data.length === 1 ? '' : 's'}</p>
        </div>
        <Link to="/sell" className="btn-primary w-full sm:w-auto justify-center">
          <PlusCircle size={16} /> New listing
        </Link>
      </div>

      {isLoading && (
        <div className="card p-12 grid place-items-center">
          <Spinner />
        </div>
      )}

      {!isLoading && !data.length && (
        <EmptyState
          icon={PackageOpen}
          title="No listings yet"
          message="Post your first item to start selling."
          action={<Link to="/sell" className="btn-primary"><PlusCircle size={16}/> Post a listing</Link>}
        />
      )}

      <div className="space-y-3">
        {data.map((l) => (
          <div key={l.id} className="card p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <img
                src={l.image_url || 'https://placehold.co/80'}
                alt={l.title}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover bg-slate-100 shrink-0"
              />
              <div className="flex-1 min-w-0 sm:hidden">
                <Link to={`/listing/${l.id}`} className="font-medium text-slate-900 truncate block hover:text-violet-700">
                  {l.title}
                </Link>
                <p className="text-sm text-slate-500">M {l.price}</p>
              </div>
            </div>

            <div className="flex-1 min-w-0 hidden sm:block">
              <div className="flex items-center gap-2">
                <Link to={`/listing/${l.id}`} className="font-medium text-slate-900 truncate hover:text-violet-700">
                  {l.title}
                </Link>
                <span className={STATUS_STYLES[l.status] ?? 'badge-slate'}>{l.status}</span>
              </div>
              <p className="text-sm text-slate-500">
                M {l.price} · {l.category} · {l.condition}
              </p>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                <Eye size={12} /> {l.views ?? 0} views
                <span>·</span>
                {new Date(l.created_at).toLocaleDateString()}
              </p>
            </div>

            {/* Mobile Status & Actions */}
            <div className="flex items-center justify-between w-full sm:w-auto mt-2 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-0 border-slate-100">
              <span className={`sm:hidden text-xs px-2 py-1 rounded-full ${STATUS_STYLES[l.status] === 'badge-emerald' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                {l.status}
              </span>
              
              <div className="flex items-center gap-2">
                {l.status === 'active' && (
                  <>
                    <Link to={`/listing/${l.id}`} className="btn-ghost p-2" title="View">
                      <Eye size={18} />
                    </Link>
                    <button className="btn-ghost text-emerald-600 p-2" title="Mark sold" onClick={() => handleSold(l.id)}>
                      <CheckCircle size={18} />
                    </button>
                    <button className="btn-ghost text-red-600 p-2" title="Delete" onClick={() => handleDelete(l.id)}>
                      <Trash2 size={18} />
                    </button>
                  </>
                )}
                {l.status === 'sold' && (
                  <button className="btn-ghost text-violet-600 p-2" title="Reactivate" onClick={() => handleReactivate(l.id)}>
                    <RotateCcw size={18} />
                  </button>
                )}
                {l.status === 'removed' && (
                  <span className="text-xs text-slate-400 italic">Removed by admin</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}