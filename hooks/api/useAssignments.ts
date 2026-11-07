import { useCallback, useState } from 'react';
import { crewApi } from '@/libs/endpoints';
import { AssignmentStatus, type AssignmentResponse, type WorkerAssignment } from '@/types/api';
import { apiErrorMessage } from '@/libs/api';

/**
 * The signed-in creative's own assignments.
 *
 * `syncCalendar` used to live here and POST to `/calendar/sync`, an endpoint
 * that has never existed; it was removed rather than left failing silently.
 */
export function useAssignments() {
  const [assignments, setAssignments] = useState<WorkerAssignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAssignments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await crewApi.listMine();
      setAssignments(data);
      return data;
    } catch (err) {
      setError(apiErrorMessage(err, 'Failed to fetch assignments'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const respondToAssignment = useCallback(
    async (assignmentId: string, status: AssignmentResponse) => {
      const previous = assignments;
      setAssignments((prev) =>
        prev.map((item) => (item.id === assignmentId ? { ...item, status } : item)),
      );
      try {
        return await crewApi.respond(assignmentId, status);
      } catch (err) {
        setAssignments(previous);
        throw err;
      }
    },
    [assignments],
  );

  return {
    assignments,
    loading,
    error,
    fetchAssignments,
    respondToAssignment,
    accept: (id: string) => respondToAssignment(id, AssignmentStatus.CONFIRMED),
    decline: (id: string) => respondToAssignment(id, AssignmentStatus.DECLINED),
  };
}
