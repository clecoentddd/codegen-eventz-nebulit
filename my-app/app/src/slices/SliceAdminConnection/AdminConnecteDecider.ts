/*
 * Copyright (c) 2025 Nebulit GmbH
 * Licensed under the MIT License.
 */

import { AdminConnecteCommand } from './AdminConnecteCommand';
import { AdminConnecte, AdminConnecteEventName } from '../../events/AdminConnecte';

const ONE_STREAM_ONLY = "ONE_STREAM_ONLY";

export type AdminConnecteEvents = AdminConnecte;

export const decide = (command: AdminConnecteCommand): AdminConnecteEvents[] => {
    // Business logic to decide which events to emit based on the command
    return [
        {
        streamId: ONE_STREAM_ONLY,
        type: AdminConnecteEventName,
        data: {
            connectionId: command.data.connectionId,
            adminEmail: command.data.adminEmail
        },
        metadata: {
            correlation_id: command.metadata?.correlation_id,
            causation_id: command.metadata?.causation_id
        }
    }
    ];
};
