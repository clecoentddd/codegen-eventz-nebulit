/*
 * Copyright (c) 2025 Nebulit GmbH
 * Licensed under the MIT License.
 */

import { MarquerProjetRecupereCommand } from './MarquerProjetRecupereCommand';
import { ProjetRecupere, ProjetRecupereEventName } from '../../events/ProjetRecupere';

const ONE_STREAM_ONLY = "ONE_STREAM_ONLY";

export type MarquerProjetRecupereEvents = ProjetRecupere;

export const decide = (command: MarquerProjetRecupereCommand): MarquerProjetRecupereEvents[] => {
    // Business logic to decide which events to emit based on the command
    return [
        {
        streamId: ONE_STREAM_ONLY,
        type: ProjetRecupereEventName,
        data: {
            projetId: command.data.projetId,
            entrepriseId: command.data.entrepriseId,
            projetNom: command.data.projetNom
        },
        metadata: {
            correlation_id: command.metadata?.correlation_id,
            causation_id: command.metadata?.causation_id
        }
    }
    ];
};
