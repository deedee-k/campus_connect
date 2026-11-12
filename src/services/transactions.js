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

  try {
    const txHash = await anchorTransactionOnChain(data.id, contentHash, Number(amount));
    if (txHash) {
      await supabase
        .from('transactions')
        .update({ blockchain_tx_hash: txHash })
        .eq('id', data.id);
      data.blockchain_tx_hash = txHash;
    }
  } catch (err) {
    console.warn("Blockchain anchor skipped:", err);
  }

  const { data: listing } = await supabase
    .from('listings')
    .select('stock')
    .eq('id', listingId)
    .single();

  if (listing) {
    const newStock = Math.max(0, listing.stock - quantity);
    await supabase
      .from('listings')
      .update({
        stock: newStock,
        status: newStock <= 0 ? 'sold' : 'active'
      })
      .eq('id', listingId);
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