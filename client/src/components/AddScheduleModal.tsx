import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Course, Program, Teacher, Schedule, DAYS_OF_WEEK, TIME_SLOTS } from "@shared/schema";
import { useTeacherData } from "@/hooks/useTeacherData";
import { useCourseData } from "@/hooks/useCourseData";
import { useConflictDetection } from "@/hooks/useConflictDetection";

interface AddScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDay?: number;
  defaultTimeSlot?: number;
  scheduleToEdit?: Schedule;
  programId?: number;
  semester?: number;
}

export default function AddScheduleModal({ 
  isOpen, 
  onClose, 
  defaultDay, 
  defaultTimeSlot, 
  scheduleToEdit,
  programId,
  semester
}: AddScheduleModalProps) {
  const [selectedProgramId, setSelectedProgramId] = useState<number | undefined>(
    scheduleToEdit?.programId || programId
  );
  const [selectedSemester, setSelectedSemester] = useState<number>(
    scheduleToEdit?.semester || semester || 1
  );
  const [selectedDay, setSelectedDay] = useState<number>(
    scheduleToEdit?.dayOfWeek || defaultDay || 0
  );
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<number>(
    scheduleToEdit?.timeSlot || defaultTimeSlot || 0
  );
  const [selectedCourseId, setSelectedCourseId] = useState<number | undefined>(
    scheduleToEdit?.courseId
  );
  const [selectedTeacherId, setSelectedTeacherId] = useState<number | undefined>(
    scheduleToEdit?.teacherId
  );
  const [roomNumber, setRoomNumber] = useState<string>(
    scheduleToEdit?.roomNumber || ""
  );
  const [showConflictWarning, setShowConflictWarning] = useState<boolean>(false);

  const { toast } = useToast();
  const { teachers } = useTeacherData();
  const { courses, getCourseById } = useCourseData();
  const { hasTeacherTimeConflict } = useConflictDetection();

  const { data: programs = [] } = useQuery<Program[]>({
    queryKey: ['/api/programs'],
  });

  // Filter courses based on selected program and semester
  const filteredCourses = courses.filter(
    course => course.programId === selectedProgramId && course.semester === selectedSemester
  );

  // Update course and teacher when course changes
  useEffect(() => {
    if (selectedCourseId) {
      const course = getCourseById(selectedCourseId);
      if (course?.teacherId && !selectedTeacherId) {
        setSelectedTeacherId(course.teacherId);
      }
    }
  }, [selectedCourseId, getCourseById, selectedTeacherId]);

  // Check for conflicts when teacher or timeslot changes
  useEffect(() => {
    if (selectedTeacherId && selectedDay !== undefined && selectedTimeSlot !== undefined) {
      const teacher = teachers.find(t => t.id === selectedTeacherId);
      if (teacher) {
        const hasConflict = hasTeacherTimeConflict(
          teacher, 
          selectedDay, 
          selectedTimeSlot,
          scheduleToEdit?.id
        );
        setShowConflictWarning(hasConflict);
      }
    } else {
      setShowConflictWarning(false);
    }
  }, [selectedTeacherId, selectedDay, selectedTimeSlot, hasTeacherTimeConflict, teachers, scheduleToEdit?.id]);

  const addScheduleMutation = useMutation({
    mutationFn: async (scheduleData: any) => {
      if (scheduleToEdit) {
        const response = await apiRequest("PUT", `/api/schedules/${scheduleToEdit.id}`, scheduleData);
        return await response.json();
      } else {
        const response = await apiRequest("POST", "/api/schedules", scheduleData);
        return await response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/schedules'] });
      queryClient.invalidateQueries({ queryKey: ['/api/conflicts'] });
      toast({
        title: scheduleToEdit ? "Schedule updated" : "Schedule added",
        description: scheduleToEdit
          ? "The class schedule has been updated successfully."
          : "A new class has been added to the schedule.",
        variant: "default",
      });
      resetForm();
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${scheduleToEdit ? "update" : "add"} schedule. Please try again.`,
        variant: "destructive",
      });
      console.error(`Error ${scheduleToEdit ? "updating" : "adding"} schedule:`, error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProgramId || !selectedCourseId || !selectedTeacherId) {
      toast({
        title: "Required fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const scheduleData = {
      programId: selectedProgramId,
      semester: selectedSemester,
      dayOfWeek: selectedDay,
      timeSlot: selectedTimeSlot,
      courseId: selectedCourseId,
      teacherId: selectedTeacherId,
      roomNumber: roomNumber.trim() || undefined,
    };

    addScheduleMutation.mutate(scheduleData);
  };

  const resetForm = () => {
    if (!scheduleToEdit) {
      setSelectedProgramId(programId);
      setSelectedSemester(semester || 1);
      setSelectedDay(defaultDay || 0);
      setSelectedTimeSlot(defaultTimeSlot || 0);
      setSelectedCourseId(undefined);
      setSelectedTeacherId(undefined);
      setRoomNumber("");
    } else {
      setSelectedProgramId(scheduleToEdit.programId);
      setSelectedSemester(scheduleToEdit.semester);
      setSelectedDay(scheduleToEdit.dayOfWeek);
      setSelectedTimeSlot(scheduleToEdit.timeSlot);
      setSelectedCourseId(scheduleToEdit.courseId);
      setSelectedTeacherId(scheduleToEdit.teacherId);
      setRoomNumber(scheduleToEdit.roomNumber || "");
    }
    setShowConflictWarning(false);
  };

  const getTeacherPreferenceMatch = () => {
    if (!selectedTeacherId || selectedDay === undefined || selectedTimeSlot === undefined) {
      return false;
    }
    
    const teacher = teachers.find(t => t.id === selectedTeacherId);
    if (!teacher || !teacher.timePreferences || teacher.timePreferences.length === 0) {
      return false;
    }
    
    return teacher.timePreferences.some(pref => 
      pref.dayOfWeek === selectedDay && 
      selectedTimeSlot >= pref.startTimeSlot && 
      selectedTimeSlot <= pref.endTimeSlot
    );
  };

  const hasTeacherPreference = getTeacherPreferenceMatch();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle className="font-display font-semibold text-lg text-neutral-darkest">
            {scheduleToEdit ? "Edit Class Schedule" : "Add New Class"}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="program" className="font-medium">
                Program <span className="text-error">*</span>
              </Label>
              <Select 
                value={selectedProgramId?.toString()} 
                onValueChange={(value) => {
                  setSelectedProgramId(Number(value));
                  setSelectedCourseId(undefined); // Reset course when program changes
                }}
                disabled={!!scheduleToEdit} // Disable if editing existing schedule
              >
                <SelectTrigger id="program">
                  <SelectValue placeholder="Select a program" />
                </SelectTrigger>
                <SelectContent>
                  {programs.map((program) => (
                    <SelectItem key={program.id} value={program.id.toString()}>
                      {program.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="semester" className="font-medium">
                Semester <span className="text-error">*</span>
              </Label>
              <Select 
                value={selectedSemester?.toString()} 
                onValueChange={(value) => {
                  setSelectedSemester(Number(value));
                  setSelectedCourseId(undefined); // Reset course when semester changes
                }}
                disabled={!!scheduleToEdit} // Disable if editing existing schedule
              >
                <SelectTrigger id="semester">
                  <SelectValue placeholder="Select a semester" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                    <SelectItem key={sem} value={sem.toString()}>
                      Semester {sem}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="day" className="font-medium">
                Day <span className="text-error">*</span>
              </Label>
              <Select 
                value={selectedDay?.toString()} 
                onValueChange={(value) => setSelectedDay(Number(value))}
              >
                <SelectTrigger id="day">
                  <SelectValue placeholder="Select a day" />
                </SelectTrigger>
                <SelectContent>
                  {DAYS_OF_WEEK.map((day, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="timeSlot" className="font-medium">
                Time Slot <span className="text-error">*</span>
              </Label>
              <Select 
                value={selectedTimeSlot?.toString()} 
                onValueChange={(value) => setSelectedTimeSlot(Number(value))}
              >
                <SelectTrigger id="timeSlot">
                  <SelectValue placeholder="Select a time slot" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_SLOTS.map((slot) => (
                    <SelectItem key={slot.id} value={slot.id.toString()}>
                      {slot.label} (Period {slot.period})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="course" className="font-medium">
              Course <span className="text-error">*</span>
            </Label>
            <Select 
              value={selectedCourseId?.toString()} 
              onValueChange={(value) => setSelectedCourseId(Number(value))}
            >
              <SelectTrigger id="course">
                <SelectValue placeholder="Select a course" />
              </SelectTrigger>
              <SelectContent>
                {filteredCourses.length === 0 ? (
                  <SelectItem value="no-courses" disabled>
                    No courses available for selected program/semester
                  </SelectItem>
                ) : (
                  filteredCourses.map((course) => (
                    <SelectItem key={course.id} value={course.id.toString()}>
                      {course.name} ({course.code})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="teacher" className="font-medium">
              Teacher <span className="text-error">*</span>
            </Label>
            <Select 
              value={selectedTeacherId?.toString()} 
              onValueChange={(value) => setSelectedTeacherId(Number(value))}
            >
              <SelectTrigger id="teacher">
                <SelectValue placeholder="Select a teacher" />
              </SelectTrigger>
              <SelectContent>
                {teachers.length === 0 ? (
                  <SelectItem value="no-teachers" disabled>
                    No teachers available
                  </SelectItem>
                ) : (
                  teachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id.toString()}>
                      {teacher.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            
            {hasTeacherPreference && (
              <p className="text-xs text-success">
                ✓ This time slot matches the teacher's preferences.
              </p>
            )}
            
            {showConflictWarning && (
              <p className="text-xs text-error">
                ⚠️ Warning: This teacher already has a class scheduled at this time.
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="room" className="font-medium">
              Room Number
            </Label>
            <Input
              id="room"
              placeholder="Enter room number (e.g., Lab 101)"
              value={roomNumber}
              onChange={(e) => setRoomNumber(e.target.value)}
            />
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                onClose();
              }}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={addScheduleMutation.isPending}
              variant={showConflictWarning ? "destructive" : "default"}
            >
              {addScheduleMutation.isPending
                ? "Saving..."
                : showConflictWarning
                ? "Save Anyway (Creates Conflict)"
                : scheduleToEdit
                ? "Update Class"
                : "Add Class"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
