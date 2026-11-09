import { useState } from 'react';
import { useListings } from '../../hooks/useListings';
import { SearchBar } from '../../components/marketplace/SearchBar';
import { FilterSidebar } from '../../components/marketplace/FilterSidebar';
import { ListingGrid } from '../../components/marketplace/ListingGrid';
import { useAuth } from '../../store/authStore';
import { Store, SlidersHorizontal, X } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Home() {
  const profile = useAuth((s) => s.profile);
  const [filters, setFilters] = useState({
    q: '', category: '', minPrice: '', maxPrice: '', sort: 'newest', page: 1,
  });
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const { data, isLoading, isError, error } = useListings(filters);

  function updateFilter(patch) {
    setFilters((f) => ({ ...f, ...patch, page: patch.page ?? 1 }));
  }

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-violet-700 to-fuchsia-700 text-white p-6 md:p-12">
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/10 blur-3xl" />
        <div className="relative max-w-2xl">
          <h1 className="text-2xl md:text-4xl font-bold leading-tight">
            Find what you need on campus.
          </h1>
          <p className="mt-2 md:mt-3 text-sm md:text-base text-violet-100">
            Textbooks, electronics, clothing — from students you can trust.
          </p>
          <div className="mt-4 md:mt-6">
            <SearchBar value={filters.q} onChange={(q) => updateFilter({ q })} />
          </div>
        </div>
      </section>

      {/* Buyer prompt */}
      {profile?.role === 'buyer' && (
        <div className="card p-4 flex items-center gap-3 bg-violet-50 border-violet-100">
          <div className="w-10 h-10 rounded-xl bg-white text-violet-600 grid place-items-center shrink-0">
            <Store size={20} />
          </div>
          <div className="flex-1">
            <p className="font-medium text-slate-900 text-sm md:text-base">Want to sell too?</p>
            <p className="text-xs md:text-sm text-slate-600">Request seller access from your profile.</p>
          </div>
          <Link to="/profile" className="btn-primary text-xs md:text-sm whitespace-nowrap">Go to profile</Link>
        </div>
      )}

      {/* Mobile Filter Toggle */}
      <div className="flex items-center justify-between md:hidden">
        <p className="text-sm font-medium text-slate-600">{data?.total || 0} items found</p>
        <button onClick={() => setShowMobileFilters(true)} className="btn-outline text-sm py-1.5 px-3 flex items-center gap-2">
          <SlidersHorizontal size={14} /> Filters
        </button>
      </div>

      {/* Filters + grid */}
      <div className="grid md:grid-cols-[260px_1fr] gap-6">
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <FilterSidebar filters={filters} onChange={updateFilter} />
        </div>

        {/* Mobile Sidebar (Modal) */}
        {showMobileFilters && (
          <div className="fixed inset-0 bg-black/50 z-50 md:hidden flex justify-end">
            <div className="bg-white w-[80%] max-w-sm h-full p-6 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-lg">Filters</h2>
                <button onClick={() => setShowMobileFilters(false)} className="p-2 bg-slate-100 rounded-full"><X size={18} /></button>
              </div>
              <FilterSidebar filters={filters} onChange={updateFilter} />
              <button onClick={() => setShowMobileFilters(false)} className="btn-primary w-full mt-6">Show Results</button>
            </div>
          </div>
        )}

        <section>
          {isError && <div className="card p-4 text-red-700 bg-red-50 border-red-200">Could not load listings: {error.message}</div>}
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