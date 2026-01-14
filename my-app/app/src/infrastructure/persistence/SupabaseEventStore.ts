/*
 * Copyright (c) 2026 Nebulit GmbH
 * Licensed under the MIT License.
 */

import * as path from "path";
import * as url from "url";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Event } from "../../common/domain/Event";
import { EventStore } from "../../common/domain/EventStore";

// Get __dirname equivalent in ES modules
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local manually
dotenv.config({ path: path.resolve(__dirname, ".env.local") });

export class SupabaseEventStore implements EventStore {
  private supabase: SupabaseClient;
  private defaultStreamId: string;

  constructor(supabaseUrl?: string, supabaseServiceRoleKey?: string) {
    // Use constructor parameters if provided, otherwise fallback to environment variables
    const url = supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = supabaseServiceRoleKey || process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      throw new Error(
        "Supabase URL and Service Role Key are required. " +
          "Ensure you use a server-side environment variable for the service key.",
      );
    }

    // Initialize Supabase client
    this.supabase = createClient(url, key, { auth: { persistSession: false } });

    // Hardcoded UUID stream ID
    this.defaultStreamId = uuidv4();
  }

  async getEvents(streamId?: string): Promise<Event[]> {
    const id = streamId || this.defaultStreamId;

    const { data, error } = await this.supabase
      .from("events")
      .select("*")
      .eq("stream_id", id)
      .order("id", { ascending: true });

    if (error) {
      console.error("Error fetching events from Supabase:", error);
      throw new Error(`Supabase getEvents failed: ${error.message}`);
    }

    return (data || []).map(this.toEvent);
  }

  async appendEvents(
    streamId: string | undefined,
    events: Event[],
  ): Promise<void> {
    const id = streamId || this.defaultStreamId;

    const { data: latest, error: latestError } = await this.supabase
      .from("events")
      .select("version")
      .eq("stream_id", id)
      .order("version", { ascending: false })
      .limit(1);

    if (latestError) {
      console.error(
        "Error fetching latest version from Supabase:",
        latestError,
      );
      throw new Error(`Supabase appendEvents failed: ${latestError.message}`);
    }

    const startVersion = (latest?.[0]?.version ?? 0) + 1;

    const records = events.map((event, index) => ({
      stream_id: id,
      type: event.type,
      data: event.data,
      metadata: event.metadata,
      version: startVersion + index,
    }));

    const { error } = await this.supabase.from("events").insert(records);

    if (error) {
      console.error("Error appending events to Supabase:", error);
      throw new Error(`Supabase appendEvents failed: ${error.message}`);
    }
  }

  async getAllEvents(): Promise<Event[]> {
    const { data, error } = await this.supabase
      .from("events")
      .select("*")
      .order("id", { ascending: true });

    if (error) {
      console.error("Error fetching all events from Supabase:", error);
      throw new Error(`Supabase getAllEvents failed: ${error.message}`);
    }

    return (data || []).map(this.toEvent);
  }

  private toEvent(record: any): Event {
    return {
      streamId: record.stream_id,
      type: record.type,
      data: record.data,
      metadata: record.metadata,
    };
  }
}
