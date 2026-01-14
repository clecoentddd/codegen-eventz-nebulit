/*
 * Copyright (c) 2025 Nebulit GmbH
 * Licensed under the MIT License.
 */
import { EventStore } from '../../common/domain/EventStore';
import { ClientCree, ClientCreeEventName } from '../../events/ClientCree';
import { ClientAuthentifieAttempted, ClientAuthentifieAttemptedEventName } from '../../events/ClientAuthentifieAttempted';

export type ProcessorTodoItem = {
    id: string;               // workflow or entity key
    correlationId: string;    // workflow correlation (placeholder)
    status: 'pending' | 'processing' | 'completed' | 'failed';
    createdAt: Date;
    updatedAt: Date;
    retryCount: number;
        clientId: string;
        clientEmail: string;
        entrepriseId: string;
};

export type ClientAuthentifieTodoReadModel = ProcessorTodoItem & {
        clientId: string;
    clientEmail: string;
    entrepriseId: string;
};

// Stateless query function - reads fresh from event store each time
export async function getClientAuthentifieTodoProjection(eventStore: EventStore): Promise<ClientAuthentifieTodoReadModel[]> {
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
            case ClientCreeEventName: {
                const correlationId = event.metadata?.correlation_id || event.streamId;
                if (!stateMap.has(correlationId)) {
                    stateMap.set(correlationId, {
                        id: correlationId,
                        correlationId,
                        status: 'pending',
                        createdAt: new Date(Date.now()),
                        updatedAt: new Date(Date.now()),
                        retryCount: 0,
                        clientId: (event.data as any).clientId,
                        clientEmail: (event.data as any).clientEmail,
                        entrepriseId: (event.data as any).entrepriseId
                    });
                }
                break;
            }
            case ClientAuthentifieAttemptedEventName: {
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
const buildTodos = (stateMap: Map<string, Record<string, any>>): ClientAuthentifieTodoReadModel[] => {
    const todos: ClientAuthentifieTodoReadModel[] = [];

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
                clientId: state.clientId || '',
                clientEmail: state.clientEmail || '',
                entrepriseId: state.entrepriseId || ''
            });
        }
    });

    return todos.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
};
