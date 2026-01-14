/*
 * Copyright (c) 2025 Nebulit GmbH
 * Licensed under the MIT License.
 */

import { Event } from '../common/domain/Event';

export const ProjetRecupereEventName = 'ProjetRecupere';

export type ProjetRecupere = Event<typeof ProjetRecupereEventName, {
    projetId: string;
    entrepriseId: string;
    projetNom: string
}>;
