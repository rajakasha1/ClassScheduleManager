import {
  Program, InsertProgram, 
  Course, InsertCourse, 
  Teacher, InsertTeacher, 
  Schedule, InsertSchedule,
  Conflict, InsertConflict,
  TimePreference, ConflictSuggestion,
  DEFAULT_PROGRAMS
} from "@shared/schema";
import { v4 as uuidv4 } from 'uuid';

export interface IStorage {
  // Program methods
  getPrograms(): Promise<Program[]>;
  getProgramByCode(code: string): Promise<Program | undefined>;

  // Course methods
  getCourses(): Promise<Course[]>;
  getCourseById(id: number): Promise<Course | undefined>;
  getCoursesByProgram(programId: number, semester?: number): Promise<Course[]>;
  createCourse(course: InsertCourse): Promise<Course>;
  updateCourse(id: number, course: Partial<InsertCourse>): Promise<Course | undefined>;
  deleteCourse(id: number): Promise<boolean>;

  // Teacher methods
  getTeachers(): Promise<Teacher[]>;
  getTeacherById(id: number): Promise<Teacher | undefined>;
  createTeacher(teacher: InsertTeacher): Promise<Teacher>;
  updateTeacher(id: number, teacher: Partial<InsertTeacher>): Promise<Teacher | undefined>;
  deleteTeacher(id: number): Promise<boolean>;

  // Schedule methods
  getSchedules(): Promise<Schedule[]>;
  getSchedulesByProgram(programId: number, semester: number): Promise<Schedule[]>;
  createSchedule(schedule: InsertSchedule): Promise<Schedule>;
  updateSchedule(id: number, schedule: Partial<InsertSchedule>): Promise<Schedule | undefined>;
  deleteSchedule(id: number): Promise<boolean>;

  // Conflict methods
  getConflicts(): Promise<Conflict[]>;
  getConflictById(id: number): Promise<Conflict | undefined>;
  createConflict(conflict: InsertConflict): Promise<Conflict>;
  updateConflict(id: number, conflict: Partial<InsertConflict>): Promise<Conflict | undefined>;
  deleteConflict(id: number): Promise<boolean>;
  
  // Special methods
  detectConflicts(): Promise<Conflict[]>;
  generateConflictSuggestions(conflictId: number): Promise<ConflictSuggestion[]>;
}

export class MemStorage implements IStorage {
  private programs: Map<number, Program>;
  private courses: Map<number, Course>;
  private teachers: Map<number, Teacher>;
  private schedules: Map<number, Schedule>;
  private conflicts: Map<number, Conflict>;
  
  private programId: number;
  private courseId: number;
  private teacherId: number;
  private scheduleId: number;
  private conflictId: number;

  constructor() {
    this.programs = new Map();
    this.courses = new Map();
    this.teachers = new Map();
    this.schedules = new Map();
    this.conflicts = new Map();
    
    this.programId = 1;
    this.courseId = 1;
    this.teacherId = 1;
    this.scheduleId = 1;
    this.conflictId = 1;

    // Initialize with default programs
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Add default programs
    DEFAULT_PROGRAMS.forEach(program => {
      const id = this.programId++;
      this.programs.set(id, { ...program, id });
    });
  }

  // Program methods
  async getPrograms(): Promise<Program[]> {
    return Array.from(this.programs.values());
  }

  async getProgramByCode(code: string): Promise<Program | undefined> {
    return Array.from(this.programs.values()).find(program => program.code === code);
  }

  // Course methods
  async getCourses(): Promise<Course[]> {
    return Array.from(this.courses.values());
  }

  async getCourseById(id: number): Promise<Course | undefined> {
    return this.courses.get(id);
  }

  async getCoursesByProgram(programId: number, semester?: number): Promise<Course[]> {
    return Array.from(this.courses.values()).filter(
      course => course.programId === programId && (semester === undefined || course.semester === semester)
    );
  }

  async createCourse(course: InsertCourse): Promise<Course> {
    const id = this.courseId++;
    const newCourse: Course = { ...course, id };
    this.courses.set(id, newCourse);
    return newCourse;
  }

  async updateCourse(id: number, course: Partial<InsertCourse>): Promise<Course | undefined> {
    const existingCourse = this.courses.get(id);
    if (!existingCourse) return undefined;

    const updatedCourse: Course = { ...existingCourse, ...course };
    this.courses.set(id, updatedCourse);
    return updatedCourse;
  }

  async deleteCourse(id: number): Promise<boolean> {
    return this.courses.delete(id);
  }

  // Teacher methods
  async getTeachers(): Promise<Teacher[]> {
    return Array.from(this.teachers.values());
  }

  async getTeacherById(id: number): Promise<Teacher | undefined> {
    return this.teachers.get(id);
  }

  async createTeacher(teacher: InsertTeacher): Promise<Teacher> {
    const id = this.teacherId++;
    const newTeacher: Teacher = { ...teacher, id };
    this.teachers.set(id, newTeacher);
    return newTeacher;
  }

  async updateTeacher(id: number, teacher: Partial<InsertTeacher>): Promise<Teacher | undefined> {
    const existingTeacher = this.teachers.get(id);
    if (!existingTeacher) return undefined;

    const updatedTeacher: Teacher = { ...existingTeacher, ...teacher };
    this.teachers.set(id, updatedTeacher);
    return updatedTeacher;
  }

  async deleteTeacher(id: number): Promise<boolean> {
    return this.teachers.delete(id);
  }

  // Schedule methods
  async getSchedules(): Promise<Schedule[]> {
    return Array.from(this.schedules.values());
  }

  async getSchedulesByProgram(programId: number, semester: number): Promise<Schedule[]> {
    return Array.from(this.schedules.values()).filter(
      schedule => schedule.programId === programId && schedule.semester === semester
    );
  }

  async createSchedule(schedule: InsertSchedule): Promise<Schedule> {
    const id = this.scheduleId++;
    const newSchedule: Schedule = { ...schedule, id };
    this.schedules.set(id, newSchedule);

    // After creating a new schedule, detect if it creates any conflicts
    await this.detectConflicts();
    return newSchedule;
  }

  async updateSchedule(id: number, schedule: Partial<InsertSchedule>): Promise<Schedule | undefined> {
    const existingSchedule = this.schedules.get(id);
    if (!existingSchedule) return undefined;

    const updatedSchedule: Schedule = { ...existingSchedule, ...schedule };
    this.schedules.set(id, updatedSchedule);

    // After updating a schedule, detect if it creates any conflicts
    await this.detectConflicts();
    return updatedSchedule;
  }

  async deleteSchedule(id: number): Promise<boolean> {
    const result = this.schedules.delete(id);
    // After deleting a schedule, detect if it resolves any conflicts
    await this.detectConflicts();
    return result;
  }

  // Conflict methods
  async getConflicts(): Promise<Conflict[]> {
    return Array.from(this.conflicts.values());
  }

  async getConflictById(id: number): Promise<Conflict | undefined> {
    return this.conflicts.get(id);
  }

  async createConflict(conflict: InsertConflict): Promise<Conflict> {
    const id = this.conflictId++;
    const newConflict: Conflict = { ...conflict, id };
    this.conflicts.set(id, newConflict);
    return newConflict;
  }

  async updateConflict(id: number, conflict: Partial<InsertConflict>): Promise<Conflict | undefined> {
    const existingConflict = this.conflicts.get(id);
    if (!existingConflict) return undefined;

    const updatedConflict: Conflict = { ...existingConflict, ...conflict };
    this.conflicts.set(id, updatedConflict);
    return updatedConflict;
  }

  async deleteConflict(id: number): Promise<boolean> {
    return this.conflicts.delete(id);
  }

  // Special methods
  async detectConflicts(): Promise<Conflict[]> {
    // Clear existing conflicts as we'll regenerate them
    this.conflicts.clear();
    this.conflictId = 1;

    const schedules = await this.getSchedules();
    const teacherSchedules = new Map<number, Map<string, number[]>>();
    
    // Group schedules by teacher, day and time slot
    schedules.forEach(schedule => {
      if (!teacherSchedules.has(schedule.teacherId)) {
        teacherSchedules.set(schedule.teacherId, new Map());
      }
      
      const dayTimeKey = `${schedule.dayOfWeek}-${schedule.timeSlot}`;
      const teacherMap = teacherSchedules.get(schedule.teacherId)!;
      
      if (!teacherMap.has(dayTimeKey)) {
        teacherMap.set(dayTimeKey, []);
      }
      
      teacherMap.get(dayTimeKey)!.push(schedule.id);
    });
    
    // Find conflicts
    const conflicts: Conflict[] = [];
    
    teacherSchedules.forEach((dayTimeMap, teacherId) => {
      dayTimeMap.forEach((scheduleIds, dayTimeKey) => {
        if (scheduleIds.length > 1) {
          // We have a conflict
          const [dayOfWeek, timeSlot] = dayTimeKey.split('-').map(Number);
          
          const conflict: InsertConflict = {
            teacherId,
            dayOfWeek,
            timeSlot,
            conflictingScheduleIds: scheduleIds,
            resolved: false,
            suggestions: []
          };
          
          this.createConflict(conflict).then(newConflict => {
            // Generate suggestions for this conflict
            this.generateConflictSuggestions(newConflict.id).then(suggestions => {
              this.updateConflict(newConflict.id, { suggestions });
            });
            conflicts.push(newConflict);
          });
        }
      });
    });
    
    return conflicts;
  }

  async generateConflictSuggestions(conflictId: number): Promise<ConflictSuggestion[]> {
    const conflict = await this.getConflictById(conflictId);
    if (!conflict) return [];
    
    const schedules = await Promise.all(
      conflict.conflictingScheduleIds.map(id => this.schedules.get(id))
    );
    
    const validSchedules = schedules.filter(schedule => schedule !== undefined) as Schedule[];
    if (validSchedules.length < 2) return [];

    const suggestions: ConflictSuggestion[] = [];
    const allSchedules = await this.getSchedules();
    const teacher = await this.getTeacherById(conflict.teacherId);
    
    // Get all existing time slot and day combinations
    const occupiedSlots = new Set(
      allSchedules.map(s => `${s.dayOfWeek}-${s.timeSlot}`)
    );
    
    // For each conflicting schedule, try to find an empty slot
    for (const schedule of validSchedules) {
      // 1. Try to find empty slots
      for (let day = 0; day < 6; day++) {
        for (let slot = 0; slot < 5; slot++) {
          const key = `${day}-${slot}`;
          
          // Skip the current conflict slot and already occupied slots
          if (day === conflict.dayOfWeek && slot === conflict.timeSlot) continue;
          if (occupiedSlots.has(key)) continue;
          
          // Check if this slot is in teacher's preferences (if available)
          let preferenceMatch = true;
          if (teacher?.timePreferences?.length) {
            preferenceMatch = teacher.timePreferences.some(pref => 
              pref.dayOfWeek === day && 
              slot >= pref.startTimeSlot && 
              slot <= pref.endTimeSlot
            );
          }
          
          const course = await this.getCourseById(schedule.courseId);
          
          suggestions.push({
            id: uuidv4(),
            description: `Move ${course?.name || 'Course'} to ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'][day]} at ${['6:30-7:20 AM', '7:20-8:10 AM', '8:10-9:00 AM', '9:20-10:10 AM', '10:10-11:00 AM'][slot]} ${preferenceMatch ? '(matches teacher preference)' : ''}`,
            action: 'move',
            scheduleId: schedule.id,
            newDayOfWeek: day,
            newTimeSlot: slot
          });
        }
      }
      
      // 2. Try to swap with another course taught by a different teacher
      const otherSchedules = allSchedules.filter(s => 
        s.teacherId !== conflict.teacherId && 
        !conflict.conflictingScheduleIds.includes(s.id)
      );
      
      for (const otherSchedule of otherSchedules) {
        const course = await this.getCourseById(schedule.courseId);
        const otherCourse = await this.getCourseById(otherSchedule.courseId);
        
        suggestions.push({
          id: uuidv4(),
          description: `Swap ${course?.name || 'Course'} with ${otherCourse?.name || 'another course'} on ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'][otherSchedule.dayOfWeek]} at ${['6:30-7:20 AM', '7:20-8:10 AM', '8:10-9:00 AM', '9:20-10:10 AM', '10:10-11:00 AM'][otherSchedule.timeSlot]}`,
          action: 'swap',
          scheduleId: schedule.id,
          swapWithScheduleId: otherSchedule.id
        });
      }
      
      // 3. Try to reassign to another teacher
      const allTeachers = await this.getTeachers();
      const otherTeachers = allTeachers.filter(t => t.id !== conflict.teacherId);
      
      for (const otherTeacher of otherTeachers) {
        // Check if other teacher is already busy at this time
        const otherTeacherBusy = allSchedules.some(s => 
          s.teacherId === otherTeacher.id && 
          s.dayOfWeek === conflict.dayOfWeek && 
          s.timeSlot === conflict.timeSlot
        );
        
        if (!otherTeacherBusy) {
          const course = await this.getCourseById(schedule.courseId);
          
          suggestions.push({
            id: uuidv4(),
            description: `Reassign ${course?.name || 'Course'} to ${otherTeacher.name}`,
            action: 'reassign',
            scheduleId: schedule.id,
            newTeacherId: otherTeacher.id
          });
        }
      }
    }
    
    return suggestions;
  }
}

export const storage = new MemStorage();
