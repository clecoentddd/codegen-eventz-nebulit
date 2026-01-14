/*
 * Copyright (c) 2025 Nebulit GmbH
 * Licensed under the MIT License.
 */

import { EventStore } from './common/domain/EventStore';
import { signalMock } from './common/infrastructure/SignalMock';

import { SupabaseEventStore } from './infrastructure/persistence/SupabaseEventStore';

import { createAdminConnecteCommandProcessor } from './slices/SliceAdminConnection/AdminConnecteCommandProcessor';
import { createEntrepriseRetrouveeCommandProcessor } from './slices/SliceEntrepriseARetrouverAPI/EntrepriseRetrouveeCommandProcessor';
import { createPrepareInvitationCommandProcessor } from './slices/SlicePrepareInvitation/PrepareInvitationCommandProcessor';
import { createMarquerEmailEnvoyeCommandProcessor } from './slices/SliceProcessorSMTP/MarquerEmailEnvoyeCommandProcessor';
import { createCreerCompteCommandProcessor } from './slices/SliceClientCreationCompte/CreerCompteCommandProcessor';
import { createClientAuthentifieCommandProcessor } from './slices/SliceClientAuthentificationAuth0/ClientAuthentifieCommandProcessor';
import { createMarquerProjetRecupereCommandProcessor } from './slices/SliceProjetRequeteAPIBoond/MarquerProjetRecupereCommandProcessor';
import { createMarquerFactureRecupereeCommandProcessor } from './slices/SliceRequeteFactureAPIBoond/MarquerFactureRecupereeCommandProcessor';
import { createAdminConnectionTodoProcessor } from './slices/SliceEntrepriseARetrouverAPI/AdminConnectionTodoProcessor';
import { createInvitationAEnvoyerTodoProcessor } from './slices/SliceProcessorSMTP/InvitationAEnvoyerTodoProcessor';
import { createClientAuthentifieTodoProcessor } from './slices/SliceClientAuthentificationAuth0/ClientAuthentifieTodoProcessor';
import { createProjetARecupererTodoProcessor } from './slices/SliceProjetRequeteAPIBoond/ProjetARecupererTodoProcessor';
import { createFactureARecupererTodoProcessor } from './slices/SliceRequeteFactureAPIBoond/FactureARecupererTodoProcessor';

let eventStoreInstance: EventStore;

export async function initialize() {
    let eventStore: EventStore;

    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase URL or Key is not defined in environment variables.');
    }

    eventStore = new SupabaseEventStore(supabaseUrl, supabaseKey);
    

    eventStoreInstance = eventStore;

    // Initialize RabbitMQ and Signal mocks
    console.log('[Registry] Initializing RabbitMQ command processors...');

    // Initialize all command processors with RabbitMQ subscriptions
    createAdminConnecteCommandProcessor(eventStore);
    createEntrepriseRetrouveeCommandProcessor(eventStore);
    createPrepareInvitationCommandProcessor(eventStore);
    createMarquerEmailEnvoyeCommandProcessor(eventStore);
    createCreerCompteCommandProcessor(eventStore);
    createClientAuthentifieCommandProcessor(eventStore);
    createMarquerProjetRecupereCommandProcessor(eventStore);
    createMarquerFactureRecupereeCommandProcessor(eventStore);

    // Initialize all event-driven processors (e.g., todo processors)
    await createAdminConnectionTodoProcessor().start();
    await createInvitationAEnvoyerTodoProcessor().start();
    await createClientAuthentifieTodoProcessor().start();
    await createProjetARecupererTodoProcessor().start();
    await createFactureARecupererTodoProcessor().start();
}

export function getEventStore(): EventStore {
    if (!eventStoreInstance) {
        throw new Error('Event store not initialized. Call initialize() first.');
    }
    return eventStoreInstance;
}
