/*
 * Copyright (c) 2025 Nebulit GmbH
 * Licensed under the MIT License.
 */

import { MarquerFactureRecupereeCommand } from './MarquerFactureRecupereeCommand';
import { FactureRecuperee, FactureRecupereeEventName } from '../../events/FactureRecuperee';

const ONE_STREAM_ONLY = "ONE_STREAM_ONLY";

export type MarquerFactureRecupereeEvents = FactureRecuperee;

export const decide = (command: MarquerFactureRecupereeCommand): MarquerFactureRecupereeEvents[] => {
    // Business logic to decide which events to emit based on the command
    return [
        {
        streamId: ONE_STREAM_ONLY,
        type: FactureRecupereeEventName,
        data: {
            factureId: command.data.factureId,
            projetId: command.data.projetId,
            entrepriseId: command.data.entrepriseId
        },
        metadata: {
            correlation_id: command.metadata?.correlation_id,
            causation_id: command.metadata?.causation_id
        }
    }
    ];
};
