import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db, pool } from '../server/db';

// This script pushes the schema to the database
async function main() {
  console.log('Pushing schema to database...');
  
  try {
    // Create the schema
    const result = await db.execute(`
      -- Programs
      CREATE TABLE IF NOT EXISTS programs (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        code TEXT NOT NULL UNIQUE,
        description TEXT,
        total_semesters INTEGER NOT NULL DEFAULT 8
      );

      -- Teachers
      CREATE TABLE IF NOT EXISTS teachers (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        specialization TEXT,
        skills TEXT[],
        time_preferences JSONB
      );

      -- Courses
      CREATE TABLE IF NOT EXISTS courses (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        code TEXT NOT NULL,
        description TEXT,
        credits INTEGER NOT NULL,
        color TEXT NOT NULL,
        is_core BOOLEAN NOT NULL DEFAULT false,
        program_id INTEGER NOT NULL REFERENCES programs(id),
        semester INTEGER NOT NULL,
        teacher_id INTEGER REFERENCES teachers(id)
      );

      -- Schedules
      CREATE TABLE IF NOT EXISTS schedules (
        id SERIAL PRIMARY KEY,
        program_id INTEGER NOT NULL REFERENCES programs(id),
        semester INTEGER NOT NULL,
        teacher_id INTEGER NOT NULL REFERENCES teachers(id),
        day_of_week INTEGER NOT NULL,
        time_slot INTEGER NOT NULL,
        course_id INTEGER NOT NULL REFERENCES courses(id),
        room_number TEXT
      );

      -- Conflicts
      CREATE TABLE IF NOT EXISTS conflicts (
        id SERIAL PRIMARY KEY,
        teacher_id INTEGER NOT NULL REFERENCES teachers(id),
        day_of_week INTEGER NOT NULL,
        time_slot INTEGER NOT NULL,
        conflicting_schedule_ids INTEGER[],
        resolved BOOLEAN NOT NULL DEFAULT false,
        suggestions JSONB
      );
    `);

    // Insert default programs
    await db.execute(`
      INSERT INTO programs (name, code, description)
      VALUES 
        ('Bachelor of Computer Applications', 'BCA', 'A comprehensive program focusing on computer applications and software development.'),
        ('Bachelor of Information Technology', 'BIT', 'A program focusing on information technology and systems.'),
        ('Bachelor of Technology in Artificial Intelligence', 'BTech-AI', 'An advanced program focusing on artificial intelligence and machine learning.')
      ON CONFLICT (code) DO NOTHING;
    `);

    console.log('Schema pushed successfully!');
  } catch (error) {
    console.error('Error pushing schema:', error);
  } finally {
    await pool.end();
  }
}

main();