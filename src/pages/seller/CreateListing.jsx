import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Sparkles } from 'lucide-react';
import ListingForm from '../../components/listings/ListingForm';
import { useListingActions } from '../../hooks/useSeller';
import { useAuth } from '../../store/authStore';

export default function CreateListing() {
  const nav = useNavigate();
  const profile = useAuth((s) => s.profile);
  const { createMut } = useListingActions();

  async function handleCreate(values) {
    try {
      const listing = await createMut.mutateAsync(values);
      toast.success('Listing posted!');
      nav(`/listing/${listing.id}`);
    } catch (err) {
      toast.error(err.message || 'Could not post listing');
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <Link to="/my-listings" className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-violet-700">
        <ArrowLeft size={14} /> Back to my listings
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Post a new listing</h1>
        <p className="text-sm text-slate-500 mt-1">
          Posting as <b>{profile?.name}</b>. You can edit or mark sold at any time.
        </p>
      </div>

      <div className="card p-6">
        <ListingForm onSubmit={handleCreate} submitLabel="Post listing" busy={createMut.isLoading} />
      </div>

      <div className="card p-4 bg-violet-50 border-violet-100 flex items-start gap-3">
        <Sparkles className="text-violet-600 mt-0.5" size={18} />
        <div className="text-sm text-violet-900">
          <p className="font-medium">Tip</p>
          <p className="text-violet-800">
            Listings with real photos and detailed descriptions sell 2–3× faster.
          </p>
        </div>
      </div>
    </div>
  );
}