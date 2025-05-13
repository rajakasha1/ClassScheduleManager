import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Course, InsertCourse } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

export function useCourseData() {
  const queryClient = useQueryClient();

  const { data: courses = [] } = useQuery<Course[]>({
    queryKey: ['/api/courses'],
  });

  const addCourseMutation = useMutation({
    mutationFn: async (courseData: InsertCourse) => {
      const response = await apiRequest("POST", "/api/courses", courseData);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/courses'] });
    },
  });

  const updateCourseMutation = useMutation({
    mutationFn: async ({ id, courseData }: { id: number; courseData: Partial<InsertCourse> }) => {
      const response = await apiRequest("PUT", `/api/courses/${id}`, courseData);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/courses'] });
    },
  });

  const deleteCourseMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/courses/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/courses'] });
    },
  });

  const getCourseById = (id: number | undefined): Course | undefined => {
    if (!id) return undefined;
    return courses.find(course => course.id === id);
  };

  const getCoursesByProgram = (programId: number, semester?: number): Course[] => {
    return courses.filter(
      course => course.programId === programId && 
      (semester === undefined || course.semester === semester)
    );
  };

  const getCoursesByTeacher = (teacherId: number): Course[] => {
    return courses.filter(course => course.teacherId === teacherId);
  };

  const addOrUpdateCourse = async (courseData: InsertCourse, id?: number): Promise<Course> => {
    if (id) {
      return updateCourseMutation.mutateAsync({ id, courseData });
    } else {
      return addCourseMutation.mutateAsync(courseData);
    }
  };

  return {
    courses,
    getCourseById,
    getCoursesByProgram,
    getCoursesByTeacher,
    addOrUpdateCourse,
    deleteCourse: deleteCourseMutation.mutateAsync,
    isLoading: addCourseMutation.isPending || updateCourseMutation.isPending || deleteCourseMutation.isPending,
  };
}
