import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listRoleRequests,
  approveRoleRequest,
  rejectRoleRequest,
} from '../services/roleRequests';

export function useRoleRequests() {
  return useQuery({
    queryKey: ['admin', 'role-requests'],
    queryFn: listRoleRequests,
  });
}

export function useRoleRequestActions() {
  const qc = useQueryClient();

  const approveMut = useMutation({
    mutationFn: approveRoleRequest,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'role-requests'] });
      qc.invalidateQueries({ queryKey: ['admin', 'accounts'] });
    },
  });

  const rejectMut = useMutation({
    mutationFn: rejectRoleRequest,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'role-requests'] }),
  });

  return { approveMut, rejectMut };
}