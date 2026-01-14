/*
 * Copyright (c) 2025 Nebulit GmbH
 * Licensed under the MIT License.
 */
import { SupabaseEventStore } from '../../infrastructure/persistence/SupabaseEventStore';
import { signalMock } from '../../common/infrastructure/SignalMock';
import { ClientAuthentifie, ClientAuthentifieEventName } from '../../events/ClientAuthentifie';

export type ProjetARecupererReadModel = {
    entrepriseId: string;
    clientId: string;
};

let projection: ProjetARecupererReadModel[] = [];
let isInitialized = false;

export async function getProjetARecupererProjection(): Promise<ProjetARecupererReadModel[]> {
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
if (event.type === ClientAuthentifieEventName) {
    return {
                        clientId: (event.data as any).clientId,
                                                clientEmail: (event.data as any).clientEmail,
                                                entrepriseId: (event.data as any).entrepriseId,
    };
}
            return null; // default if no matching event
        })
        .filter((x): x is ProjetARecupererReadModel => x !== null);

    // Subscribe to relevant events for real-time updates

    signalMock.subscribe('ClientAuthentifieEventName', (event: any) => {
        // Update projection based on new event
        const newItem = evolve(event);
        if (newItem) {
            projection.push(newItem);
        }
        console.log(`[ProjetARecupererProjection] Updated on event: ${event.type}`);
    });


    isInitialized = true;
    console.log(`[ProjetARecupererProjection] Initialized and subscribed to events`);
};

const evolve = (event: any): ProjetARecupererReadModel | null => {
if (event.type === ClientAuthentifieEventName) {
    return {
                        clientId: (event.data as any).clientId,
                                                clientEmail: (event.data as any).clientEmail,
                                                entrepriseId: (event.data as any).entrepriseId,
    };
}
    return null; // default if no matching event
};
