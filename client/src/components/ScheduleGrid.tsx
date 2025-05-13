import { useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { DAYS_OF_WEEK, TIME_SLOTS, Schedule, Teacher, Course, Program } from "@shared/schema";
import { useTeacherData } from "@/hooks/useTeacherData";
import { useCourseData } from "@/hooks/useCourseData";

interface ScheduleGridProps {
  program: string;
  semester: number;
  view: 'weekly' | 'daily';
  selectedDay?: number;
  conflicts: any[];
  onAddClass: (day: number, timeSlot: number) => void;
  onEditClass: (schedule: Schedule) => void;
}

export default function ScheduleGrid({
  program,
  semester,
  view,
  selectedDay,
  conflicts,
  onAddClass,
  onEditClass
}: ScheduleGridProps) {
  const scheduleRef = useRef<HTMLDivElement>(null);

  const { data: currentProgram } = useQuery<Program>({
    queryKey: [`/api/programs/${program}`],
    enabled: !!program
  });

  const { data: scheduleData = [] } = useQuery<Schedule[]>({
    queryKey: [`/api/schedules`, { programId: currentProgram?.id, semester }],
    enabled: !!currentProgram?.id && !!semester
  });

  const { getTeacherById } = useTeacherData();
  const { getCourseById } = useCourseData();

  // Filter days if in daily view
  const days = view === 'weekly' ? DAYS_OF_WEEK : 
    (selectedDay !== undefined ? [DAYS_OF_WEEK[selectedDay]] : [DAYS_OF_WEEK[0]]);
  
  const dayIndices = view === 'weekly' ? 
    days.map((_, index) => index) : 
    (selectedDay !== undefined ? [selectedDay] : [0]);

  // Helper to find conflicts for a schedule
  const getConflictsForSchedule = (scheduleId: number) => {
    return conflicts.filter(conflict => 
      conflict.conflictingScheduleIds.includes(scheduleId) && !conflict.resolved
    );
  };

  // Get schedule for a specific day and time slot
  const getScheduleForSlot = (dayOfWeek: number, timeSlot: number) => {
    return scheduleData.filter(schedule => 
      schedule.dayOfWeek === dayOfWeek && schedule.timeSlot === timeSlot
    );
  };

  // Render a schedule item
  const renderScheduleItem = (schedule: Schedule) => {
    const course = getCourseById(schedule.courseId);
    const teacher = getTeacherById(schedule.teacherId);
    const hasConflict = getConflictsForSchedule(schedule.id).length > 0;
    
    if (!course || !teacher) return null;
    
    const colorClass = (() => {
      switch(course.color) {
        case 'red': return 'bg-red-50 border-l-4 border-red-500';
        case 'blue': return 'bg-blue-50 border-l-4 border-blue-500';
        case 'green': return 'bg-emerald-50 border-l-4 border-emerald-500';
        case 'purple': return 'bg-purple-50 border-l-4 border-purple-500';
        case 'amber': return 'bg-amber-50 border-l-4 border-amber-500';
        case 'indigo': return 'bg-indigo-50 border-l-4 border-indigo-500';
        default: return 'bg-gray-50 border-l-4 border-gray-500';
      }
    })();
    
    const textColorClass = (() => {
      switch(course.color) {
        case 'red': return 'text-red-800';
        case 'blue': return 'text-blue-800';
        case 'green': return 'text-emerald-800';
        case 'purple': return 'text-purple-800';
        case 'amber': return 'text-amber-800';
        case 'indigo': return 'text-indigo-800';
        default: return 'text-gray-800';
      }
    })();

    return (
      <div 
        className={`schedule-item rounded-md ${colorClass} p-2 time-slot shadow-sm relative cursor-pointer transition transform hover:translate-y-[-2px] hover:shadow-md`}
        onClick={() => onEditClass(schedule)}
      >
        {hasConflict && (
          <div className="absolute -top-1 -right-1 text-xs bg-error text-white rounded-full w-5 h-5 flex items-center justify-center">
            <span className="sr-only">Conflict</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
        )}
        <div className={`font-medium ${textColorClass}`}>{course.name}</div>
        <div className="text-sm text-neutral-dark">{teacher.name}</div>
        <div className="text-xs text-neutral-dark mt-1">{schedule.roomNumber || 'No Room Assigned'}</div>
      </div>
    );
  };

  return (
    <div ref={scheduleRef} className="schedule-grid">
      <Card className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <CardHeader className="p-4 border-b border-neutral-light bg-neutral-lightest">
          <CardTitle className="font-display font-semibold text-lg text-neutral-darkest">
            {currentProgram?.code || 'Program'} Semester {semester} {view === 'weekly' ? 'Weekly' : 'Daily'} Schedule
          </CardTitle>
        </CardHeader>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-neutral-lightest">
                <th className="p-3 border-b border-r border-neutral-light text-left text-sm font-medium text-neutral-dark">
                  Time / Day
                </th>
                {dayIndices.map((dayIndex) => (
                  <th key={dayIndex} className="p-3 border-b border-r border-neutral-light text-left text-sm font-medium text-neutral-dark">
                    {DAYS_OF_WEEK[dayIndex]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TIME_SLOTS.map((slot) => (
                <tr key={slot.id}>
                  <td className="p-2 border-b border-r border-neutral-light bg-neutral-lightest text-sm font-medium">
                    <div className="text-neutral-darkest">{slot.label}</div>
                    <div className="text-xs text-neutral-dark">Period {slot.period}</div>
                  </td>
                  
                  {dayIndices.map((dayIndex) => {
                    if (slot.id === 3 && dayIndex === 2) { // Break time row (9:00 AM - 9:20 AM)
                      return (
                        <td key={`${dayIndex}-break`} className="p-2 border-b border-r border-neutral-light" colSpan={view === 'weekly' ? 5 : 1}>
                          <div className="text-center p-4 bg-neutral-lightest rounded border border-neutral-light">
                            <span className="text-sm font-medium text-success">Break Time (9:00 AM - 9:20 AM)</span>
                          </div>
                        </td>
                      );
                    }

                    const schedulesForSlot = getScheduleForSlot(dayIndex, slot.id);
                    
                    return (
                      <td key={`${dayIndex}-${slot.id}`} className="p-2 border-b border-r border-neutral-light">
                        {schedulesForSlot.length > 0 ? (
                          schedulesForSlot.map((schedule) => (
                            <div key={schedule.id}>
                              {renderScheduleItem(schedule)}
                            </div>
                          ))
                        ) : (
                          <Button
                            variant="ghost"
                            className="w-full h-full flex items-center justify-center text-sm text-neutral p-2 rounded-md border border-dashed border-neutral hover:bg-neutral-lightest transition min-h-[100px]"
                            onClick={() => onAddClass(dayIndex, slot.id)}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Class
                          </Button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
