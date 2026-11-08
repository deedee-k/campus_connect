import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchMyListings,
  createListing,
  updateListing,
  markListingSold,
  reactivateListing,
  deleteListing,
} from '../services/listings';

export function useMyListings() {
  return useQuery({
    queryKey: ['my-listings'],
    queryFn: fetchMyListings,
  });
}

export function useListingActions() {
  const qc = useQueryClient();

  // Helper to refresh ALL listing caches (home + my-listings)
  const refreshAll = () => {
    qc.invalidateQueries({ queryKey: ['my-listings'] });
    qc.invalidateQueries({ queryKey: ['listings'] }); // <-- This fixes the homepage!
    qc.invalidateQueries({ queryKey: ['favourites'] });
  };

  const createMut = useMutation({
    mutationFn: createListing,
    onSuccess: refreshAll,
  });

  const editMut = useMutation({
    mutationFn: ({ id, patch }) => updateListing(id, patch),
    onSuccess: refreshAll,
  });

  const soldMut = useMutation({
    mutationFn: markListingSold,
    onSuccess: refreshAll,
  });

  const reactivateMut = useMutation({
    mutationFn: reactivateListing,
    onSuccess: refreshAll,
  });

  const deleteMut = useMutation({
    mutationFn: deleteListing,
    onSuccess: refreshAll,
  });

  return { createMut, editMut, soldMut, reactivateMut, deleteMut };
}