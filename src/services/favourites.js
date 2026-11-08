import { supabase } from '../lib/supabase';

export async function listFavourites() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('favourites')
    .select('listing:listings(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => row.listing).filter(Boolean);
}

export async function isFavourite(listingId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase
    .from('favourites')
    .select('id')
    .eq('user_id', user.id)
    .eq('listing_id', listingId)
    .maybeSingle();

  if (error) throw error;
  return !!data;
}

export async function addFavourite(listingId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in');

  const { error } = await supabase
    .from('favourites')
    .insert({ user_id: user.id, listing_id: listingId });

  if (error && error.code !== '23505') throw error;
}

export async function removeFavourite(listingId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in');

  const { error } = await supabase
    .from('favourites')
    .delete()
    .eq('user_id', user.id)
    .eq('listing_id', listingId);

  if (error) throw error;
}