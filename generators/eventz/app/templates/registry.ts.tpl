/*
 * Copyright (c) 2025 Nebulit GmbH
 * Licensed under the MIT License.
 */

import { EventStore } from './common/domain/EventStore';
import { messageBus } from './common/infrastructure/messageBus';
<% if (setupSupabase) { %>
import { SupabaseEventStore } from './infrastructure/persistence/SupabaseEventStore';
<% } %>
<%= commandHandlerImports %>

export function initialize() {
    let eventStore: EventStore;

    <% if (setupSupabase) { %>
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase URL or Key is not defined in environment variables.');
    }

    eventStore = new SupabaseEventStore(supabaseUrl, supabaseKey);
    <% } else { %>
    // In-memory event store for demonstration purposes
    const memoryStore: { [key: string]: any[] } = {};
    eventStore = {
        getEvents: async (streamId: string) => {
            return memoryStore[streamId] || [];
        },
        appendEvents: async (streamId: string, events: any[]) => {
            if (!memoryStore[streamId]) {
                memoryStore[streamId] = [];
            }
            memoryStore[streamId].push(...events);
        }
    };
    <% } %>

    // Register all command handlers
<%= commandHandlerRegistrations %>
}
