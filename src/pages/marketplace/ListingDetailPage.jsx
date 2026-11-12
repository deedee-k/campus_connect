import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Heart, MessageCircle, Tag, Eye, ShieldCheck, AlertTriangle, MapPin, ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import { useListing } from '../../hooks/useListings';
import { addFavourite, removeFavourite, isFavourite } from '../../services/favourites';
import { verifyListingOnChain, getSepoliaTxUrl } from '../../services/blockchain';
import { addToCart } from '../../services/cart';
import { useAuth } from '../../store/authStore';
import { supabase } from '../../lib/supabase';

export default function ListingDetailPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const qc = useQueryClient();
  const { data: item, isLoading, isError, error } = useListing(id);
  const profile = useAuth((s) => s.profile);

  const [verifyResult, setVerifyResult] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [buying, setBuying] = useState(false);

  const fav = useQuery({
    queryKey: ['is-favourite', id],
    queryFn: () => isFavourite(id),
    enabled: !!id,
  });

  const toggleFav = useMutation({
    mutationFn: async () => (fav.data ? removeFavourite(id) : addFavourite(id)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['is-favourite', id] });
      qc.invalidateQueries({ queryKey: ['favourites'] });
      toast.success(fav.data ? 'Removed from favourites' : 'Saved to favourites');
    },
  });

  const handleAddToCart = async () => {
    try {
      await addToCart(item.id, 1);
      toast.success('Added to cart!');
    } catch (err) {
      toast.error(err.message);
    }
  };

  async function handleVerify() {
    if (!item.content_hash) return;
    setVerifying(true);
    setVerifyResult(null);
    try {
      const isValid = await verifyListingOnChain(item.id, item.content_hash);
      setVerifyResult(isValid);
      if (isValid) toast.success('Hash matches the blockchain!');
      else toast.error('Tampered! Hash does not match.');
    } catch (err) {
      console.error(err);
      toast.error('Could not connect to blockchain');
      setVerifyResult(false);
    } finally {
      setVerifying(false);
    }
  }

  async function handleBuy() {
    setBuying(true);
    try {
      // Add the item to the cart and redirect
      await addToCart(item.id, 1);
      toast.success('Item added to cart!');
      nav('/cart');
    } catch (err) {
      toast.error(err.message || 'Failed to add to cart');
    } finally {
      setBuying(false);
    }
  }

  async function handleReport() {
    const reason = prompt("Why are you reporting this listing? (e.g., Scam, Prohibited item, Wrong category)");
    if (!reason) return;

    const { error } = await supabase.from('reports').insert({
      listing_id: item.id,
      reporter_id: profile.id,
      reason: reason,
      status: 'open'
    });

    if (error) toast.error('Failed to submit report');
    else toast.success('Report submitted. Admins will review this.');
  }

  if (isLoading) {
    return <div className="card p-12 text-center text-slate-500">Loading…</div>;
  }
  if (isError || !item) {
    return (
      <div className="card p-12 text-center">
        <p className="text-slate-700">{error?.message ?? 'Listing not found.'}</p>
        <button onClick={() => nav('/')} className="btn-outline mt-4">
          Back to marketplace
        </button>
      </div>
    );
  }

  const isOwner = profile?.id === item.seller_id;
  const isOutOfStock = (item.stock ?? 0) <= 0 || item.status === 'sold';

  return (
    <div className="space-y-4">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-violet-700">
        <ArrowLeft size={14} /> Back to marketplace
      </Link>

      <div className="grid md:grid-cols-[2fr_1fr] gap-6">
        <div className="card overflow-hidden">
          <div className="aspect-[16/10] bg-slate-100">
            {item.image_url ? (
              <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full grid place-items-center text-slate-300">
                <Tag size={40} />
              </div>
            )}
          </div>
          <div className="p-6">
            <h1 className="text-2xl font-bold text-slate-900">{item.title}</h1>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className="text-2xl font-bold text-violet-700">
                M {Number(item.price).toFixed(2)}
              </span>
              <span className="badge-violet">{item.category}</span>
              <span className="badge-slate">{item.condition}</span>
              <span className="badge-slate inline-flex items-center gap-1">
                <Eye size={12} /> {item.views ?? 0}
              </span>
            </div>
            <p className="text-slate-700 mt-4 whitespace-pre-wrap">{item.description}</p>

            {item.content_hash && (
              <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck className="text-slate-600" size={18} />
                  <p className="font-medium text-slate-900">Blockchain Integrity</p>
                </div>
                <p className="text-xs text-slate-500 mb-3">
                  Hash: <code className="bg-white px-1 py-0.5 rounded border">{item.content_hash.slice(0, 16)}…</code>
                </p>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleVerify}
                    disabled={verifying}
                    className="btn-outline text-xs py-1.5 px-3"
                  >
                    {verifying ? 'Verifying on Sepolia...' : 'Verify on Sepolia'}
                  </button>

                  {item.blockchain_tx_hash && (
                    <a
                      href={getSepoliaTxUrl(item.blockchain_tx_hash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-violet-600 hover:text-violet-800 flex items-center gap-1 font-medium underline"
                    >
                      View on Etherscan <ExternalLink size={12} />
                    </a>
                  )}
                </div>

                {verifyResult === true && (
                  <p className="mt-2 text-emerald-600 font-medium flex items-center gap-1">
                    ✓ Verified — matches Sepolia blockchain
                  </p>
                )}
                {verifyResult === false && (
                  <p className="mt-2 text-red-600 font-medium flex items-center gap-1">
                    ✗ Tampered — hash mismatch on Sepolia
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-3">
          <div className="card p-5">
            <p className="text-xs uppercase tracking-wide text-slate-400">Seller</p>
            <p className="font-semibold text-slate-900 mt-1">{item.seller_name ?? 'Student'}</p>

            {/* Display Seller Location */}
            {item.seller_location && (
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                <MapPin size={12} /> {item.seller_location}
              </p>
            )}

            {isOwner ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm text-center mt-4">
                This is your listing.
              </div>
            ) : (
              <>
                <button
                  onClick={handleBuy}
                  disabled={buying || isOutOfStock}
                  className="btn-primary w-full mt-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
                >
                  {buying ? 'Processing...' : isOutOfStock ? 'Out of Stock' : 'Buy Now'}
                </button>
                <button
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  className="btn-outline w-full mt-2 disabled:opacity-50"
                >
                  Add to Cart
                </button>
              </>
            )}

            <button
              onClick={() => nav(`/chat/${item.id}`)}
              className="btn-outline w-full mt-2"
            >
              <MessageCircle size={16} /> Ask AI Assistant
            </button>

            <button
              onClick={() => toggleFav.mutate()}
              className={`btn-outline w-full mt-2 ${fav.data ? 'text-violet-700 border-violet-300' : ''}`}
            >
              <Heart size={16} fill={fav.data ? 'currentColor' : 'none'} />
              {fav.data ? 'Saved' : 'Save for later'}
            </button>
          </div>

          <div className="card p-5 text-xs text-slate-500">
            <p className="font-medium text-slate-700 mb-1">Safety tips</p>
            <ul className="space-y-1 list-disc list-inside mb-4">
              <li>Meet in a public place on campus</li>
              <li>Inspect the item before paying</li>
              <li>Use the app to record the transaction</li>
            </ul>

            {!isOwner && (
              <button
                onClick={handleReport}
                className="text-xs text-red-600 hover:underline flex items-center gap-1 w-full justify-center pt-3 border-t border-slate-100"
              >
                <AlertTriangle size={12} /> Report this listing
              </button>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}