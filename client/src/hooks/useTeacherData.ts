import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Teacher, InsertTeacher } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

export function useTeacherData() {
  const queryClient = useQueryClient();

  const { data: teachers = [] } = useQuery<Teacher[]>({
    queryKey: ['/api/teachers'],
  });

  const addTeacherMutation = useMutation({
    mutationFn: async (teacherData: InsertTeacher) => {
      const response = await apiRequest("POST", "/api/teachers", teacherData);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teachers'] });
    },
  });

  const updateTeacherMutation = useMutation({
    mutationFn: async ({ id, teacherData }: { id: number; teacherData: Partial<InsertTeacher> }) => {
      const response = await apiRequest("PUT", `/api/teachers/${id}`, teacherData);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teachers'] });
    },
  });

  const deleteTeacherMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/teachers/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teachers'] });
    },
  });

  const getTeacherById = (id: number | undefined): Teacher | undefined => {
    if (!id) return undefined;
    return teachers.find(teacher => teacher.id === id);
  };

  const getTeachersBySkill = (skill: string): Teacher[] => {
    return teachers.filter(
      teacher => teacher.skills && teacher.skills.some(s => s.toLowerCase().includes(skill.toLowerCase()))
    );
  };

  const getTeachersBySpecialization = (specialization: string): Teacher[] => {
    return teachers.filter(
      teacher => teacher.specialization && 
      teacher.specialization.toLowerCase().includes(specialization.toLowerCase())
    );
  };

  const addOrUpdateTeacher = async (teacherData: InsertTeacher, id?: number): Promise<Teacher> => {
    if (id) {
      return updateTeacherMutation.mutateAsync({ id, teacherData });
    } else {
      return addTeacherMutation.mutateAsync(teacherData);
    }
  };

  return {
    teachers,
    getTeacherById,
    getTeachersBySkill,
    getTeachersBySpecialization,
    addOrUpdateTeacher,
    deleteTeacher: deleteTeacherMutation.mutateAsync,
    isLoading: addTeacherMutation.isPending || updateTeacherMutation.isPending || deleteTeacherMutation.isPending,
  };
}
