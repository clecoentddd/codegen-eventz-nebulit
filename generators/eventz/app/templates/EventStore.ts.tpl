/*
 * Copyright (c) 2025 Nebulit GmbH
 * Licensed under the MIT License.
 */

import { Event } from './Event';

export interface EventStore {
    getEvents(streamId: string): Promise<Event[]>;
    appendEvents(streamId: string, events: Event[]): Promise<void>;
}
