import { eq, and, inArray } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { db } from './db';
import { 
  programs, courses, teachers, schedules, conflicts,
  type Program, type Course, type Teacher, type Schedule, type Conflict,
  type InsertProgram, type InsertCourse, type InsertTeacher, type InsertSchedule, type InsertConflict,
  type TimePreference, type ConflictSuggestion,
  DAYS_OF_WEEK, TIME_SLOTS
} from '@shared/schema';
import { IStorage } from './storage';

export class DatabaseStorage implements IStorage {
  // Program methods
  async getPrograms(): Promise<Program[]> {
    return await db.select().from(programs);
  }

  async getProgramByCode(code: string): Promise<Program | undefined> {
    const result = await db.select().from(programs).where(eq(programs.code, code));
    return result.length > 0 ? result[0] : undefined;
  }

  // Course methods
  async getCourses(): Promise<Course[]> {
    return await db.select().from(courses);
  }

  async getCourseById(id: number): Promise<Course | undefined> {
    const result = await db.select().from(courses).where(eq(courses.id, id));
    return result.length > 0 ? result[0] : undefined;
  }

  async getCoursesByProgram(programId: number, semester?: number): Promise<Course[]> {
    if (semester !== undefined) {
      return await db.select().from(courses).where(
        and(
          eq(courses.programId, programId),
          eq(courses.semester, semester)
        )
      );
    } else {
      return await db.select().from(courses).where(eq(courses.programId, programId));
    }
  }

  async createCourse(course: InsertCourse): Promise<Course> {
    const result = await db.insert(courses).values(course).returning();
    return result[0];
  }

  async updateCourse(id: number, course: Partial<InsertCourse>): Promise<Course | undefined> {
    const result = await db.update(courses)
      .set(course)
      .where(eq(courses.id, id))
      .returning();
    return result.length > 0 ? result[0] : undefined;
  }

  async deleteCourse(id: number): Promise<boolean> {
    const result = await db.delete(courses).where(eq(courses.id, id)).returning();
    return result.length > 0;
  }

  // Teacher methods
  async getTeachers(): Promise<Teacher[]> {
    return await db.select().from(teachers);
  }

  async getTeacherById(id: number): Promise<Teacher | undefined> {
    const result = await db.select().from(teachers).where(eq(teachers.id, id));
    return result.length > 0 ? result[0] : undefined;
  }

  async createTeacher(teacher: InsertTeacher): Promise<Teacher> {
    // Make sure to convert preferences array properly
    const result = await db.insert(teachers).values({
      ...teacher,
      specialization: teacher.specialization || null,
      skills: teacher.skills || null,
      timePreferences: teacher.timePreferences || null
    }).returning();
    return result[0];
  }

  async updateTeacher(id: number, teacher: Partial<InsertTeacher>): Promise<Teacher | undefined> {
    // Handle timePreferences properly
    const updateData: any = { ...teacher };
    
    // Ensure null values are handled correctly
    if ('specialization' in teacher) {
      updateData.specialization = teacher.specialization || null;
    }
    if ('skills' in teacher) {
      updateData.skills = teacher.skills || null;
    }
    if ('timePreferences' in teacher) {
      updateData.timePreferences = teacher.timePreferences || null;
    }
    
    const result = await db.update(teachers)
      .set(updateData)
      .where(eq(teachers.id, id))
      .returning();
    return result.length > 0 ? result[0] : undefined;
  }

  async deleteTeacher(id: number): Promise<boolean> {
    const result = await db.delete(teachers).where(eq(teachers.id, id)).returning();
    return result.length > 0;
  }

  // Schedule methods
  async getSchedules(): Promise<Schedule[]> {
    return await db.select().from(schedules);
  }

  async getSchedulesByProgram(programId: number, semester: number): Promise<Schedule[]> {
    return await db.select().from(schedules).where(
      and(
        eq(schedules.programId, programId),
        eq(schedules.semester, semester)
      )
    );
  }

  async createSchedule(schedule: InsertSchedule): Promise<Schedule> {
    const result = await db.insert(schedules).values(schedule).returning();
    return result[0];
  }

  async updateSchedule(id: number, schedule: Partial<InsertSchedule>): Promise<Schedule | undefined> {
    const result = await db.update(schedules)
      .set(schedule)
      .where(eq(schedules.id, id))
      .returning();
    return result.length > 0 ? result[0] : undefined;
  }

  async deleteSchedule(id: number): Promise<boolean> {
    const result = await db.delete(schedules).where(eq(schedules.id, id)).returning();
    return result.length > 0;
  }

  // Conflict methods
  async getConflicts(): Promise<Conflict[]> {
    return await db.select().from(conflicts);
  }

  async getConflictById(id: number): Promise<Conflict | undefined> {
    const result = await db.select().from(conflicts).where(eq(conflicts.id, id));
    return result.length > 0 ? result[0] : undefined;
  }

  async createConflict(conflict: InsertConflict): Promise<Conflict> {
    const result = await db.insert(conflicts).values(conflict).returning();
    return result[0];
  }

  async updateConflict(id: number, conflict: Partial<InsertConflict>): Promise<Conflict | undefined> {
    const result = await db.update(conflicts)
      .set(conflict)
      .where(eq(conflicts.id, id))
      .returning();
    return result.length > 0 ? result[0] : undefined;
  }

  async deleteConflict(id: number): Promise<boolean> {
    const result = await db.delete(conflicts).where(eq(conflicts.id, id)).returning();
    return result.length > 0;
  }

  // Special methods
  async detectConflicts(): Promise<Conflict[]> {
    // Get all schedules
    const allSchedules = await this.getSchedules();
    const teacherMap = new Map<number, Schedule[]>();
    
    // Group schedules by teacher
    for (const schedule of allSchedules) {
      if (!teacherMap.has(schedule.teacherId)) {
        teacherMap.set(schedule.teacherId, []);
      }
      teacherMap.get(schedule.teacherId)!.push(schedule);
    }
    
    // Find conflicts
    const newConflicts: Conflict[] = [];
    
    for (const [teacherId, teacherSchedules] of teacherMap.entries()) {
      // Group schedules by day and time slot
      const slotMap = new Map<string, Schedule[]>();
      
      for (const schedule of teacherSchedules) {
        const key = `${schedule.dayOfWeek}-${schedule.timeSlot}`;
        if (!slotMap.has(key)) {
          slotMap.set(key, []);
        }
        slotMap.get(key)!.push(schedule);
      }
      
      // Find conflicts (multiple schedules in the same time slot)
      for (const [key, slotSchedules] of slotMap.entries()) {
        if (slotSchedules.length > 1) {
          const [day, time] = key.split('-').map(Number);
          const scheduleIds = slotSchedules.map(s => s.id);
          
          // Check if this conflict already exists in the database
          const existingConflicts = await db.select()
            .from(conflicts)
            .where(
              and(
                eq(conflicts.teacherId, teacherId),
                eq(conflicts.dayOfWeek, day),
                eq(conflicts.timeSlot, time)
              )
            );
          
          if (existingConflicts.length === 0) {
            // Create a new conflict record
            const conflict: InsertConflict = {
              teacherId,
              dayOfWeek: day,
              timeSlot: time,
              conflictingScheduleIds: scheduleIds,
              resolved: false,
              suggestions: [] // Will generate these later
            };
            
            const newConflict = await this.createConflict(conflict);
            newConflicts.push(newConflict);
          }
        }
      }
    }
    
    // Generate suggestions for each new conflict
    for (const conflict of newConflicts) {
      const suggestions = await this.generateConflictSuggestions(conflict.id);
      await this.updateConflict(conflict.id, { suggestions });
    }
    
    return newConflicts;
  }

  async generateConflictSuggestions(conflictId: number): Promise<ConflictSuggestion[]> {
    const conflict = await this.getConflictById(conflictId);
    if (!conflict || !conflict.conflictingScheduleIds) return [];
    
    const suggestions: ConflictSuggestion[] = [];
    const validSchedules = await db.select()
      .from(schedules)
      .where(inArray(schedules.id, conflict.conflictingScheduleIds));
    
    if (validSchedules.length === 0) return [];
    
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
            description: `Move ${course?.name || 'Course'} to ${DAYS_OF_WEEK[day]} at ${TIME_SLOTS[slot].label} ${preferenceMatch ? '(matches teacher preference)' : ''}`,
            action: 'move',
            scheduleId: schedule.id,
            newDayOfWeek: day,
            newTimeSlot: slot
          });
        }
      }
      
      // 2. Try to swap with another teacher's class
      const otherTeachersSchedules = allSchedules.filter(s => 
        s.teacherId !== conflict.teacherId && 
        !conflict.conflictingScheduleIds!.includes(s.id)
      );
      
      for (const otherSchedule of otherTeachersSchedules) {
        const otherCourse = await this.getCourseById(otherSchedule.courseId);
        
        suggestions.push({
          id: uuidv4(),
          description: `Swap ${course?.name || 'Course'} with ${otherCourse?.name || 'another course'} on ${DAYS_OF_WEEK[otherSchedule.dayOfWeek]} at ${TIME_SLOTS[otherSchedule.timeSlot].label}`,
          action: 'swap',
          scheduleId: schedule.id,
          swapWithScheduleId: otherSchedule.id
        });
      }
      
      // 3. Try to reassign to another teacher
      const otherTeachers = (await this.getTeachers())
        .filter(t => t.id !== conflict.teacherId);
      
      for (const otherTeacher of otherTeachers) {
        suggestions.push({
          id: uuidv4(),
          description: `Reassign ${course?.name || 'Course'} to ${otherTeacher.name}`,
          action: 'reassign',
          scheduleId: schedule.id,
          newTeacherId: otherTeacher.id
        });
      }
    }
    
    return suggestions;
  }
}