/*
 * Copyright (c) 2025 Nebulit GmbH
 * Licensed under the MIT License.
 */

import { Event } from '../common/domain/Event';

export const FactureRecupereeEventName = 'FactureRecuperee';

export type FactureRecuperee = Event<typeof FactureRecupereeEventName, {
    factureId: string;
    projetId: string;
    entrepriseId: string
}>;
