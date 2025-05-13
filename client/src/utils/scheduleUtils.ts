import { Schedule, DAYS_OF_WEEK, TIME_SLOTS } from "@shared/schema";

/**
 * Formats a schedule time slot to a readable string
 */
export const formatTimeSlot = (dayOfWeek: number, timeSlot: number): string => {
  const day = DAYS_OF_WEEK[dayOfWeek] || 'Unknown';
  const time = TIME_SLOTS.find(slot => slot.id === timeSlot)?.label || 'Unknown time';
  
  return `${day} at ${time}`;
};

/**
 * Checks if a schedule overlaps with the specified day and time slot
 */
export const isScheduleOverlapping = (
  schedule: Schedule,
  dayOfWeek: number,
  timeSlot: number
): boolean => {
  return schedule.dayOfWeek === dayOfWeek && schedule.timeSlot === timeSlot;
};

/**
 * Gets schedules for a specific day and time slot
 */
export const getSchedulesForSlot = (
  schedules: Schedule[],
  dayOfWeek: number,
  timeSlot: number
): Schedule[] => {
  return schedules.filter(schedule => 
    schedule.dayOfWeek === dayOfWeek && schedule.timeSlot === timeSlot
  );
};

/**
 * Gets schedules for a specific teacher
 */
export const getSchedulesForTeacher = (
  schedules: Schedule[],
  teacherId: number
): Schedule[] => {
  return schedules.filter(schedule => schedule.teacherId === teacherId);
};

/**
 * Formats a period label (e.g., "Period 1")
 */
export const formatPeriodLabel = (timeSlotId: number): string => {
  const slot = TIME_SLOTS.find(slot => slot.id === timeSlotId);
  if (!slot) return 'Unknown Period';
  
  return `Period ${slot.period}`;
};

/**
 * Checks if a time slot is the break time slot (9:00 AM - 9:20 AM)
 */
export const isBreakTimeSlot = (timeSlotId: number): boolean => {
  // In our design, the break is between time slots 2 and 3
  // This function can be adjusted based on how break is defined in your schema
  return false;
};
