import { ProductCard } from './ProductCard';
import { PackageOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

export function ListingGrid({ items, page, total, pageSize = 12, loading, onPageChange }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-slate-200 overflow-hidden animate-pulse">
            <div className="aspect-[4/3] bg-slate-100" />
            <div className="p-3 space-y-2">
              <div className="h-4 bg-slate-100 rounded w-3/4" />
              <div className="h-4 bg-slate-100 rounded w-1/3" />
              <div className="h-3 bg-slate-100 rounded w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="card p-12 text-center">
        <div className="w-12 h-12 rounded-2xl bg-violet-50 text-violet-500 grid place-items-center mx-auto">
          <PackageOpen size={24} />
        </div>
        <h3 className="mt-4 font-semibold text-slate-900">No listings found</h3>
        <p className="text-sm text-slate-500 mt-1">
          Try a different search, or clear your filters.
        </p>
        <Link to="/sell" className="btn-primary mt-4">Post the first listing</Link>
      </div>
    );
  }

  const pages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map((it) => <ProductCard key={it.id} item={it} />)}
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="btn-outline disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-slate-600 px-2">
            Page {page} of {pages}
          </span>
          <button
            disabled={page >= pages}
            onClick={() => onPageChange(page + 1)}
            className="btn-outline disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}