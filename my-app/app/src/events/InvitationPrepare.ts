/*
 * Copyright (c) 2025 Nebulit GmbH
 * Licensed under the MIT License.
 */

import { Event } from '../common/domain/Event';

export const InvitationPrepareEventName = 'InvitationPrepare';

export type InvitationPrepare = Event<typeof InvitationPrepareEventName, {
    clientId: string;
    clientEmail: string;
    entrepriseId: string
}>;
