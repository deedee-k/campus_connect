import { Link } from 'react-router-dom';
import { Tag, Eye, Package, AlertCircle } from 'lucide-react';

export function ProductCard({ item }) {
  const isOutOfStock = item.stock <= 0 || item.status === 'sold';

  return (
    <Link
      to={`/listing/${item.id}`}
      className="group bg-white rounded-2xl border border-slate-200 overflow-hidden
                 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 flex flex-col"
    >
      <div className="aspect-[4/3] bg-slate-100 overflow-hidden relative">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.title}
            className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${isOutOfStock ? 'opacity-50 grayscale' : ''}`}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full grid place-items-center text-slate-300">
            <Tag size={32} />
          </div>
        )}

        {/* Out of stock overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-white text-slate-900 font-bold px-3 py-1 rounded-full text-xs uppercase tracking-wide">
              Sold Out
            </span>
          </div>
        )}
      </div>

      <div className="p-3 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-medium text-slate-900 truncate">{item.title}</h3>
          <div className="flex items-center justify-between mt-1">
            <p className="text-violet-600 font-bold">
              M {Number(item.price).toFixed(2)}
            </p>
            
            {/* NEW: Stock Indicator */}
            {item.stock > 0 ? (
              <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-medium flex items-center gap-1">
                <Package size={10} /> {item.stock} in stock
              </span>
            ) : (
              <span className="text-[10px] bg-red-50 text-red-700 px-1.5 py-0.5 rounded font-medium flex items-center gap-1">
                <AlertCircle size={10} /> Out of stock
              </span>
            )}
          </div>

          <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1">
              <Tag size={12} /> {item.category}
            </span>
            <span className="inline-flex items-center gap-1">
              <Eye size={12} /> {item.views ?? 0}
            </span>
          </div>
        </div>

        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-500 truncate">{item.seller_name ?? 'Student'}</span>
          <span className={`badge ${
            item.condition === 'New' ? 'badge-emerald'
            : item.condition === 'Like new' ? 'badge-violet'
            : 'badge-slate'
          }`}>
            {item.condition}
          </span>
        </div>
      </div>
    </Link>
  );
}