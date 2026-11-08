import { supabase } from '../lib/supabase';

export async function requestSellerRole(message = '') {
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('role_requests')
    .insert({
      user_id: user.id,
      requested_role: 'seller',
      message,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function myRoleRequests() {
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('role_requests')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function listRoleRequests() {
  const { data, error } = await supabase
    .from('role_requests')
    .select(`
      *,
      requester:profiles!role_requests_user_id_fkey ( id, name, email, student_number )
    `)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function approveRoleRequest(id) {
  const { data: req, error: e1 } = await supabase
    .from('role_requests')
    .select('*')
    .eq('id', id)
    .single();
  if (e1) throw e1;

  // Update the user's role
  const { error: e2 } = await supabase
    .from('profiles')
    .update({ role: req.requested_role })
    .eq('id', req.user_id);
  if (e2) throw e2;

  // Mark the request approved
  const { data: { user } } = await supabase.auth.getUser();
  const { error: e3 } = await supabase
    .from('role_requests')
    .update({
      status: 'approved',
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (e3) throw e3;
}

export async function rejectRoleRequest(id) {
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase
    .from('role_requests')
    .update({
      status: 'rejected',
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) throw error;
}