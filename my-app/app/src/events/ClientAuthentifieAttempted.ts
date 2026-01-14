/*
 * Copyright (c) 2025 Nebulit GmbH
 * Licensed under the MIT License.
 */

import { Event } from '../common/domain/Event';

export const ClientAuthentifieAttemptedEventName = 'ClientAuthentifieAttempted';

export type ClientAuthentifieAttempted = Event<typeof ClientAuthentifieAttemptedEventName, {
    clientId: string;
    clientEmail: string;
    entrepriseId: string
}>;
