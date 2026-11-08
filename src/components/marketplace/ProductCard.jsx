import { Link } from "react-router-dom";
import { Tag, Eye } from "lucide-react";

export function ProductCard({ item }) {
  return (
    <Link
      to={`/listing/${item.id}`}
      className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
    >
      <div className="aspect-[4/3] bg-slate-100 overflow-hidden">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full grid place-items-center text-slate-300">
            <Tag size={32} />
          </div>
        )}
      </div>

      <div className="p-3">
        <h3 className="font-medium text-slate-900 truncate">{item.title}</h3>
        <p className="text-violet-600 font-bold mt-1">
          M {Number(item.price).toFixed(2)}
        </p>

        <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1">
            <Tag size={12} /> {item.category}
          </span>
          <span className="inline-flex items-center gap-1">
            <Eye size={12} /> {item.views ?? 0}
          </span>
        </div>

        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-500 truncate">{item.seller_name ?? "Student"}</span>
          <span className={`badge ${
            item.condition === "New" ? "badge-emerald"
            : item.condition === "Like new" ? "badge-violet"
            : "badge-slate"
          }`}>
            {item.condition}
          </span>
        </div>
      </div>
    </Link>
  );
}
