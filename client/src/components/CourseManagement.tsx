import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Course } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useTeacherData } from "@/hooks/useTeacherData";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

interface CourseManagementProps {
  onAddCourse: () => void;
  onEditCourse: (course: Course) => void;
}

export default function CourseManagement({ onAddCourse, onEditCourse }: CourseManagementProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  
  const { data: courses = [] } = useQuery<Course[]>({
    queryKey: ['/api/courses'],
  });

  const { getTeacherById } = useTeacherData();

  const deleteCourseMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/courses/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/courses'] });
      toast({
        title: "Course deleted",
        description: "The course has been removed successfully.",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete course. Please try again.",
        variant: "destructive",
      });
      console.error("Error deleting course:", error);
    },
  });

  const handleDeleteCourse = (id: number) => {
    if (window.confirm("Are you sure you want to delete this course?")) {
      deleteCourseMutation.mutate(id);
    }
  };

  const filteredCourses = courses.filter(course => 
    course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (course.description && course.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getColorDisplay = (color: string) => {
    const bgColorMap: Record<string, string> = {
      red: 'bg-red-500',
      blue: 'bg-blue-500',
      green: 'bg-emerald-500',
      purple: 'bg-purple-500',
      amber: 'bg-amber-500',
      indigo: 'bg-indigo-500',
    };
    
    return bgColorMap[color] || 'bg-gray-500';
  };

  return (
    <Card className="bg-white rounded-lg shadow-md overflow-hidden">
      <CardHeader className="p-4 border-b border-neutral-light bg-neutral-lightest flex justify-between items-center">
        <CardTitle className="font-display font-semibold text-lg text-neutral-darkest">
          Course Management
        </CardTitle>
        <Button 
          variant="default" 
          size="sm" 
          className="text-sm bg-primary hover:bg-primary-light text-white px-3 py-1 rounded-md flex items-center space-x-1"
          onClick={onAddCourse}
        >
          <Plus className="h-3 w-3" />
          <span>Add Course</span>
        </Button>
      </CardHeader>
      
      <CardContent className="p-4">
        <div className="mb-4">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search courses..."
              className="w-full p-2 pl-9 border border-neutral-light rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-3 top-3 h-4 w-4 text-neutral" />
          </div>
        </div>
        
        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
          {filteredCourses.length === 0 ? (
            <div className="text-center py-6 text-neutral-dark">
              No courses found. Add a new course to get started.
            </div>
          ) : (
            filteredCourses.map((course) => (
              <div key={course.id} className="border border-neutral-light rounded-md p-3 hover:bg-neutral-lightest transition">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center">
                      <span className={`w-3 h-3 rounded-full ${getColorDisplay(course.color)} mr-2`}></span>
                      <h3 className="font-medium text-neutral-darkest">{course.name}</h3>
                    </div>
                    <p className="text-sm text-neutral-dark">Course Code: {course.code}</p>
                    <div className="flex items-center mt-1">
                      <span className="text-xs bg-neutral-lightest border border-neutral-light py-0.5 px-2 rounded mr-1">
                        {course.credits} Credits
                      </span>
                      <span className="text-xs bg-neutral-lightest border border-neutral-light py-0.5 px-2 rounded">
                        {course.isCore ? 'Core' : 'Elective'}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-neutral hover:text-primary transition p-1"
                      onClick={() => onEditCourse(course)}
                    >
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-neutral hover:text-error transition p-1"
                      onClick={() => handleDeleteCourse(course.id)}
                      disabled={deleteCourseMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </div>
                
                {course.teacherId && (
                  <div className="mt-3 pt-3 border-t border-neutral-light">
                    <p className="text-xs font-medium text-neutral-dark mb-1">Assigned Teacher:</p>
                    <p className="text-sm text-neutral-darkest">
                      {getTeacherById(course.teacherId)?.name || 'Unassigned'}
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
