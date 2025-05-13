import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Schedule, InsertSchedule } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

export function useScheduleData() {
  const queryClient = useQueryClient();

  const { data: schedules = [] } = useQuery<Schedule[]>({
    queryKey: ['/api/schedules'],
  });

  const addScheduleMutation = useMutation({
    mutationFn: async (scheduleData: InsertSchedule) => {
      const response = await apiRequest("POST", "/api/schedules", scheduleData);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/schedules'] });
      queryClient.invalidateQueries({ queryKey: ['/api/conflicts'] });
    },
  });

  const updateScheduleMutation = useMutation({
    mutationFn: async ({ id, scheduleData }: { id: number; scheduleData: Partial<InsertSchedule> }) => {
      const response = await apiRequest("PUT", `/api/schedules/${id}`, scheduleData);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/schedules'] });
      queryClient.invalidateQueries({ queryKey: ['/api/conflicts'] });
    },
  });

  const deleteScheduleMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/schedules/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/schedules'] });
      queryClient.invalidateQueries({ queryKey: ['/api/conflicts'] });
    },
  });

  const getScheduleById = (id: number): Schedule | undefined => {
    return schedules.find(schedule => schedule.id === id);
  };

  const getSchedulesByProgram = (programId: number, semester: number): Schedule[] => {
    return schedules.filter(
      schedule => schedule.programId === programId && schedule.semester === semester
    );
  };

  const addOrUpdateSchedule = async (scheduleData: InsertSchedule, id?: number): Promise<Schedule> => {
    if (id) {
      return updateScheduleMutation.mutateAsync({ id, scheduleData });
    } else {
      return addScheduleMutation.mutateAsync(scheduleData);
    }
  };

  const saveScheduleChanges = async (): Promise<void> => {
    // This would be implemented if there was a batch save option
    // For now, we're saving changes as they happen
    await queryClient.invalidateQueries({ queryKey: ['/api/schedules'] });
    return Promise.resolve();
  };

  return {
    schedules,
    getScheduleById,
    getSchedulesByProgram,
    addOrUpdateSchedule,
    deleteSchedule: deleteScheduleMutation.mutateAsync,
    saveScheduleChanges,
    isLoading: addScheduleMutation.isPending || updateScheduleMutation.isPending || deleteScheduleMutation.isPending,
  };
}
