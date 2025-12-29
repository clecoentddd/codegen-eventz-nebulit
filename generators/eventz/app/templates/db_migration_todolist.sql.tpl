no/*
 * Copyright (c) 2025 Nebulit GmbH
 * Licensed under the MIT License.
 */

-- Migration for Todo functionality: <%- readmodelName %> Todo Processing
-- This migration sets up the necessary database structures for todo projections

-- Create the <%- readmodelName %>-todo table for storing todo items
CREATE TABLE IF NOT EXISTS public."<%- readmodelName %>_todo" (
    id TEXT PRIMARY KEY,
    correlation_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    retry_count INTEGER NOT NULL DEFAULT 0,
    <%- additionalFields %>
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Create index on status for efficient querying of pending todos
CREATE INDEX IF NOT EXISTS idx_<%- readmodelName %>_todo_status ON public."<%- readmodelName %>_todo"(status);

-- Create index on correlation_id for efficient correlation lookups
CREATE INDEX IF NOT EXISTS idx_<%- readmodelName %>_todo_correlation_id ON public."<%- readmodelName %>_todo"(correlation_id);

-- Create index on created_at for efficient ordering
CREATE INDEX IF NOT EXISTS idx_<%- readmodelName %>_todo_created_at ON public."<%- readmodelName %>_todo"(created_at);

-- Enable Row Level Security
ALTER TABLE public."<%- readmodelName %>_todo" ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to read todo items
CREATE POLICY "Allow read to authenticated users only" ON public."<%- readmodelName %>_todo"
    FOR SELECT TO authenticated USING (true);

-- Create policy for service role to manage todo items
CREATE POLICY "Allow service role full access" ON public."<%- readmodelName %>_todo"
    FOR ALL TO service_role USING (true);

-- Create function to notify RabbitMQ when todos are inserted/updated
-- This function will be called by application code when todos change
CREATE OR REPLACE FUNCTION public.notify_<%- readmodelName %>_todo_change()
RETURNS TRIGGER AS $$
BEGIN
    -- This function can be extended to send messages to RabbitMQ
    -- For now, it just logs the change
    RAISE LOG 'Todo item changed: % % %', TG_OP, NEW.id, NEW.status;

    -- Return the appropriate row
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically notify on todo changes
DROP TRIGGER IF EXISTS <%- readmodelName %>_todo_change_trigger ON public."<%- readmodelName %>_todo";
CREATE TRIGGER <%- readmodelName %>_todo_change_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public."<%- readmodelName %>_todo"
    FOR EACH ROW EXECUTE FUNCTION public.notify_<%- readmodelName %>_todo_change();

-- Create function to clean up old completed/failed todos (optional maintenance)
CREATE OR REPLACE FUNCTION public.cleanup_old_<%- readmodelName %>_todos(days_old INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public."<%- readmodelName %>_todo"
    WHERE status IN ('completed', 'failed')
    AND updated_at < NOW() - INTERVAL '1 day' * days_old;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE LOG 'Cleaned up % old <%- readmodelName %> todos', deleted_count;

    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public."<%- readmodelName %>_todo" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public."<%- readmodelName %>_todo" TO service_role;

-- Add comments for documentation
COMMENT ON TABLE public."<%- readmodelName %>_todo" IS 'Stores todo items for <%- readmodelName %> processing';
COMMENT ON COLUMN public."<%- readmodelName %>_todo".id IS 'Unique identifier for the todo item';
COMMENT ON COLUMN public."<%- readmodelName %>_todo".correlation_id IS 'Correlation ID for tracking related events';
COMMENT ON COLUMN public."<%- readmodelName %>_todo".status IS 'Current status: pending, processing, completed, or failed';
COMMENT ON COLUMN public."<%- readmodelName %>_todo".retry_count IS 'Number of retry attempts made';
