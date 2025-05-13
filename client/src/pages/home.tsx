import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Conflict, Course, Program, Schedule, Teacher } from "@shared/schema";
import ProgramSelector from "@/components/ProgramSelector";
import ConflictAlert from "@/components/ConflictAlert";
import ScheduleGrid from "@/components/ScheduleGrid";
import TeacherManagement from "@/components/TeacherManagement";
import CourseManagement from "@/components/CourseManagement";
import ConflictResolutionModal from "@/components/ConflictResolutionModal";
import AddTeacherModal from "@/components/AddTeacherModal";
import AddCourseModal from "@/components/AddCourseModal";
import AddScheduleModal from "@/components/AddScheduleModal";
import { useTeacherData } from "@/hooks/useTeacherData";
import { useCourseData } from "@/hooks/useCourseData";
import { useScheduleData } from "@/hooks/useScheduleData";
import { useConflictDetection } from "@/hooks/useConflictDetection";

export default function Home() {
  const [selectedProgram, setSelectedProgram] = useState("");
  const [selectedSemester, setSelectedSemester] = useState(1);
  const [view, setView] = useState<"weekly" | "daily">("weekly");
  const [selectedDay, setSelectedDay] = useState(0);

  // Modal states
  const [isConflictModalOpen, setIsConflictModalOpen] = useState(false);
  const [isAddTeacherModalOpen, setIsAddTeacherModalOpen] = useState(false);
  const [isAddCourseModalOpen, setIsAddCourseModalOpen] = useState(false);
  const [isAddScheduleModalOpen, setIsAddScheduleModalOpen] = useState(false);
  const [teacherToEdit, setTeacherToEdit] = useState<Teacher | undefined>(undefined);
  const [courseToEdit, setCourseToEdit] = useState<Course | undefined>(undefined);
  const [scheduleToEdit, setScheduleToEdit] = useState<Schedule | undefined>(undefined);

  // Get data from API
  const { data: conflicts = [] } = useQuery<Conflict[]>({
    queryKey: ['/api/conflicts'],
  });
  
  const { data: programs = [] } = useQuery<Program[]>({
    queryKey: ['/api/programs'],
  });

  // Initialize hooks
  const { detectConflicts } = useConflictDetection();
  const { addOrUpdateCourse } = useCourseData();
  const { addOrUpdateTeacher } = useTeacherData();
  const { addOrUpdateSchedule } = useScheduleData();

  // Detect conflicts on initial load
  useEffect(() => {
    detectConflicts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleProgramChange = (program: string) => {
    setSelectedProgram(program);
  };

  const handleSemesterChange = (semester: number) => {
    setSelectedSemester(semester);
  };

  const handleViewChange = (newView: "weekly" | "daily") => {
    setView(newView);
  };

  const handleAddClass = (day: number, timeSlot: number) => {
    setScheduleToEdit(undefined);
    setIsAddScheduleModalOpen(true);
    setSelectedDay(day);
  };

  const handleEditClass = (schedule: Schedule) => {
    setScheduleToEdit(schedule);
    setIsAddScheduleModalOpen(true);
  };

  const handleOpenAddTeacher = () => {
    setTeacherToEdit(undefined);
    setIsAddTeacherModalOpen(true);
  };

  const handleOpenEditTeacher = (teacher: Teacher) => {
    setTeacherToEdit(teacher);
    setIsAddTeacherModalOpen(true);
  };

  const handleOpenAddCourse = () => {
    setCourseToEdit(undefined);
    setIsAddCourseModalOpen(true);
  };

  const handleOpenEditCourse = (course: Course) => {
    setCourseToEdit(course);
    setIsAddCourseModalOpen(true);
  };

  return (
    <main className="container mx-auto px-4 py-6">
      <ProgramSelector
        program={selectedProgram}
        semester={selectedSemester}
        view={view}
        onProgramChange={handleProgramChange}
        onSemesterChange={handleSemesterChange}
        onViewChange={handleViewChange}
      />

      {conflicts.filter(c => !c.resolved).length > 0 && (
        <ConflictAlert onShowResolution={() => setIsConflictModalOpen(true)} />
      )}

      <ScheduleGrid
        program={selectedProgram}
        semester={selectedSemester}
        view={view}
        selectedDay={selectedDay}
        conflicts={conflicts}
        onAddClass={handleAddClass}
        onEditClass={handleEditClass}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <TeacherManagement
          onAddTeacher={handleOpenAddTeacher}
          onEditTeacher={handleOpenEditTeacher}
        />
        <CourseManagement
          onAddCourse={handleOpenAddCourse}
          onEditCourse={handleOpenEditCourse}
        />
      </div>

      {/* Modals */}
      <ConflictResolutionModal 
        isOpen={isConflictModalOpen} 
        onClose={() => setIsConflictModalOpen(false)} 
      />

      <AddTeacherModal
        isOpen={isAddTeacherModalOpen}
        onClose={() => setIsAddTeacherModalOpen(false)}
        teacherToEdit={teacherToEdit}
      />

      <AddCourseModal
        isOpen={isAddCourseModalOpen}
        onClose={() => setIsAddCourseModalOpen(false)}
        courseToEdit={courseToEdit}
      />
      
      <AddScheduleModal
        isOpen={isAddScheduleModalOpen}
        onClose={() => setIsAddScheduleModalOpen(false)}
        defaultDay={selectedDay}
        defaultTimeSlot={selectedDay === 0 ? 0 : undefined}
        scheduleToEdit={scheduleToEdit}
        programId={selectedProgram ? programs.find((p: Program) => p.code === selectedProgram)?.id : undefined}
        semester={selectedSemester}
      />
    </main>
  );
}
