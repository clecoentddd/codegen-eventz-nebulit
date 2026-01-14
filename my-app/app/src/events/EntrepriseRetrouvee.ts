/*
 * Copyright (c) 2025 Nebulit GmbH
 * Licensed under the MIT License.
 */

import { Event } from '../common/domain/Event';

export const EntrepriseRetrouveeEventName = 'EntrepriseRetrouvee';

export type EntrepriseRetrouvee = Event<typeof EntrepriseRetrouveeEventName, {
    entrepriseId: string;
    entrepriseNom: string;
    connectionId: string
}>;
