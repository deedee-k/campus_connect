const CATEGORIES = ["Textbooks","Electronics","Stationery","Clothing","Other"];
const SORTS = [
  { value: "newest",     label: "Newest" },
  { value: "price_asc",  label: "Price up" },
  { value: "price_desc", label: "Price down" },
  { value: "popular",    label: "Most viewed" },
];

export function FilterSidebar({ filters, onChange }) {
  return (
    <aside className="card p-5 h-fit space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-slate-900 mb-2">Category</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onChange({ category: "" })}
            className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
              !filters.category
                ? "bg-violet-600 text-white border-violet-600"
                : "bg-white text-slate-600 border-slate-200 hover:border-violet-300"
            }`}
          >
            All
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => onChange({ category: filters.category === c ? "" : c })}
              className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                filters.category === c
                  ? "bg-violet-600 text-white border-violet-600"
                  : "bg-white text-slate-600 border-slate-200 hover:border-violet-300"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-900 mb-2">Price</h3>
        <div className="flex items-center gap-2">
          <input type="number" placeholder="Min" value={filters.minPrice}
                 onChange={(e) => onChange({ minPrice: e.target.value })}
                 className="input text-sm py-2" />
          <span className="text-slate-400">-</span>
          <input type="number" placeholder="Max" value={filters.maxPrice}
                 onChange={(e) => onChange({ maxPrice: e.target.value })}
                 className="input text-sm py-2" />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-900 mb-2">Sort</h3>
        <select value={filters.sort}
                onChange={(e) => onChange({ sort: e.target.value })}
                className="input text-sm">
          {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {(filters.category || filters.minPrice || filters.maxPrice || filters.q) && (
        <button
          onClick={() => onChange({ category: "", minPrice: "", maxPrice: "", q: "", sort: "newest" })}
          className="btn-ghost w-full text-xs"
        >
          Clear all filters
        </button>
      )}
    </aside>
  );
}
