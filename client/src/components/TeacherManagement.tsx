import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Teacher } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useTeacherData } from "@/hooks/useTeacherData";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { DAYS_OF_WEEK, TIME_SLOTS } from "@shared/schema";

interface TeacherManagementProps {
  onAddTeacher: () => void;
  onEditTeacher: (teacher: Teacher) => void;
}

export default function TeacherManagement({ onAddTeacher, onEditTeacher }: TeacherManagementProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  
  const { data: teachers = [] } = useQuery<Teacher[]>({
    queryKey: ['/api/teachers'],
  });

  const deleteTeacherMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/teachers/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teachers'] });
      toast({
        title: "Teacher deleted",
        description: "The teacher has been removed successfully.",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete teacher. Please try again.",
        variant: "destructive",
      });
      console.error("Error deleting teacher:", error);
    },
  });

  const handleDeleteTeacher = (id: number) => {
    if (window.confirm("Are you sure you want to delete this teacher?")) {
      deleteTeacherMutation.mutate(id);
    }
  };

  const filteredTeachers = teachers.filter(teacher => 
    teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (teacher.specialization && teacher.specialization.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (teacher.skills && teacher.skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  const formatTimePreference = (pref: any) => {
    if (!pref) return '';
    const day = DAYS_OF_WEEK[pref.dayOfWeek];
    const startTimeSlot = TIME_SLOTS[pref.startTimeSlot]?.label.split(' - ')[0] || '';
    const endTimeSlot = TIME_SLOTS[pref.endTimeSlot]?.label.split(' - ')[1] || '';
    return `${day.slice(0, 3)} ${startTimeSlot}-${endTimeSlot}`;
  };

  return (
    <Card className="bg-white rounded-lg shadow-md overflow-hidden">
      <CardHeader className="p-4 border-b border-neutral-light bg-neutral-lightest flex justify-between items-center">
        <CardTitle className="font-display font-semibold text-lg text-neutral-darkest">
          Teacher Management
        </CardTitle>
        <Button 
          variant="default" 
          size="sm" 
          className="text-sm bg-primary hover:bg-primary-light text-white px-3 py-1 rounded-md flex items-center space-x-1"
          onClick={onAddTeacher}
        >
          <Plus className="h-3 w-3" />
          <span>Add Teacher</span>
        </Button>
      </CardHeader>
      
      <CardContent className="p-4">
        <div className="mb-4">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search teachers..."
              className="w-full p-2 pl-9 border border-neutral-light rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-3 top-3 h-4 w-4 text-neutral" />
          </div>
        </div>
        
        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
          {filteredTeachers.length === 0 ? (
            <div className="text-center py-6 text-neutral-dark">
              No teachers found. Add a new teacher to get started.
            </div>
          ) : (
            filteredTeachers.map((teacher) => (
              <div key={teacher.id} className="border border-neutral-light rounded-md p-3 hover:bg-neutral-lightest transition">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-neutral-darkest">{teacher.name}</h3>
                    <p className="text-sm text-neutral-dark">{teacher.specialization || 'No specialization'}</p>
                    <div className="flex flex-wrap items-center mt-1 gap-1">
                      {teacher.skills?.map((skill, index) => (
                        <span key={index} className="text-xs bg-blue-100 text-blue-800 py-0.5 px-2 rounded-full">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-neutral hover:text-primary transition p-1"
                      onClick={() => onEditTeacher(teacher)}
                    >
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-neutral hover:text-error transition p-1"
                      onClick={() => handleDeleteTeacher(teacher.id)}
                      disabled={deleteTeacherMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </div>
                
                {teacher.timePreferences && teacher.timePreferences.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-neutral-light">
                    <p className="text-xs font-medium text-neutral-dark mb-2">Preferred Time Slots:</p>
                    <div className="flex flex-wrap gap-1">
                      {teacher.timePreferences.map((pref, index) => (
                        <span key={index} className="text-xs bg-neutral-lightest border border-neutral-light py-0.5 px-2 rounded">
                          {formatTimePreference(pref)}
                        </span>
                      ))}
                    </div>
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
