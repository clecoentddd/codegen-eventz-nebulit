/*
 * Copyright (c) 2025 Nebulit GmbH
 * Licensed under the MIT License.
 */

import { Event } from '../common/domain/Event';

export const ClientAuthentifieEventName = 'ClientAuthentifie';

export type ClientAuthentifie = Event<typeof ClientAuthentifieEventName, {
    clientId: string;
    clientEmail: string;
    entrepriseId: string
}>;
