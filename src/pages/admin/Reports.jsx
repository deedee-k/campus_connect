import { useState } from 'react';
import { toast } from 'sonner';
import { Flag, CheckCircle, XCircle } from 'lucide-react';
import { useReports, useAccountActions } from '../../hooks/useAdmin';

const STATUSES = ['open', 'resolved', 'dismissed'];

export default function Reports() {
  const [status, setStatus] = useState('open');
  const { data = [], isLoading } = useReports(status);
  const { resolveMut, removeListingMut } = useAccountActions();

  async function handleResolve(id, newStatus) {
    try {
      await resolveMut.mutateAsync({ id, status: newStatus });
      toast.success(`Report ${newStatus}`);
    } catch (e) { toast.error(e.message); }
  }

  async function handleRemoveListing(listingId) {
    if (!confirm('Remove this listing from the marketplace?')) return;
    try {
      await removeListingMut.mutateAsync(listingId);
      toast.success('Listing removed');
    } catch (e) { toast.error(e.message); }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
          <p className="text-sm text-slate-500 mt-1">{data.length} {status} report{data.length === 1 ? '' : 's'}</p>
        </div>
        <select className="input w-40" value={status} onChange={(e) => setStatus(e.target.value)}>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {isLoading && <div className="card p-8 text-center text-slate-500">Loading…</div>}

      {!isLoading && !data.length && (
        <div className="card p-12 text-center">
          <Flag className="mx-auto text-slate-300" size={32} />
          <p className="mt-3 text-slate-500">No {status} reports.</p>
        </div>
      )}

      <div className="space-y-3">
        {data.map((r) => (
          <div key={r.id} className="card p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 text-sm">
                  <span className="badge-slate">{r.listing ? 'listing' : 'message'}</span>
                  <span className="text-slate-500">by {r.reporter?.name ?? 'Unknown'}</span>
                  <span className="text-slate-400">·</span>
                  <span className="text-slate-400">{new Date(r.created_at).toLocaleString()}</span>
                </div>

                {r.listing && (
                  <p className="mt-2 text-sm text-slate-700">
                    <b>Listing:</b> {r.listing.title}
                  </p>
                )}
                <p className="mt-1 text-sm text-slate-600">
                  <b>Reason:</b> {r.reason}
                </p>
              </div>

              {r.status === 'open' && (
                <div className="flex flex-col gap-2 w-40">
                  <button className="btn-primary text-xs" onClick={() => handleResolve(r.id, 'resolved')}>
                    <CheckCircle size={14} /> Resolve
                  </button>
                  <button className="btn-outline text-xs" onClick={() => handleResolve(r.id, 'dismissed')}>
                    <XCircle size={14} /> Dismiss
                  </button>
                  {r.listing && (
                    <button className="btn-danger text-xs border border-red-200" onClick={() => handleRemoveListing(r.listing.id)}>
                      Remove listing
                    </button>
                  )}
                </div>
              )}
              {r.status !== 'open' && (
                <span className={`text-xs ${r.status === 'resolved' ? 'badge-emerald' : 'badge-slate'}`}>
                  {r.status}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}