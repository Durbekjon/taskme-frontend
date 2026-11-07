import { useCallback, useState } from 'react';
import { bookingsApi } from '@/libs/endpoints';
import { apiErrorMessage } from '@/libs/api';
import type { Booking } from '@/types/api';

export function useBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await bookingsApi.list();
      setBookings(res.data);
      return res.data;
    } catch (err) {
      setError(apiErrorMessage(err, 'Failed to load bookings'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { bookings, loading, error, fetchBookings };
}
