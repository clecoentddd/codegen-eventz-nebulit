/*
 * Copyright (c) 2025 Nebulit GmbH
 * Licensed under the MIT License.
 */

import { PrepareInvitationCommand } from './PrepareInvitationCommand';
import { InvitationPrepare, InvitationPrepareEventName } from '../../events/InvitationPrepare';

const ONE_STREAM_ONLY = "ONE_STREAM_ONLY";

export type PrepareInvitationEvents = InvitationPrepare;

export const decide = (command: PrepareInvitationCommand): PrepareInvitationEvents[] => {
    // Business logic to decide which events to emit based on the command
    return [
        {
        streamId: ONE_STREAM_ONLY,
        type: InvitationPrepareEventName,
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
