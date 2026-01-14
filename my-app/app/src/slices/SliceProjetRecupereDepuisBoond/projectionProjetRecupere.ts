/*
 * Copyright (c) 2025 Nebulit GmbH
 * Licensed under the MIT License.
 */
import { SupabaseEventStore } from '../../infrastructure/persistence/SupabaseEventStore';
import { signalMock } from '../../common/infrastructure/SignalMock';
import { ProjetRecupere, ProjetRecupereEventName } from '../../events/ProjetRecupere';

export type ProjetRecupereReadModel = {
    projetId: string;
    entrepriseId: string;
    projetNom: string;
};

let projection: ProjetRecupereReadModel[] = [];
let isInitialized = false;

export async function getProjetRecupereProjection(): Promise<ProjetRecupereReadModel[]> {
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
if (event.type === ProjetRecupereEventName) {
    return {
                        projetId: (event.data as any).projetId,
                                                entrepriseId: (event.data as any).entrepriseId,
                                                projetNom: (event.data as any).projetNom,
    };
}
            return null; // default if no matching event
        })
        .filter((x): x is ProjetRecupereReadModel => x !== null);

    // Subscribe to relevant events for real-time updates

    signalMock.subscribe('ProjetRecupereEventName', (event: any) => {
        // Update projection based on new event
        const newItem = evolve(event);
        if (newItem) {
            projection.push(newItem);
        }
        console.log(`[ProjetRecupereProjection] Updated on event: ${event.type}`);
    });


    isInitialized = true;
    console.log(`[ProjetRecupereProjection] Initialized and subscribed to events`);
};

const evolve = (event: any): ProjetRecupereReadModel | null => {
if (event.type === ProjetRecupereEventName) {
    return {
                        projetId: (event.data as any).projetId,
                                                entrepriseId: (event.data as any).entrepriseId,
                                                projetNom: (event.data as any).projetNom,
    };
}
    return null; // default if no matching event
};
