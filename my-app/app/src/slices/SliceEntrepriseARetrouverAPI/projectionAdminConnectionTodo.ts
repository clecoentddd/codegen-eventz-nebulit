/*
 * Copyright (c) 2025 Nebulit GmbH
 * Licensed under the MIT License.
 */
import { EventStore } from '../../common/domain/EventStore';
import { AdminConnecte, AdminConnecteEventName } from '../../events/AdminConnecte';
import { EntrepriseRetrouveeAttempted, EntrepriseRetrouveeAttemptedEventName } from '../../events/EntrepriseRetrouveeAttempted';

export type ProcessorTodoItem = {
    id: string;               // workflow or entity key
    correlationId: string;    // workflow correlation (placeholder)
    status: 'pending' | 'processing' | 'completed' | 'failed';
    createdAt: Date;
    updatedAt: Date;
    retryCount: number;
        connectionId: string;
        adminEmail: string;
};

export type AdminConnectionTodoReadModel = ProcessorTodoItem & {
        connectionId: string;
    adminEmail: string;
};

// Stateless query function - reads fresh from event store each time
export async function getAdminConnectionTodoProjection(eventStore: EventStore): Promise<AdminConnectionTodoReadModel[]> {
    const events = await eventStore.getEvents('ONE_STREAM_ONLY') ?? [];
    
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
            case AdminConnecteEventName: {
                const correlationId = event.metadata?.correlation_id || event.streamId;
                if (!stateMap.has(correlationId)) {
                    stateMap.set(correlationId, {
                        id: correlationId,
                        correlationId,
                        status: 'pending',
                        createdAt: new Date(Date.now()),
                        updatedAt: new Date(Date.now()),
                        retryCount: 0,
                        connectionId: (event.data as any).connectionId,
                        adminEmail: (event.data as any).adminEmail
                    });
                }
                break;
            }
            case EntrepriseRetrouveeAttemptedEventName: {
                const correlationId = event.metadata?.correlation_id || event.streamId;
                if (correlationId && stateMap.has(correlationId)) {
                    stateMap.set(correlationId, { ...stateMap.get(correlationId), completed: true });
                }
                break;
            }
        default:
            break;
    }
};

// Converts stateMap to pending todos
const buildTodos = (stateMap: Map<string, Record<string, any>>): AdminConnectionTodoReadModel[] => {
    const todos: AdminConnectionTodoReadModel[] = [];

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
                connectionId: state.connectionId || '',
                adminEmail: state.adminEmail || ''
            });
        }
    });

    return todos.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
};
