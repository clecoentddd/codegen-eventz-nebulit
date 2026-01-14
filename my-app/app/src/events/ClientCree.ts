/*
 * Copyright (c) 2025 Nebulit GmbH
 * Licensed under the MIT License.
 */

import { Event } from '../common/domain/Event';

export const ClientCreeEventName = 'ClientCree';

export type ClientCree = Event<typeof ClientCreeEventName, {
    clientId: string;
    clientEmail: string;
    entrepriseId: string
}>;
