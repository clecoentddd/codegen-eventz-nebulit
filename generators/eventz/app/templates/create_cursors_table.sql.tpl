-- Migration: Create cursors table for event processing
-- This table stores the last processed event ID for each event processor
-- to enable resumable event processing across application restarts

CREATE TABLE IF NOT EXISTS cursors (
    processor_name VARCHAR(255) PRIMARY KEY,
    last_processed_id VARCHAR(255) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index for faster lookups
CREATE INDEX IF NOT EXISTS idx_cursors_processor_name ON cursors(processor_name);

-- Add a comment to the table
COMMENT ON TABLE cursors IS 'Stores cursor positions for event processors to enable resumable processing';
COMMENT ON COLUMN cursors.processor_name IS 'Unique name of the event processor (e.g., CustomercreateEventProcessor)';
COMMENT ON COLUMN cursors.last_processed_id IS 'ID of the last event processed by this processor';
COMMENT ON COLUMN cursors.updated_at IS 'Timestamp of the last cursor update';
