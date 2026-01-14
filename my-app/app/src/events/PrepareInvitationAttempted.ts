/*
 * Copyright (c) 2025 Nebulit GmbH
 * Licensed under the MIT License.
 */

import { Event } from '../common/domain/Event';

export const PrepareInvitationAttemptedEventName = 'PrepareInvitationAttempted';

export type PrepareInvitationAttempted = Event<typeof PrepareInvitationAttemptedEventName, {
    clientId: string;
    clientEmail: string;
    entrepriseId: string
}>;
