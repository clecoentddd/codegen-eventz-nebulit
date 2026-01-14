/*
 * Copyright (c) 2025 Nebulit GmbH
 * Licensed under the MIT License.
 */

import { Event } from '../common/domain/Event';

export const MarquerProjetRecupereAttemptedEventName = 'MarquerProjetRecupereAttempted';

export type MarquerProjetRecupereAttempted = Event<typeof MarquerProjetRecupereAttemptedEventName, {
    projetId: string;
    entrepriseId: string;
    projetNom: string
}>;
