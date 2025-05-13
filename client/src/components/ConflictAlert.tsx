import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useQuery } from "@tanstack/react-query";
import { Conflict } from "@shared/schema";
import { useTeacherData } from "@/hooks/useTeacherData";
import { useCourseData } from "@/hooks/useCourseData";
import { DAYS_OF_WEEK, TIME_SLOTS } from "@shared/schema";

interface ConflictAlertProps {
  onShowResolution: () => void;
}

export default function ConflictAlert({ onShowResolution }: ConflictAlertProps) {
  const { data: conflicts = [] } = useQuery<Conflict[]>({
    queryKey: ['/api/conflicts'],
  });

  const { getTeacherById } = useTeacherData();
  const { getCourseById } = useCourseData();

  const unresolved = conflicts.filter(conflict => !conflict.resolved);

  if (unresolved.length === 0) {
    return null;
  }

  return (
    <Alert className="bg-orange-50 border-l-4 border-warning p-4 mb-6 rounded-md shadow-sm">
      <div className="flex items-start">
        <AlertTriangle className="flex-shrink-0 text-warning text-lg h-5 w-5" />
        <div className="ml-3">
          <AlertTitle className="text-sm font-medium text-warning-700">
            Schedule Conflicts Detected
          </AlertTitle>
          <AlertDescription className="mt-2 text-sm text-neutral-darkest">
            <p>There are {unresolved.length} scheduling conflicts in your current routine:</p>
            <ul className="list-disc list-inside mt-1">
              {unresolved.map((conflict) => {
                const teacher = getTeacherById(conflict.teacherId);
                const courseNames = conflict.conflictingScheduleIds
                  .map(id => {
                    const course = getCourseById(id);
                    return course?.name || 'Unknown Course';
                  })
                  .filter(Boolean)
                  .join(' & ');
                
                const dayName = DAYS_OF_WEEK[conflict.dayOfWeek];
                const timeSlot = TIME_SLOTS[conflict.timeSlot]?.label || 'Unknown Time';
                
                return (
                  <li key={conflict.id}>
                    {teacher?.name || 'Unknown Teacher'} has a conflict on {dayName} at {timeSlot} ({courseNames})
                  </li>
                );
              })}
            </ul>
          </AlertDescription>
          <div className="mt-3">
            <Button 
              variant="link" 
              className="text-sm font-medium text-primary hover:text-primary-light transition"
              onClick={onShowResolution}
            >
              View Resolution Suggestions
            </Button>
          </div>
        </div>
      </div>
    </Alert>
  );
}
