/*
 * Copyright (c) 2025 Nebulit GmbH
 * Licensed under the MIT License.
 */

import { Event } from '../common/domain/Event';

export const AdminConnecteAttemptedEventName = 'AdminConnecteAttempted';

export type AdminConnecteAttempted = Event<typeof AdminConnecteAttemptedEventName, {
    connectionId: string;
    adminEmail: string
}>;
