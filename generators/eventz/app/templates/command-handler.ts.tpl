/*
 * Copyright (c) 2025 Nebulit GmbH
 * Licensed under the MIT License.
 */

import { EventStore } from '../../common/domain/EventStore';
import { rabbitMQMock } from '../../common/infrastructure/RabbitMQMock';
import { signalMock } from '../../common/infrastructure/SignalMock';
import { <%= commandType %>Command } from './<%= commandType %>Command';
import { <%= commandType %>Attempted, <%= commandType %>AttemptedEventName } from '../../events/<%= commandType %>Attempted';

export const create<%= commandType %>CommandHandler = (eventStore: EventStore) => {
    return async (command: <%= commandType %>Command) => {
        // EventZ Pattern: Append "Attempted" event and publish to RabbitMQ for async processing

        // 1. Append Attempted event to event store
        const attemptedEvent: <%= commandType %>Attempted = {
            streamId: command.streamId,
            type: <%= commandType %>AttemptedEventName,
            data: {
                <%= commandPayload %>
            },
            metadata: {
                correlation_id: command.metadata?.correlation_id,
                causation_id: command.metadata?.causation_id
            }
        };

        await eventStore.appendEvents(command.streamId, [attemptedEvent]);

        // 2. Emit signal for processors/projections to wake up
        await signalMock.emit('<%= commandType %>Attempted', attemptedEvent);

        // 3. Publish to RabbitMQ for async command processing
        await rabbitMQMock.publishToTopic('<%= commandType %>-queue', command);

        console.log(`[<%= commandType %>Handler] Command attempted and queued for processing: ${command.streamId}`);
    };
};
