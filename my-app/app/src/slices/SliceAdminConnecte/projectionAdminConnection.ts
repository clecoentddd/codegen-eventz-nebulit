/*
 * Copyright (c) 2025 Nebulit GmbH
 * Licensed under the MIT License.
 */
import { SupabaseEventStore } from '../../infrastructure/persistence/SupabaseEventStore';
import { signalMock } from '../../common/infrastructure/SignalMock';
import { AdminConnecte, AdminConnecteEventName } from '../../events/AdminConnecte';

export type AdminConnectionReadModel = {
    connectionId: string;
    adminEmail: string;
};

let projection: AdminConnectionReadModel[] = [];
let isInitialized = false;

export async function getAdminConnectionProjection(): Promise<AdminConnectionReadModel[]> {
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
if (event.type === AdminConnecteEventName) {
    return {
                        connectionId: (event.data as any).connectionId,
                                                adminEmail: (event.data as any).adminEmail,
    };
}
            return null; // default if no matching event
        })
        .filter((x): x is AdminConnectionReadModel => x !== null);

    // Subscribe to relevant events for real-time updates

    signalMock.subscribe('AdminConnecteEventName', (event: any) => {
        // Update projection based on new event
        const newItem = evolve(event);
        if (newItem) {
            projection.push(newItem);
        }
        console.log(`[AdminConnectionProjection] Updated on event: ${event.type}`);
    });


    isInitialized = true;
    console.log(`[AdminConnectionProjection] Initialized and subscribed to events`);
};

const evolve = (event: any): AdminConnectionReadModel | null => {
if (event.type === AdminConnecteEventName) {
    return {
                        connectionId: (event.data as any).connectionId,
                                                adminEmail: (event.data as any).adminEmail,
    };
}
    return null; // default if no matching event
};
