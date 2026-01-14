/*
 * Copyright (c) 2025 Nebulit GmbH
 * Licensed under the MIT License.
 */

import { Event } from '../common/domain/Event';

export const MarquerEmailEnvoyeAttemptedEventName = 'MarquerEmailEnvoyeAttempted';

export type MarquerEmailEnvoyeAttempted = Event<typeof MarquerEmailEnvoyeAttemptedEventName, {
    clientId: string;
    clientEmail: string;
    entrepriseId: string
}>;
