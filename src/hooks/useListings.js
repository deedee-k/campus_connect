import { useQuery } from '@tanstack/react-query';
import { fetchListings, getListing } from '../services/listings';

export function useListings(filters) {
  return useQuery({
    queryKey: ['listings', filters],
    queryFn: () => fetchListings(filters),
    keepPreviousData: true,
  });
}

export function useListing(id) {
  return useQuery({
    queryKey: ['listing', id],
    queryFn: () => getListing(id),
    enabled: !!id,
  });
}