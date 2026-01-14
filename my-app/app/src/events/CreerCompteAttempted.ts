/*
 * Copyright (c) 2025 Nebulit GmbH
 * Licensed under the MIT License.
 */

import { Event } from '../common/domain/Event';

export const CreerCompteAttemptedEventName = 'CreerCompteAttempted';

export type CreerCompteAttempted = Event<typeof CreerCompteAttemptedEventName, {
    clientId: string;
    clientEmail: string;
    entrepriseId: string
}>;
