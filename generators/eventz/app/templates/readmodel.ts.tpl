/*
 * Copyright (c) 2025 Nebulit GmbH
 * Licensed under the MIT License.
 */
import { SupabaseEventStore } from '../../infrastructure/persistence/SupabaseEventStore';
<%- eventImports %>

export type <%- readmodelName %>ReadModel = {
<%- fieldStrings %>
};

export async function get<%- readmodelName %>Projection(): Promise<<%- readmodelName %>ReadModel[]> {
    const eventStore = new SupabaseEventStore();
    const events = await eventStore.getAllEvents() ?? [];

    // Map-style projection
    const projection: <%- readmodelName %>ReadModel[] = events
        .map(event => {
<%- evolveCases %>
            return null; // default if no matching event
        })
        .filter((x): x is <%- readmodelName %>ReadModel => x !== null);

    return projection;
}
