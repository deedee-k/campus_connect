import { supabase } from '../lib/supabase';

export async function uploadListingImage(file) {
  const { data: { user } } = await supabase.auth.getUser();
  const ext = file.name.split('.').pop();
  const path = `${user.id}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from('listings')
    .upload(path, file, { cacheControl: '3600', upsert: false });
  if (error) throw error;

  const { data } = supabase.storage.from('listings').getPublicUrl(path);
  return data.publicUrl;
}