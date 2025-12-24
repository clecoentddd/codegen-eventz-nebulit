/*
 * Copyright (c) 2025 Nebulit GmbH
 * Licensed under the MIT License.
 */

import { EventStore } from '../../common/domain/EventStore';
import { <%= commandType %>Command } from './<%= commandType %>Command';
import { decide } from './<%= commandType %>Decider';

export const create<%= commandType %>CommandHandler = (eventStore: EventStore) => {
    return async (command: <%= commandType %>Command) => {
        // You can retrieve the aggregate state from the event store if needed
        // const events = await eventStore.getEvents(command.streamId);
        // const aggregate = replay(events);

        const newEvents = decide(command);

        await eventStore.appendEvents(command.streamId, newEvents);
    };
};
