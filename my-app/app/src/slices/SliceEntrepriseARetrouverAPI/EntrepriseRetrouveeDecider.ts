/*
 * Copyright (c) 2025 Nebulit GmbH
 * Licensed under the MIT License.
 */

import { EntrepriseRetrouveeCommand } from './EntrepriseRetrouveeCommand';
import { EntrepriseRetrouvee, EntrepriseRetrouveeEventName } from '../../events/EntrepriseRetrouvee';

const ONE_STREAM_ONLY = "ONE_STREAM_ONLY";

export type EntrepriseRetrouveeEvents = EntrepriseRetrouvee;

export const decide = (command: EntrepriseRetrouveeCommand): EntrepriseRetrouveeEvents[] => {
    // Business logic to decide which events to emit based on the command
    return [
        {
        streamId: ONE_STREAM_ONLY,
        type: EntrepriseRetrouveeEventName,
        data: {
            entrepriseId: command.data.entrepriseId,
            entrepriseNom: command.data.entrepriseNom,
            connectionId: command.data.connectionId
        },
        metadata: {
            correlation_id: command.metadata?.correlation_id,
            causation_id: command.metadata?.causation_id
        }
    }
    ];
};
