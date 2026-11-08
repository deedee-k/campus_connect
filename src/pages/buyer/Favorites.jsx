import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Heart, Trash2, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { listFavourites, removeFavourite } from '../../services/favourites';

export default function Favourites() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ['favourites'],
    queryFn: listFavourites,
  });

  const removeMut = useMutation({
    mutationFn: removeFavourite,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['favourites'] });
      toast.success('Removed from favourites');
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Your favourites</h1>
        <p className="text-sm text-slate-500 mt-1">
          {data.length} saved listing{data.length === 1 ? '' : 's'}
        </p>
      </div>

      {isLoading && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-slate-200 overflow-hidden animate-pulse">
              <div className="aspect-[4/3] bg-slate-100" />
              <div className="p-3 space-y-2">
                <div className="h-4 bg-slate-100 rounded w-3/4" />
                <div className="h-4 bg-slate-100 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && !data.length && (
        <div className="card p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-violet-50 text-violet-500 grid place-items-center mx-auto">
            <Heart size={24} />
          </div>
          <h3 className="mt-4 font-semibold text-slate-900">No favourites yet</h3>
          <p className="text-sm text-slate-500 mt-1">
            Save listings you want to come back to.
          </p>
          <Link to="/" className="btn-primary mt-4 inline-flex">Browse marketplace</Link>
        </div>
      )}

      {!isLoading && data.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {data.map((item) => (
            <div key={item.id} className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all">
              <Link to={`/listing/${item.id}`} className="block">
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
              </Link>
              <div className="p-3">
                <Link to={`/listing/${item.id}`} className="block">
                  <h3 className="font-medium text-slate-900 truncate">{item.title}</h3>
                  <p className="text-violet-600 font-bold mt-1">
                    M {Number(item.price).toFixed(2)}
                  </p>
                </Link>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-slate-500 truncate">
                    {item.seller_name ?? 'Student'}
                  </span>
                  <button
                    onClick={() => removeMut.mutate(item.id)}
                    disabled={removeMut.isLoading}
                    className="text-red-600 hover:bg-red-50 rounded-lg p-1.5 transition-colors"
                    title="Remove from favourites"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}