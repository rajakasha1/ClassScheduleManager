import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { 
  insertCourseSchema, 
  insertTeacherSchema, 
  insertScheduleSchema,
  DAYS_OF_WEEK,
  TIME_SLOTS
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // API prefix for all routes
  const apiRouter = "/api";

  // Program routes
  app.get(`${apiRouter}/programs`, async (req, res) => {
    const programs = await storage.getPrograms();
    res.json(programs);
  });

  app.get(`${apiRouter}/programs/:code`, async (req, res) => {
    const code = req.params.code;
    const program = await storage.getProgramByCode(code);
    
    if (!program) {
      return res.status(404).json({ message: `Program with code ${code} not found` });
    }
    
    res.json(program);
  });

  // Course routes
  app.get(`${apiRouter}/courses`, async (req, res) => {
    const programId = req.query.programId ? Number(req.query.programId) : undefined;
    const semester = req.query.semester ? Number(req.query.semester) : undefined;
    
    if (programId) {
      const courses = await storage.getCoursesByProgram(programId, semester);
      return res.json(courses);
    }
    
    const courses = await storage.getCourses();
    res.json(courses);
  });

  app.get(`${apiRouter}/courses/:id`, async (req, res) => {
    const id = Number(req.params.id);
    const course = await storage.getCourseById(id);
    
    if (!course) {
      return res.status(404).json({ message: `Course with ID ${id} not found` });
    }
    
    res.json(course);
  });

  app.post(`${apiRouter}/courses`, async (req, res) => {
    try {
      const validatedData = insertCourseSchema.parse(req.body);
      const course = await storage.createCourse(validatedData);
      res.status(201).json(course);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors });
      }
      res.status(500).json({ message: "Failed to create course" });
    }
  });

  app.put(`${apiRouter}/courses/:id`, async (req, res) => {
    const id = Number(req.params.id);
    
    try {
      const validatedData = insertCourseSchema.partial().parse(req.body);
      const updatedCourse = await storage.updateCourse(id, validatedData);
      
      if (!updatedCourse) {
        return res.status(404).json({ message: `Course with ID ${id} not found` });
      }
      
      res.json(updatedCourse);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors });
      }
      res.status(500).json({ message: "Failed to update course" });
    }
  });

  app.delete(`${apiRouter}/courses/:id`, async (req, res) => {
    const id = Number(req.params.id);
    const success = await storage.deleteCourse(id);
    
    if (!success) {
      return res.status(404).json({ message: `Course with ID ${id} not found` });
    }
    
    res.status(204).send();
  });

  // Teacher routes
  app.get(`${apiRouter}/teachers`, async (req, res) => {
    const teachers = await storage.getTeachers();
    res.json(teachers);
  });

  app.get(`${apiRouter}/teachers/:id`, async (req, res) => {
    const id = Number(req.params.id);
    const teacher = await storage.getTeacherById(id);
    
    if (!teacher) {
      return res.status(404).json({ message: `Teacher with ID ${id} not found` });
    }
    
    res.json(teacher);
  });

  app.post(`${apiRouter}/teachers`, async (req, res) => {
    try {
      const validatedData = insertTeacherSchema.parse(req.body);
      const teacher = await storage.createTeacher(validatedData);
      res.status(201).json(teacher);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors });
      }
      res.status(500).json({ message: "Failed to create teacher" });
    }
  });

  app.put(`${apiRouter}/teachers/:id`, async (req, res) => {
    const id = Number(req.params.id);
    
    try {
      const validatedData = insertTeacherSchema.partial().parse(req.body);
      const updatedTeacher = await storage.updateTeacher(id, validatedData);
      
      if (!updatedTeacher) {
        return res.status(404).json({ message: `Teacher with ID ${id} not found` });
      }
      
      res.json(updatedTeacher);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors });
      }
      res.status(500).json({ message: "Failed to update teacher" });
    }
  });

  app.delete(`${apiRouter}/teachers/:id`, async (req, res) => {
    const id = Number(req.params.id);
    const success = await storage.deleteTeacher(id);
    
    if (!success) {
      return res.status(404).json({ message: `Teacher with ID ${id} not found` });
    }
    
    res.status(204).send();
  });

  // Schedule routes
  app.get(`${apiRouter}/schedules`, async (req, res) => {
    const programId = req.query.programId ? Number(req.query.programId) : undefined;
    const semester = req.query.semester ? Number(req.query.semester) : undefined;
    
    if (programId && semester) {
      const schedules = await storage.getSchedulesByProgram(programId, semester);
      return res.json(schedules);
    }
    
    const schedules = await storage.getSchedules();
    res.json(schedules);
  });

  app.post(`${apiRouter}/schedules`, async (req, res) => {
    try {
      const validatedData = insertScheduleSchema.parse(req.body);
      const schedule = await storage.createSchedule(validatedData);
      res.status(201).json(schedule);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors });
      }
      res.status(500).json({ message: "Failed to create schedule" });
    }
  });

  app.put(`${apiRouter}/schedules/:id`, async (req, res) => {
    const id = Number(req.params.id);
    
    try {
      const validatedData = insertScheduleSchema.partial().parse(req.body);
      const updatedSchedule = await storage.updateSchedule(id, validatedData);
      
      if (!updatedSchedule) {
        return res.status(404).json({ message: `Schedule with ID ${id} not found` });
      }
      
      res.json(updatedSchedule);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors });
      }
      res.status(500).json({ message: "Failed to update schedule" });
    }
  });

  app.delete(`${apiRouter}/schedules/:id`, async (req, res) => {
    const id = Number(req.params.id);
    const success = await storage.deleteSchedule(id);
    
    if (!success) {
      return res.status(404).json({ message: `Schedule with ID ${id} not found` });
    }
    
    res.status(204).send();
  });

  // Conflict routes
  app.get(`${apiRouter}/conflicts`, async (req, res) => {
    const conflicts = await storage.getConflicts();
    res.json(conflicts);
  });

  app.get(`${apiRouter}/conflicts/detect`, async (req, res) => {
    const conflicts = await storage.detectConflicts();
    res.json(conflicts);
  });

  app.get(`${apiRouter}/conflicts/:id/suggestions`, async (req, res) => {
    const id = Number(req.params.id);
    const conflict = await storage.getConflictById(id);
    
    if (!conflict) {
      return res.status(404).json({ message: `Conflict with ID ${id} not found` });
    }
    
    const suggestions = await storage.generateConflictSuggestions(id);
    res.json(suggestions);
  });

  app.post(`${apiRouter}/conflicts/:id/resolve`, async (req, res) => {
    const id = Number(req.params.id);
    const { suggestionId } = req.body;
    
    if (!suggestionId) {
      return res.status(400).json({ message: "suggestionId is required" });
    }
    
    const conflict = await storage.getConflictById(id);
    if (!conflict) {
      return res.status(404).json({ message: `Conflict with ID ${id} not found` });
    }
    
    const suggestion = conflict.suggestions?.find(s => s.id === suggestionId);
    if (!suggestion) {
      return res.status(404).json({ message: `Suggestion with ID ${suggestionId} not found` });
    }
    
    // Apply the suggestion
    if (suggestion.action === 'move') {
      await storage.updateSchedule(suggestion.scheduleId, {
        dayOfWeek: suggestion.newDayOfWeek,
        timeSlot: suggestion.newTimeSlot
      });
    } else if (suggestion.action === 'swap') {
      if (!suggestion.swapWithScheduleId) {
        return res.status(400).json({ message: "Invalid swap suggestion" });
      }
      
      const schedule1 = await storage.getSchedules().then(
        schedules => schedules.find(s => s.id === suggestion.scheduleId)
      );
      
      const schedule2 = await storage.getSchedules().then(
        schedules => schedules.find(s => s.id === suggestion.swapWithScheduleId)
      );
      
      if (!schedule1 || !schedule2) {
        return res.status(404).json({ message: "One or both schedules not found" });
      }
      
      // Swap day/timeslot between the two schedules
      await storage.updateSchedule(schedule1.id, {
        dayOfWeek: schedule2.dayOfWeek,
        timeSlot: schedule2.timeSlot
      });
      
      await storage.updateSchedule(schedule2.id, {
        dayOfWeek: schedule1.dayOfWeek,
        timeSlot: schedule1.timeSlot
      });
    } else if (suggestion.action === 'reassign') {
      await storage.updateSchedule(suggestion.scheduleId, {
        teacherId: suggestion.newTeacherId
      });
    }
    
    // Mark the conflict as resolved
    await storage.updateConflict(id, { resolved: true });
    
    // Detect conflicts again to update the list
    await storage.detectConflicts();
    
    res.json({ message: "Conflict resolved successfully" });
  });

  // Utility routes
  app.get(`${apiRouter}/utils/days`, (req, res) => {
    res.json(DAYS_OF_WEEK);
  });

  app.get(`${apiRouter}/utils/timeslots`, (req, res) => {
    res.json(TIME_SLOTS);
  });

  const httpServer = createServer(app);
  return httpServer;
}
