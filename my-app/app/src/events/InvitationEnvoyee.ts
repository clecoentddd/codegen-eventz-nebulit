/*
 * Copyright (c) 2025 Nebulit GmbH
 * Licensed under the MIT License.
 */

import { Event } from '../common/domain/Event';

export const InvitationEnvoyeeEventName = 'InvitationEnvoyee';

export type InvitationEnvoyee = Event<typeof InvitationEnvoyeeEventName, {
    clientId: string;
    clientEmail: string;
    entrepriseId: string
}>;
