-- Add object_id column to projects table
-- Links projects to objects (properties)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS object_id UUID REFERENCES objects(id) ON DELETE SET NULL;
