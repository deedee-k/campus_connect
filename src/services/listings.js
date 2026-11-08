import { supabase } from '../lib/supabase';
import { anchorListingOnChain } from './blockchain';

export async function fetchListings({
  q = '',
  category = '',
  minPrice = '',
  maxPrice = '',
  sort = 'newest',
  page = 1,
  pageSize = 12,
} = {}) {
  let query = supabase
    .from('listings')
    .select('*', { count: 'exact' })
    .eq('status', 'active');

  if (category) query = query.eq('category', category);
  if (minPrice !== '' && minPrice != null) query = query.gte('price', Number(minPrice));
  if (maxPrice !== '' && maxPrice != null) query = query.lte('price', Number(maxPrice));
  if (q) query = query.ilike('title', `%${q}%`);

  switch (sort) {
    case 'price_asc':  query = query.order('price', { ascending: true });  break;
    case 'price_desc': query = query.order('price', { ascending: false }); break;
    case 'popular':    query = query.order('views', { ascending: false }); break;
    default:           query = query.order('created_at', { ascending: false });
  }

  const from = (page - 1) * pageSize;
  query = query.range(from, from + pageSize - 1);

  const { data, count, error } = await query;
  if (error) throw error;
  return { items: data ?? [], total: count ?? 0 };
}

export async function getListing(id) {
  const { data, error } = await supabase
    .from('listings')
    .select(`
      *,
      seller:profiles!listings_seller_id_fkey ( location )
    `)
    .eq('id', id)
    .single();
  if (error) throw error;

  supabase
    .from('listings')
    .update({ views: (data.views ?? 0) + 1 })
    .eq('id', id)
    .then(() => {});

  // Merge the location into the main object for easy access
  return { ...data, seller_location: data.seller?.location };
}

export async function fetchMyListings() {
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .eq('seller_id', user.id)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createListing(payload) {
  const { data: { user } } = await supabase.auth.getUser();

  // 1. AI TRUST & SAFETY CHECK
  try {
    const modRes = await fetch('http://localhost:5000/moderate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: payload.title })
    });
    const modData = await modRes.json();
    if (!modData.safe) {
      throw new Error(modData.message); 
    }
  } catch (err) {
    if (err.message.includes("Warning")) throw err;
    console.warn("AI Moderator offline, skipping safety check.");
  }

  const contentHash = await sha256(
    JSON.stringify({ ...payload, sellerId: user.id })
  );

  const sellerName =
    (await supabase
      .from('profiles')
      .select('name')
      .eq('id', user.id)
      .single()
    ).data?.name ?? 'Student';

  const { data, error } = await supabase
    .from('listings')
    .insert({
      title: payload.title,
      description: payload.description,
      price: Number(payload.price),
      category: payload.category,
      condition: payload.condition,
      stock: Number(payload.stock || 1),
      image_url: payload.imageUrl || null,
      seller_id: user.id,
      seller_name: sellerName,
      status: 'active',
      content_hash: contentHash,
    })
    .select()
    .single();

  if (error) throw error;

  try {
    const txHash = await anchorListingOnChain(data.id, data.content_hash);
    if (txHash) {
      await supabase
        .from('listings')
        .update({ blockchain_tx_hash: txHash })
        .eq('id', data.id);
      data.blockchain_tx_hash = txHash;
    }
  } catch (err) {
    console.warn('Blockchain anchor failed (non-fatal):', err);
  }

  return data;
}

export async function updateListing(id, patch) {
  const { data, error } = await supabase
    .from('listings')
    .update(patch)
    .eq('id', id)
    .select()
    .single();
    
  if (error) {
    console.error("Update failed:", error);
    throw error;
  }
  return data;
}

export const markListingSold = (id) => updateListing(id, { status: 'sold' });
export const reactivateListing = (id) => updateListing(id, { status: 'active' });

export async function deleteListing(id) {
  const { error } = await supabase.from('listings').delete().eq('id', id);
  if (error) throw error;
}

async function sha256(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return [...new Uint8Array(buf)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}