import { useState } from 'react';
import { useListings } from '../../hooks/useListings';
import { SearchBar } from '../../components/marketplace/SearchBar';
import { FilterSidebar } from '../../components/marketplace/FilterSidebar';
import { ListingGrid } from '../../components/marketplace/ListingGrid';
import { useAuth } from '../../store/authStore';
import { Store } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Home() {
  const profile = useAuth((s) => s.profile);
  const [filters, setFilters] = useState({
    q: '',
    category: '',
    minPrice: '',
    maxPrice: '',
    sort: 'newest',
    page: 1,
  });

  const { data, isLoading, isError, error } = useListings(filters);

  function updateFilter(patch) {
    setFilters((f) => ({ ...f, ...patch, page: patch.page ?? 1 }));
  }

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-violet-700 to-fuchsia-700 text-white p-8 md:p-12">
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/10 blur-3xl" />
        <div className="relative max-w-2xl">
          <h1 className="text-3xl md:text-4xl font-bold leading-tight">
            Find what you need on campus.
          </h1>
          <p className="mt-3 text-violet-100">
            Textbooks, electronics — from students you can trust.
          </p>
          <div className="mt-6">
            <SearchBar
              value={filters.q}
              onChange={(q) => updateFilter({ q })}
            />
          </div>
        </div>
      </section>

      {/* Buyer prompt — only for buyers */}
      {profile?.role === 'buyer' && (
        <div className="card p-4 flex items-center gap-3 bg-violet-50 border-violet-100">
          <div className="w-10 h-10 rounded-xl bg-white text-violet-600 grid place-items-center shrink-0">
            <Store size={20} />
          </div>
          <div className="flex-1">
            <p className="font-medium text-slate-900">Want to sell too?</p>
            <p className="text-sm text-slate-600">Request seller access from your profile.</p>
          </div>
          <Link to="/profile" className="btn-primary text-sm">Go to profile</Link>
        </div>
      )}

      {/* Filters + grid */}
      <div className="grid md:grid-cols-[260px_1fr] gap-6">
        <FilterSidebar filters={filters} onChange={updateFilter} />

        <section>
          {isError && (
            <div className="card p-4 text-red-700 bg-red-50 border-red-200">
              Could not load listings: {error.message}
            </div>
          )}

          <ListingGrid
            items={data?.items ?? []}
            page={filters.page}
            total={data?.total ?? 0}
            loading={isLoading}
            onPageChange={(page) => setFilters((f) => ({ ...f, page }))}
          />
        </section>
      </div>
    </div>
  );
}