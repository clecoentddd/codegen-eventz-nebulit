/*
 * Copyright (c) 2025 Nebulit GmbH
 * Licensed under the MIT License.
 */
import { SupabaseEventStore } from '../../infrastructure/persistence/SupabaseEventStore';
import { signalMock } from '../../common/infrastructure/SignalMock';
<%- eventImports %>

export type ProcessorTodoItem = {
    id: string;
    correlationId: string;
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
    return todoProjection.filter(todo => todo.status === 'pending')
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
};

const initializeTodoProjection = async () => {
    if (isInitialized) return;

    // Rebuild projection from event store
    const eventStore = new SupabaseEventStore();
    const events = await eventStore.getAllEvents() ?? [];

    // Correlation-based todo projection: CustomerCreated without AccountCreated
    const todoMap = new Map<string, <%- readmodelName %>ReadModel>();

    for (const event of events) {
        switch (event.type) {
<%- evolveCases %>
            default:
                break;
        }
    }

    todoProjection = Array.from(todoMap.values());

    // Subscribe to relevant events for real-time updates
<% eventsList.split(', ').forEach(eventName => { %>
    signalMock.subscribe(<%= eventName %>, (event: any) => {
        // Update todo projection based on new event
        evolveTodo(event, todoMap);
        todoProjection = Array.from(todoMap.values());
        console.log(`[<%= readmodelName %>TodoProjection] Updated on event: ${event.type}`);
    });
<% }); %>

    isInitialized = true;
    console.log(`[<%= readmodelName %>TodoProjection] Initialized and subscribed to events`);
};

const evolveTodo = (event: any, todoMap: Map<string, <%- readmodelName %>ReadModel>) => {
    switch (event.type) {
<%- evolveCases %>
        default:
            break;
    }
};

// Database trigger function for RabbitMQ notifications
export async function notifyTodoProcessor(todoId: string, correlationId: string): Promise<void> {
    // This function will be called by database triggers
    // Implementation depends on RabbitMQ setup
    console.log(`Notifying processor for todo ${todoId} with correlation ${correlationId}`);
}
