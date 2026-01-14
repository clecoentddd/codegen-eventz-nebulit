/*
 * Copyright (c) 2025 Nebulit GmbH
 * Licensed under the MIT License.
 */
import { SupabaseEventStore } from '../../infrastructure/persistence/SupabaseEventStore';
import { signalMock } from '../../common/infrastructure/SignalMock';
import { EntrepriseRetrouvee, EntrepriseRetrouveeEventName } from '../../events/EntrepriseRetrouvee';

export type ListeDesEntreprisesDepuisBoondReadModel = {
    entrepriseId: string;
    entrepriseNom: string;
    connectionId: string;
};

let projection: ListeDesEntreprisesDepuisBoondReadModel[] = [];
let isInitialized = false;

export async function getListeDesEntreprisesDepuisBoondProjection(): Promise<ListeDesEntreprisesDepuisBoondReadModel[]> {
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
if (event.type === EntrepriseRetrouveeEventName) {
    return {
                        entrepriseId: (event.data as any).entrepriseId,
                                                entrepriseNom: (event.data as any).entrepriseNom,
                                                connectionId: (event.data as any).connectionId,
    };
}
            return null; // default if no matching event
        })
        .filter((x): x is ListeDesEntreprisesDepuisBoondReadModel => x !== null);

    // Subscribe to relevant events for real-time updates

    signalMock.subscribe('EntrepriseRetrouveeEventName', (event: any) => {
        // Update projection based on new event
        const newItem = evolve(event);
        if (newItem) {
            projection.push(newItem);
        }
        console.log(`[ListeDesEntreprisesDepuisBoondProjection] Updated on event: ${event.type}`);
    });


    isInitialized = true;
    console.log(`[ListeDesEntreprisesDepuisBoondProjection] Initialized and subscribed to events`);
};

const evolve = (event: any): ListeDesEntreprisesDepuisBoondReadModel | null => {
if (event.type === EntrepriseRetrouveeEventName) {
    return {
                        entrepriseId: (event.data as any).entrepriseId,
                                                entrepriseNom: (event.data as any).entrepriseNom,
                                                connectionId: (event.data as any).connectionId,
    };
}
    return null; // default if no matching event
};
