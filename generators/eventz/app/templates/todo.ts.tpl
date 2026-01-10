/*
 * Copyright (c) 2025 Nebulit GmbH
 * Licensed under the MIT License.
 */
import { EventStore } from '../../common/domain/EventStore';
<%- eventImports %>

export type ProcessorTodoItem = {
    id: string;               // workflow or entity key
    correlationId: string;    // workflow correlation (placeholder)
    status: 'pending' | 'processing' | 'completed' | 'failed';
    createdAt: Date;
    updatedAt: Date;
    retryCount: number;
    <%- additionalFields %>
};

export type <%- readmodelName %>ReadModel = ProcessorTodoItem & {
    <%- fieldStrings %>
};

// Stateless query function - reads fresh from event store each time
export async function <%- todoProjectionExportName %>(eventStore: EventStore): Promise<<%- readmodelName %>ReadModel[]> {
    const events = await eventStore.getAllEvents() ?? [];
    
    // Map keyed by correlationId, value is a generic object to track workflow state
    const stateMap = new Map<string, Record<string, any>>();

    // Build state from all events
    for (const event of events) {
        evolveState(event, stateMap);
    }

    // Build pending todos from state
    return buildTodos(stateMap);
}

// Updates the internal stateMap for each event
const evolveState = (event: any, stateMap: Map<string, Record<string, any>>) => {
    switch (event.type) {
<%- evolveCases %>
        default:
            break;
    }
};

// Converts stateMap to pending todos
const buildTodos = (stateMap: Map<string, Record<string, any>>): <%- readmodelName %>ReadModel[] => {
    const todos: <%- readmodelName %>ReadModel[] = [];

    stateMap.forEach((state, key) => {
        // Only add todo if workflow is incomplete (has INBOUND event but not OUTBOUND event)
        const hasPendingWork = !state.completed;

        if (hasPendingWork) {
            todos.push({
                id: key,
                correlationId: key,
                status: 'pending',
                createdAt: new Date(),
                updatedAt: new Date(),
                retryCount: 0,
<%- fieldAssignments %>
            });
        }
    });

    return todos.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
};
