/*
 * Copyright (c) 2025 Nebulit GmbH
 * Licensed under the MIT License.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Event } from '../../common/domain/Event';
import { EventStore } from '../../common/domain/EventStore';

export class SupabaseEventStore implements EventStore {
    private supabase: SupabaseClient;

    constructor(supabaseUrl: string, supabaseKey: string) {
        this.supabase = createClient(supabaseUrl, supabaseKey);
    }

    async getEvents(streamId: string): Promise<Event[]> {
        const { data, error } = await this.supabase
            .from('events')
            .select('*')
            .eq('stream_id', streamId)
            .order('version', { ascending: true });

        if (error) {
            console.error('Error fetching events from Supabase:', error);
            throw error;
        }

        return data.map(this.toEvent);
    }

    async appendEvents(streamId: string, events: Event[]): Promise<void> {
        const { data: existingEvents, error: fetchError } = await this.supabase
            .from('events')
            .select('version')
            .eq('stream_id', streamId)
            .order('version', { ascending: false })
            .limit(1);

        if (fetchError) {
            console.error('Error fetching last event version:', fetchError);
            throw fetchError;
        }

        let currentVersion = existingEvents && existingEvents.length > 0 ? existingEvents[0].version : 0;

        const records = events.map(event => {
            currentVersion++;
            return {
                stream_id: streamId,
                type: event.type,
                version: currentVersion,
                data: event.data,
                metadata: event.metadata,
            };
        });

        const { error: insertError } = await this.supabase.from('events').insert(records);

        if (insertError) {
            console.error('Error appending events to Supabase:', insertError);
            throw insertError;
        }
    }

    private toEvent(record: any): Event {
        return {
            streamId: record.stream_id,
            type: record.type,
            data: record.data,
            metadata: record.metadata
        };
    }
}
