import { supabase } from '../lib/supabase';

export async function fetchReports({ status = '' } = {}) {
  let query = supabase
    .from('reports')
    .select(`
      *,
      listing:listings ( id, title, seller_id, status ),
      reporter:profiles!reports_reporter_id_fkey ( id, name, email ),
      resolver:profiles!reports_resolved_by_fkey ( id, name )
    `)
    .order('created_at', { ascending: false });

  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function resolveReport(id, status = 'resolved') {
  const { data, error } = await supabase
    .from('reports')
    .update({
      status,
      resolved_by: (await supabase.auth.getUser()).data.user.id,
      resolved_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function removeReportedListing(listingId) {
  const { error } = await supabase
    .from('listings')
    .update({ status: 'removed' })
    .eq('id', listingId);
  if (error) throw error;
}