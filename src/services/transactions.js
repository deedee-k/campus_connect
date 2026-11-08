import { supabase } from '../lib/supabase';
import { anchorTransactionOnChain } from './blockchain';

export async function fetchMyTransactions() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *,
      listing:listings ( id, title, image_url, category, price ),
      buyer:profiles!transactions_buyer_id_fkey ( id, name ),
      seller:profiles!transactions_seller_id_fkey ( id, name )
    `)
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function recordTransaction({ listingId, sellerId, amount, quantity = 1, paymentMethod = 'Card' }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in');

  if (user.id === sellerId) {
    throw new Error("You cannot buy your own item.");
  }

  const contentHash = await sha256(
    JSON.stringify({ listingId, buyerId: user.id, sellerId, amount })
  );

  // Insert the transaction into Supabase first
  const { data, error } = await supabase
    .from('transactions')
    .insert({
      listing_id: listingId,
      buyer_id: user.id,
      seller_id: sellerId,
      amount: Number(amount),
      quantity: quantity,
      payment_method: paymentMethod,
      status: 'completed',
      delivery_status: 'Processing',
      content_hash: contentHash,
    })
    .select()
    .single();

  if (error) throw error;

  // Anchor and deposit to escrow on the blockchain
  try {
    await anchorTransactionOnChain(data.id, contentHash, Number(amount));
  } catch (err) {
    console.warn("Escrow deposit failed, but transaction saved in DB:", err);
  }

  // Deduct stock
  await supabase.rpc('decrement_stock', { 
    row_id: listingId, 
    quantity_to_deduct: quantity 
  }).catch(() => {}); // Ignore if rpc doesn't exist

  // If stock reaches 0, mark as sold (simple fallback if no trigger)
  const { data: listing } = await supabase.from('listings').select('stock').eq('id', listingId).single();
  if (listing && listing.stock <= quantity) {
    await supabase.from('listings').update({ status: 'sold' }).eq('id', listingId);
  }

  return data;
}

export async function updateDeliveryStatus(transactionId, status) {
  const { data, error } = await supabase
    .from('transactions')
    .update({ delivery_status: status })
    .eq('id', transactionId)
    .select()
    .single();
    
  if (error) throw error;
  return data;
}

async function sha256(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return [...new Uint8Array(buf)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}