import { supabase } from '../lib/supabase';

export async function getCart() {
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('cart_items')
    .select(`
      *,
      listing:listings ( id, title, price, image_url, seller_id, seller_name, stock )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
    
  if (error) throw error;
  return data || [];
}

export async function addToCart(listingId, quantity = 1) {
  const { data: { user } } = await supabase.auth.getUser();
  
  // 1. Fetch the listing to check seller and stock
  const { data: listing } = await supabase
    .from('listings')
    .select('seller_id, stock')
    .eq('id', listingId)
    .single();

  if (listing?.seller_id === user.id) {
    throw new Error("You cannot add your own item to the cart.");
  }

  if (listing.stock < quantity) {
    throw new Error(`Only ${listing.stock} left in stock.`);
  }
  
  // 2. Check if item already exists in cart
  const { data: existing } = await supabase
    .from('cart_items')
    .select('id, quantity')
    .eq('user_id', user.id)
    .eq('listing_id', listingId)
    .maybeSingle(); // Use maybeSingle to avoid errors if not found

  if (existing) {
    // Check if adding more exceeds stock
    const newQuantity = existing.quantity + quantity;
    if (newQuantity > listing.stock) {
       throw new Error(`You can only buy up to ${listing.stock} of this item.`);
    }

    // Update quantity
    const { error } = await supabase
      .from('cart_items')
      .update({ quantity: newQuantity })
      .eq('id', existing.id);
    if (error) throw error;
  } else {
    // Insert new
    const { error } = await supabase
      .from('cart_items')
      .insert({ user_id: user.id, listing_id: listingId, quantity });
    if (error) throw error;
  }
}

export async function updateCartQuantity(cartItemId, newQuantity) {
  // Fetch the listing to check stock limit
  const { data: cartItem } = await supabase
    .from('cart_items')
    .select('listing:listings(stock)')
    .eq('id', cartItemId)
    .single();

  if (cartItem && newQuantity > cartItem.listing.stock) {
    throw new Error(`Only ${cartItem.listing.stock} available in stock.`);
  }

  const { error } = await supabase
    .from('cart_items')
    .update({ quantity: newQuantity })
    .eq('id', cartItemId);
  if (error) throw error;
}

export async function removeFromCart(cartItemId) {
  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('id', cartItemId);
  if (error) throw error;
}

export async function clearCart() {
  const { data: { user } } = await supabase.auth.getUser();
  await supabase.from('cart_items').delete().eq('user_id', user.id);
}