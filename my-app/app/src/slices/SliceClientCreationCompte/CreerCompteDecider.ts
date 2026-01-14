/*
 * Copyright (c) 2025 Nebulit GmbH
 * Licensed under the MIT License.
 */

import { CreerCompteCommand } from './CreerCompteCommand';
import { ClientCree, ClientCreeEventName } from '../../events/ClientCree';

const ONE_STREAM_ONLY = "ONE_STREAM_ONLY";

export type CreerCompteEvents = ClientCree;

export const decide = (command: CreerCompteCommand): CreerCompteEvents[] => {
    // Business logic to decide which events to emit based on the command
    return [
        {
        streamId: ONE_STREAM_ONLY,
        type: ClientCreeEventName,
        data: {
            clientId: command.data.clientId,
            clientEmail: command.data.clientEmail,
            entrepriseId: command.data.entrepriseId
        },
        metadata: {
            correlation_id: command.metadata?.correlation_id,
            causation_id: command.metadata?.causation_id
        }
    }
    ];
};
