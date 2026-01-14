/*
 * Copyright (c) 2025 Nebulit GmbH
 * Licensed under the MIT License.
 */

import { ClientAuthentifieCommand } from './ClientAuthentifieCommand';
import { ClientAuthentifie, ClientAuthentifieEventName } from '../../events/ClientAuthentifie';

const ONE_STREAM_ONLY = "ONE_STREAM_ONLY";

export type ClientAuthentifieEvents = ClientAuthentifie;

export const decide = (command: ClientAuthentifieCommand): ClientAuthentifieEvents[] => {
    // Business logic to decide which events to emit based on the command
    return [
        {
        streamId: ONE_STREAM_ONLY,
        type: ClientAuthentifieEventName,
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
