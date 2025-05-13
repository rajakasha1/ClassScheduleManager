import { pgTable, text, serial, integer, boolean, time, date, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Program schema
export const programs = pgTable("programs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  description: text("description"),
  totalSemesters: integer("total_semesters").notNull().default(8),
});

export const insertProgramSchema = createInsertSchema(programs).omit({
  id: true,
});

// Course schema
export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  credits: integer("credits").notNull(),
  description: text("description"),
  color: text("color").notNull(),
  isCore: boolean("is_core").notNull().default(true),
  programId: integer("program_id").notNull(),
  semester: integer("semester").notNull(),
  teacherId: integer("teacher_id"),
});

export const insertCourseSchema = createInsertSchema(courses).omit({
  id: true,
});

// Teacher schema
export const teachers = pgTable("teachers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  specialization: text("specialization"),
  skills: text("skills").array(),
  timePreferences: jsonb("time_preferences").$type<TimePreference[]>(),
});

export const insertTeacherSchema = createInsertSchema(teachers).omit({
  id: true,
});

// Class schedule schema
export const schedules = pgTable("schedules", {
  id: serial("id").primaryKey(),
  programId: integer("program_id").notNull(),
  semester: integer("semester").notNull(),
  dayOfWeek: integer("day_of_week").notNull(), // 0 = Monday, 1 = Tuesday, etc.
  timeSlot: integer("time_slot").notNull(), // 0 = 6:30-7:20, 1 = 7:20-8:10, etc.
  courseId: integer("course_id").notNull(),
  teacherId: integer("teacher_id").notNull(),
  roomNumber: text("room_number"),
});

export const insertScheduleSchema = createInsertSchema(schedules).omit({
  id: true,
});

// Conflict schema
export const conflicts = pgTable("conflicts", {
  id: serial("id").primaryKey(),
  teacherId: integer("teacher_id").notNull(),
  dayOfWeek: integer("day_of_week").notNull(),
  timeSlot: integer("time_slot").notNull(),
  conflictingScheduleIds: integer("conflicting_schedule_ids").array(),
  resolved: boolean("resolved").notNull().default(false),
  suggestions: jsonb("suggestions").$type<ConflictSuggestion[]>(),
});

export const insertConflictSchema = createInsertSchema(conflicts).omit({
  id: true,
});

// Define custom types for our application
export type TimePreference = {
  dayOfWeek: number; // 0 = Monday, 1 = Tuesday, etc.
  startTimeSlot: number; // 0 = 6:30-7:20, 1 = 7:20-8:10, etc.
  endTimeSlot: number;
};

export type ConflictSuggestion = {
  id: string;
  description: string;
  action: 'move' | 'swap' | 'reassign';
  scheduleId: number;
  newDayOfWeek?: number;
  newTimeSlot?: number;
  newTeacherId?: number;
  swapWithScheduleId?: number;
};

// Time slots constants
export const TIME_SLOTS = [
  { id: 0, label: '6:30 AM - 7:20 AM', period: 1 },
  { id: 1, label: '7:20 AM - 8:10 AM', period: 2 },
  { id: 2, label: '8:10 AM - 9:00 AM', period: 3 },
  { id: 3, label: '9:20 AM - 10:10 AM', period: 4 },
  { id: 4, label: '10:10 AM - 11:00 AM', period: 5 },
];

export const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

// Infer types
export type Program = typeof programs.$inferSelect;
export type InsertProgram = z.infer<typeof insertProgramSchema>;

export type Course = typeof courses.$inferSelect;
export type InsertCourse = z.infer<typeof insertCourseSchema>;

export type Teacher = typeof teachers.$inferSelect;
export type InsertTeacher = z.infer<typeof insertTeacherSchema>;

export type Schedule = typeof schedules.$inferSelect;
export type InsertSchedule = z.infer<typeof insertScheduleSchema>;

export type Conflict = typeof conflicts.$inferSelect;
export type InsertConflict = z.infer<typeof insertConflictSchema>;

// Default programs
export const DEFAULT_PROGRAMS = [
  { name: 'Bachelor of Computer Applications', code: 'BCA', description: 'A comprehensive program focused on computer applications and software development', totalSemesters: 8 },
  { name: 'Bachelor of Information Technology', code: 'BIT', description: 'A program focused on information technology and systems', totalSemesters: 8 },
  { name: 'Bachelor of Technology in Artificial Intelligence', code: 'BTAI', description: 'A specialized program in artificial intelligence and machine learning', totalSemesters: 8 },
];
