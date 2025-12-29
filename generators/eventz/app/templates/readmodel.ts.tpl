/*
 * Copyright (c) 2025 Nebulit GmbH
 * Licensed under the MIT License.
 */
import { SupabaseEventStore } from '../../infrastructure/persistence/SupabaseEventStore';
import { signalMock } from '../../common/infrastructure/SignalMock';
<%- eventImports %>

export type <%- readmodelName %>ReadModel = {
<%- fieldStrings %>
};

let projection: <%- readmodelName %>ReadModel[] = [];
let isInitialized = false;

export async function get<%- readmodelName %>Projection(): Promise<<%- readmodelName %>ReadModel[]> {
    if (!isInitialized) {
        await initializeProjection();
    }
    return projection;
};

const initializeProjection = async () => {
    if (isInitialized) return;

    // Rebuild projection from event store
    const eventStore = new SupabaseEventStore();
    const events = await eventStore.getAllEvents() ?? [];

    // Map-style projection
    projection = events
        .map(event => {
<%- evolveCases %>
            return null; // default if no matching event
        })
        .filter((x): x is <%- readmodelName %>ReadModel => x !== null);

    // Subscribe to relevant events for real-time updates
<% eventsList.split(', ').forEach(eventName => { %>
    signalMock.subscribe('<%= eventName %>', (event: any) => {
        // Update projection based on new event
        const newItem = evolve(event);
        if (newItem) {
            projection.push(newItem);
        }
        console.log(`[<%= readmodelName %>Projection] Updated on event: ${event.type}`);
    });
<% }); %>

    isInitialized = true;
    console.log(`[<%= readmodelName %>Projection] Initialized and subscribed to events`);
};

const evolve = (event: any): <%- readmodelName %>ReadModel | null => {
<%- evolveCases %>
    return null; // default if no matching event
};
