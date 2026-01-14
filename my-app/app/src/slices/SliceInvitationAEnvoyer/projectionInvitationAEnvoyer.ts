/*
 * Copyright (c) 2025 Nebulit GmbH
 * Licensed under the MIT License.
 */
import { SupabaseEventStore } from '../../infrastructure/persistence/SupabaseEventStore';
import { signalMock } from '../../common/infrastructure/SignalMock';
import { InvitationPrepare, InvitationPrepareEventName } from '../../events/InvitationPrepare';

export type InvitationAEnvoyerReadModel = {
    clientId: string;
    clientEmail: string;
    entrepriseId: string;
};

let projection: InvitationAEnvoyerReadModel[] = [];
let isInitialized = false;

export async function getInvitationAEnvoyerProjection(): Promise<InvitationAEnvoyerReadModel[]> {
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
if (event.type === InvitationPrepareEventName) {
    return {
                        clientId: (event.data as any).clientId,
                                                clientEmail: (event.data as any).clientEmail,
                                                entrepriseId: (event.data as any).entrepriseId,
    };
}
            return null; // default if no matching event
        })
        .filter((x): x is InvitationAEnvoyerReadModel => x !== null);

    // Subscribe to relevant events for real-time updates

    signalMock.subscribe('InvitationPrepareEventName', (event: any) => {
        // Update projection based on new event
        const newItem = evolve(event);
        if (newItem) {
            projection.push(newItem);
        }
        console.log(`[InvitationAEnvoyerProjection] Updated on event: ${event.type}`);
    });


    isInitialized = true;
    console.log(`[InvitationAEnvoyerProjection] Initialized and subscribed to events`);
};

const evolve = (event: any): InvitationAEnvoyerReadModel | null => {
if (event.type === InvitationPrepareEventName) {
    return {
                        clientId: (event.data as any).clientId,
                                                clientEmail: (event.data as any).clientEmail,
                                                entrepriseId: (event.data as any).entrepriseId,
    };
}
    return null; // default if no matching event
};
