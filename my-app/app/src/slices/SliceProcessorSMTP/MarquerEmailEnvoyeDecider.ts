/*
 * Copyright (c) 2025 Nebulit GmbH
 * Licensed under the MIT License.
 */

import { MarquerEmailEnvoyeCommand } from './MarquerEmailEnvoyeCommand';
import { InvitationEnvoyee, InvitationEnvoyeeEventName } from '../../events/InvitationEnvoyee';

const ONE_STREAM_ONLY = "ONE_STREAM_ONLY";

export type MarquerEmailEnvoyeEvents = InvitationEnvoyee;

export const decide = (command: MarquerEmailEnvoyeCommand): MarquerEmailEnvoyeEvents[] => {
    // Business logic to decide which events to emit based on the command
    return [
        {
        streamId: ONE_STREAM_ONLY,
        type: InvitationEnvoyeeEventName,
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
