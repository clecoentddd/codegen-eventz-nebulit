/*
 * Copyright (c) 2025 Nebulit GmbH
 * Licensed under the MIT License.
 */
import { SupabaseEventStore } from '../../infrastructure/persistence/SupabaseEventStore';
import { signalMock } from '../../common/infrastructure/SignalMock';
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

let todoProjection: <%- readmodelName %>ReadModel[] = [];
let isInitialized = false;

export async function <%- todoProjectionExportName %>(): Promise<<%- readmodelName %>ReadModel[]> {
    if (!isInitialized) {
        await initializeTodoProjection();
    }

    return todoProjection
        .filter(todo => todo.status === 'pending')
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
};

const initializeTodoProjection = async () => {
    if (isInitialized) return;

    console.log(`[<%- readmodelName %>TodoProjection] Initializing projection...`);

    const eventStore = new SupabaseEventStore();
    const events = await eventStore.getAllEvents() ?? [];
    console.log(`[<%- readmodelName %>TodoProjection] Loaded ${events.length} events`);

    // Map keyed by correlationId, value is a generic object to track workflow state
    const stateMap = new Map<string, Record<string, any>>();

    // Build initial state from events
    for (const event of events) {
        evolveState(event, stateMap);
    }

    rebuildTodos(stateMap);

    // Subscribe to events for live updates
<% eventsList.split(', ').forEach(eventName => { %>
    signalMock.subscribe(<%= eventName %>, (event: any) => {
        console.log(`[<%- readmodelName %>TodoProjection] Received event: ${event.type}`);
        evolveState(event, stateMap);
        rebuildTodos(stateMap);
    });
<% }); %>

    isInitialized = true;
    console.log(`[<%- readmodelName %>TodoProjection] Initialized and subscribed to events`);
};

// Updates the internal stateMap for each event
const evolveState = (event: any, stateMap: Map<string, Record<string, any>>) => {
    switch (event.type) {
<%- evolveCases %>
        default:
            break;
    }
};

// Converts stateMap to pending todos
const rebuildTodos = (stateMap: Map<string, Record<string, any>>) => {
    const next: <%- readmodelName %>ReadModel[] = [];

    stateMap.forEach((state, key) => {
        // Only add todo if OUTBOUND event hasn't occurred yet
        // A todo is pending if we have the INBOUND event but not the OUTBOUND event
        // Check if the state indicates the workflow is incomplete (customize this condition based on your events)
        const hasPendingWork = !state.completed; // Adjust this based on your actual state tracking

        if (hasPendingWork) {
            next.push({
                id: key,
                correlationId: key,
                status: 'pending',
                createdAt: new Date(),
                updatedAt: new Date(),
                retryCount: 0,
                ...state // Spread all fields from the state
            });
        }
    });

    todoProjection = next;
    console.log(`[<%- readmodelName %>TodoProjection] Rebuilt todos (${todoProjection.length} pending)`);
};

// Optional hook for DB triggers / RabbitMQ
export async function notifyTodoProcessor(todoId: string, correlationId: string): Promise<void> {
    console.log(`[<%- readmodelName %>TodoProjection] Notifying processor for todo ${todoId} with correlation ${correlationId}`);
}
