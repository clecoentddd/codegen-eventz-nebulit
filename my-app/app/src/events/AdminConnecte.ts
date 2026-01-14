/*
 * Copyright (c) 2025 Nebulit GmbH
 * Licensed under the MIT License.
 */

import { Event } from '../common/domain/Event';

export const AdminConnecteEventName = 'AdminConnecte';

export type AdminConnecte = Event<typeof AdminConnecteEventName, {
    connectionId: string;
    adminEmail: string
}>;
