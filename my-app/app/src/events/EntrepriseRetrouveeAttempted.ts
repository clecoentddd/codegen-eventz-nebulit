/*
 * Copyright (c) 2025 Nebulit GmbH
 * Licensed under the MIT License.
 */

import { Event } from '../common/domain/Event';

export const EntrepriseRetrouveeAttemptedEventName = 'EntrepriseRetrouveeAttempted';

export type EntrepriseRetrouveeAttempted = Event<typeof EntrepriseRetrouveeAttemptedEventName, {
    entrepriseId: string;
    entrepriseNom: string;
    connectionId: string
}>;
