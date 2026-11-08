import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { listingSchema } from '../../lib/validators';
import { uploadListingImage } from '../../services/storage';
import { predictPrice } from '../../services/ai';
import { ImagePlus, Loader2, Sparkles, Package } from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIES = ['Textbooks', 'Electronics', 'Stationery', 'Clothing', 'Other'];
const CONDITIONS = ['New', 'Like new', 'Good', 'Fair'];

export default function ListingForm({ defaultValues, onSubmit, submitLabel = 'Post listing', busy }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(defaultValues?.imageUrl ?? '');

  const [aiHint, setAiHint] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      title: '',
      description: '',
      price: '',
      stock: 1, // Default to 1 in stock
      category: 'Textbooks',
      condition: 'Good',
      imageUrl: '',
      ...defaultValues,
    },
  });

  const watchedTitle = watch('title');

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5 MB');
      return;
    }
    setUploading(true);
    try {
      const url = await uploadListingImage(file);
      setPreview(url);
      setValue('imageUrl', url, { shouldValidate: true });
      toast.success('Image uploaded');
    } catch (err) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function handleAISuggest() {
    setAiLoading(true);
    setAiHint(null);
    try {
      const firstWord = (watchedTitle || '').trim().split(' ')[0] || 'Samsung';
      const suggestion = await predictPrice({
        device_brand: firstWord,
        os: 'Android',
        screen_size: 6.5,
        internal_memory: 128,
        ram: 6,
        battery: 5000,
        weight: 190,
        release_year: 2022,
        days_used: 365,
        rear_camera_mp: 12,
        front_camera_mp: 8,
        '4g': 'Yes',
        '5g': 'No',
      });
      if (suggestion) {
        setAiHint(suggestion);
      } else {
        toast.error('AI service unavailable — is Flask running?');
      }
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Image */}
      <div>
        <label className="label">Photo</label>
        <div className="flex items-start gap-4">
          <div className="w-32 h-32 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden grid place-items-center">
            {preview ? (
              <img src={preview} alt="preview" className="w-full h-full object-cover" />
            ) : (
              <ImagePlus className="text-slate-400" size={28} />
            )}
          </div>
          <div className="flex-1">
            <label className="btn-outline cursor-pointer">
              {uploading ? (
                <><Loader2 className="animate-spin" size={16} /> Uploading…</>
              ) : (
                <><ImagePlus size={16} /> Choose image</>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={uploading} />
            </label>
            <p className="text-xs text-slate-500 mt-2">JPG or PNG, max 5 MB.</p>
            {errors.imageUrl && <p className="text-xs text-red-600 mt-1">{errors.imageUrl.message}</p>}
          </div>
        </div>
      </div>

      {/* Title */}
      <div>
        <label className="label">Title</label>
        <input className="input" placeholder="e.g. Samsung Galaxy A52 128GB" {...register('title')} />
        {errors.title && <p className="text-xs text-red-600 mt-1">{errors.title.message}</p>}
      </div>

      {/* Description */}
      <div>
        <label className="label">Description</label>
        <textarea rows={4} className="input" placeholder="Condition, what's included, pickup location…" {...register('description')} />
        {errors.description && <p className="text-xs text-red-600 mt-1">{errors.description.message}</p>}
      </div>

      {/* Price + Stock */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Price (M)</label>
          <input type="number" step="0.01" className="input" placeholder="350" {...register('price')} />
          {errors.price && <p className="text-xs text-red-600 mt-1">{errors.price.message}</p>}
          
          <div className="mt-2">
            <button
              type="button"
              onClick={handleAISuggest}
              disabled={aiLoading}
              className="text-xs text-violet-700 hover:underline inline-flex items-center gap-1 disabled:opacity-50"
            >
              <Sparkles size={12} />
              {aiLoading ? 'Asking AI…' : 'Suggest a price with AI'}
            </button>
          </div>
        </div>

        {/* NEW: Stock Input */}
        <div>
          <label className="label">Stock Quantity</label>
          <div className="relative">
            <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="number" 
              min="1" 
              className="input pl-9" 
              placeholder="1" 
              {...register('stock')} 
            />
          </div>
          {errors.stock && <p className="text-xs text-red-600 mt-1">{errors.stock.message}</p>}
          <p className="text-xs text-slate-500 mt-1">How many do you have available?</p>
        </div>
      </div>

      {aiHint && (
        <div className="p-3 rounded-xl bg-violet-50 border border-violet-200 text-sm">
          <p className="font-medium text-violet-900">
            AI suggests: M {Math.round(aiHint.min)} – M {Math.round(aiHint.max)}
          </p>
          <p className="text-xs text-violet-700 mt-0.5">
            Most likely: M {Math.round(aiHint.predicted_price)}
          </p>
        </div>
      )}

      {/* Condition + Category */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Condition</label>
          <select className="input" {...register('condition')}>
            {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Category</label>
          <select className="input" {...register('category')}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div className="pt-2">
        <button type="submit" disabled={busy || uploading} className="btn-primary">
          {busy ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  );
}