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
      <div className="aspect-[4/5] md:aspect-[4/3] bg-slate-100 overflow-hidden relative">
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

      <div className="p-2 md:p-3 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-medium text-slate-900 text-sm md:text-base truncate leading-tight">{item.title}</h3>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-1 gap-1">
            <p className="text-violet-600 font-bold text-sm md:text-base">
              M {Number(item.price).toFixed(2)}
            </p>
            
            {/* Stock Indicator */}
            {item.stock > 0 ? (
              <span className="text-[9px] md:text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-medium flex items-center gap-1 w-fit">
                <Package size={10} /> {item.stock} left
              </span>
            ) : (
              <span className="text-[9px] md:text-[10px] bg-red-50 text-red-700 px-1.5 py-0.5 rounded font-medium flex items-center gap-1 w-fit">
                <AlertCircle size={10} /> Out
              </span>
            )}
          </div>

          <div className="flex items-center justify-between mt-2 text-[10px] md:text-xs text-slate-500">
            <span className="inline-flex items-center gap-1 truncate">
              <Tag size={10} className="md:w-3 md:h-3" /> {item.category}
            </span>
            <span className="inline-flex items-center gap-1">
              <Eye size={10} className="md:w-3 md:h-3" /> {item.views ?? 0}
            </span>
          </div>
        </div>

        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] md:text-xs">
          <span className="text-slate-500 truncate max-w-[60%]">{item.seller_name ?? 'Student'}</span>
          <span className={`px-1.5 py-0.5 rounded text-[9px] md:text-[10px] font-medium ${
            item.condition === 'New' ? 'bg-emerald-100 text-emerald-700'
            : item.condition === 'Like new' ? 'bg-violet-100 text-violet-700'
            : 'bg-slate-100 text-slate-600'
          }`}>
            {item.condition}
          </span>
        </div>
      </div>
    </Link>
  );
}