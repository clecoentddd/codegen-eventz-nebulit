/*
 * Copyright (c) 2025 Nebulit GmbH
 * Licensed under the MIT License.
 */

import { Event } from '../common/domain/Event';

export const MarquerFactureRecupereeAttemptedEventName = 'MarquerFactureRecupereeAttempted';

export type MarquerFactureRecupereeAttempted = Event<typeof MarquerFactureRecupereeAttemptedEventName, {
    factureId: string;
    projetId: string;
    entrepriseId: string
}>;
