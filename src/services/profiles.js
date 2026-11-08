import { supabase } from '../lib/supabase';

export async function fetchProfiles({ search = '', role = '' } = {}) {
  let query = supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (role) query = query.eq('role', role);
  if (search) query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,student_number.ilike.%${search}%`);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function updateProfile(id, patch) {
  const { data, error } = await supabase
    .from('profiles')
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function setUserRole(id, role) {
  if (role === 'security_admin') {
    throw new Error('security_admin cannot be assigned from this module');
  }
  return updateProfile(id, { role });
}

export async function setUserSuspended(id, suspended) {
  return updateProfile(id, { suspended });
}

export async function setUserVerified(id, verified) {
  return updateProfile(id, { verified });
}