/*
 * Copyright (c) 2025 Nebulit GmbH
 * Licensed under the MIT License.
 */
import { SupabaseEventStore } from '../../infrastructure/persistence/SupabaseEventStore';
import { signalMock } from '../../common/infrastructure/SignalMock';
import { FactureRecuperee, FactureRecupereeEventName } from '../../events/FactureRecuperee';

export type FactureRecupereeReadModel = {
    factureId: string;
    projetId: string;
    entrepriseId: string;
};

let projection: FactureRecupereeReadModel[] = [];
let isInitialized = false;

export async function getFactureRecupereeProjection(): Promise<FactureRecupereeReadModel[]> {
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
if (event.type === FactureRecupereeEventName) {
    return {
                        factureId: (event.data as any).factureId,
                                                projetId: (event.data as any).projetId,
                                                entrepriseId: (event.data as any).entrepriseId,
    };
}
            return null; // default if no matching event
        })
        .filter((x): x is FactureRecupereeReadModel => x !== null);

    // Subscribe to relevant events for real-time updates

    signalMock.subscribe('FactureRecupereeEventName', (event: any) => {
        // Update projection based on new event
        const newItem = evolve(event);
        if (newItem) {
            projection.push(newItem);
        }
        console.log(`[FactureRecupereeProjection] Updated on event: ${event.type}`);
    });


    isInitialized = true;
    console.log(`[FactureRecupereeProjection] Initialized and subscribed to events`);
};

const evolve = (event: any): FactureRecupereeReadModel | null => {
if (event.type === FactureRecupereeEventName) {
    return {
                        factureId: (event.data as any).factureId,
                                                projetId: (event.data as any).projetId,
                                                entrepriseId: (event.data as any).entrepriseId,
    };
}
    return null; // default if no matching event
};
