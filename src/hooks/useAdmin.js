import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchProfiles, setUserRole, setUserSuspended, setUserVerified,
} from '../services/profiles';
import { fetchReports, resolveReport, removeReportedListing } from '../services/reports';

export function useAccounts(filters) {
  return useQuery({
    queryKey: ['admin', 'accounts', filters],
    queryFn: () => fetchProfiles(filters),
  });
}

export function useReports(status) {
  return useQuery({
    queryKey: ['admin', 'reports', status],
    queryFn: () => fetchReports({ status }),
  });
}

export function useAccountActions() {
  const qc = useQueryClient();

  const roleMut = useMutation({
    mutationFn: ({ id, role }) => setUserRole(id, role),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'accounts'] }),
  });

  const suspendMut = useMutation({
    mutationFn: ({ id, suspended }) => setUserSuspended(id, suspended),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'accounts'] }),
  });

  const verifyMut = useMutation({
    mutationFn: ({ id, verified }) => setUserVerified(id, verified),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'accounts'] }),
  });

  const resolveMut = useMutation({
    mutationFn: ({ id, status }) => resolveReport(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'reports'] }),
  });

  const removeListingMut = useMutation({
    mutationFn: (listingId) => removeReportedListing(listingId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'reports'] }),
  });

  return { roleMut, suspendMut, verifyMut, resolveMut, removeListingMut };
}