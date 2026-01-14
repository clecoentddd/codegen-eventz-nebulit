/*
 * Copyright (c) 2025 Nebulit GmbH
 * Licensed under the MIT License.
 */
import { SupabaseEventStore } from '../../infrastructure/persistence/SupabaseEventStore';
import { signalMock } from '../../common/infrastructure/SignalMock';
import { ClientCree, ClientCreeEventName } from '../../events/ClientCree';

export type ClientAuthentifieReadModel = {
    clientId: string;
    clientEmail: string;
    entrepriseId: string;
};

let projection: ClientAuthentifieReadModel[] = [];
let isInitialized = false;

export async function getClientAuthentifieProjection(): Promise<ClientAuthentifieReadModel[]> {
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
if (event.type === ClientCreeEventName) {
    return {
                        clientId: (event.data as any).clientId,
                                                clientEmail: (event.data as any).clientEmail,
                                                entrepriseId: (event.data as any).entrepriseId,
    };
}
            return null; // default if no matching event
        })
        .filter((x): x is ClientAuthentifieReadModel => x !== null);

    // Subscribe to relevant events for real-time updates

    signalMock.subscribe('ClientCreeEventName', (event: any) => {
        // Update projection based on new event
        const newItem = evolve(event);
        if (newItem) {
            projection.push(newItem);
        }
        console.log(`[ClientAuthentifieProjection] Updated on event: ${event.type}`);
    });


    isInitialized = true;
    console.log(`[ClientAuthentifieProjection] Initialized and subscribed to events`);
};

const evolve = (event: any): ClientAuthentifieReadModel | null => {
if (event.type === ClientCreeEventName) {
    return {
                        clientId: (event.data as any).clientId,
                                                clientEmail: (event.data as any).clientEmail,
                                                entrepriseId: (event.data as any).entrepriseId,
    };
}
    return null; // default if no matching event
};
