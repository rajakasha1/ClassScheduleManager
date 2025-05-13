import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Conflict, ConflictSuggestion, Schedule, Teacher } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

export function useConflictDetection() {
  const queryClient = useQueryClient();

  const { data: conflicts = [] } = useQuery<Conflict[]>({
    queryKey: ['/api/conflicts'],
  });

  const detectConflictsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("GET", "/api/conflicts/detect");
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/conflicts'] });
    },
  });

  const generateSuggestionsMutation = useMutation({
    mutationFn: async (conflictId: number) => {
      const response = await apiRequest("GET", `/api/conflicts/${conflictId}/suggestions`);
      return await response.json();
    },
    onSuccess: (_, conflictId) => {
      queryClient.invalidateQueries({ queryKey: ['/api/conflicts', conflictId, 'suggestions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/conflicts'] });
    },
  });

  const resolveConflictMutation = useMutation({
    mutationFn: async ({ conflictId, suggestionId }: { conflictId: number; suggestionId: string }) => {
      await apiRequest("POST", `/api/conflicts/${conflictId}/resolve`, { suggestionId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/conflicts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/schedules'] });
    },
  });

  const getUnresolvedConflicts = (): Conflict[] => {
    return conflicts.filter(conflict => !conflict.resolved);
  };

  const getTeacherConflicts = (teacherId: number): Conflict[] => {
    return conflicts.filter(
      conflict => conflict.teacherId === teacherId && !conflict.resolved
    );
  };

  const getConflictsForSchedule = (scheduleId: number): Conflict[] => {
    return conflicts.filter(
      conflict => conflict.conflictingScheduleIds.includes(scheduleId) && !conflict.resolved
    );
  };

  const detectConflicts = async (): Promise<Conflict[]> => {
    return detectConflictsMutation.mutateAsync();
  };

  const generateSuggestions = async (conflictId: number): Promise<ConflictSuggestion[]> => {
    return generateSuggestionsMutation.mutateAsync(conflictId);
  };

  const resolveConflict = async (conflictId: number, suggestionId: string): Promise<void> => {
    return resolveConflictMutation.mutateAsync({ conflictId, suggestionId });
  };

  const hasTeacherTimeConflict = (teacher: Teacher, dayOfWeek: number, timeSlot: number, ignoredScheduleId?: number): boolean => {
    return conflicts.some(
      conflict => 
        conflict.teacherId === teacher.id && 
        conflict.dayOfWeek === dayOfWeek && 
        conflict.timeSlot === timeSlot &&
        !conflict.resolved &&
        (!ignoredScheduleId || !conflict.conflictingScheduleIds.includes(ignoredScheduleId))
    );
  };

  return {
    conflicts,
    unresolvedConflicts: getUnresolvedConflicts(),
    getTeacherConflicts,
    getConflictsForSchedule,
    detectConflicts,
    generateSuggestions,
    resolveConflict,
    hasTeacherTimeConflict,
    isDetecting: detectConflictsMutation.isPending,
    isGeneratingSuggestions: generateSuggestionsMutation.isPending,
    isResolvingConflict: resolveConflictMutation.isPending,
  };
}
