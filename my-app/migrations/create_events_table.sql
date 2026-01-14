/*
 * Copyright (c) 2025 Nebulit GmbH
 * Licensed under the MIT License.
 */

CREATE TABLE IF NOT EXISTS events (
    id BIGSERIAL PRIMARY KEY,
    stream_id VARCHAR(255) NOT NULL,
    type VARCHAR(255) NOT NULL,
    version INT,
    data JSONB NOT NULL,
    metadata JSONB,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_stream_id ON events (stream_id);
