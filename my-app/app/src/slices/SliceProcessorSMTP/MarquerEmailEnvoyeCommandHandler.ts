/*
 * Copyright (c) 2025 Nebulit GmbH
 * Licensed under the MIT License.
 */

import { EventStore } from '../../common/domain/EventStore';
import { rabbitMQMock } from '../../common/infrastructure/RabbitMQMock';
import { signalMock } from '../../common/infrastructure/SignalMock';
import { MarquerEmailEnvoyeCommand } from './MarquerEmailEnvoyeCommand';
import { MarquerEmailEnvoyeAttempted, MarquerEmailEnvoyeAttemptedEventName } from '../../events/MarquerEmailEnvoyeAttempted';

export const createMarquerEmailEnvoyeCommandHandler = (eventStore: EventStore) => {
    return async (command: MarquerEmailEnvoyeCommand) => {
        // EventZ Pattern: Append "Attempted" event and publish to RabbitMQ for async processing

        // 1. Append Attempted event to event store
        const attemptedEvent: MarquerEmailEnvoyeAttempted = {
            streamId: command.streamId,
            type: MarquerEmailEnvoyeAttemptedEventName,
            data: {
                clientId: command.data.clientId,
                clientEmail: command.data.clientEmail,
                entrepriseId: command.data.entrepriseId
            },
            metadata: {
                correlation_id: command.metadata?.correlation_id,
                causation_id: command.metadata?.causation_id
            }
        };

        await eventStore.appendEvents(command.streamId, [attemptedEvent]);

        // 2. Emit signal for processors/projections to wake up
        await signalMock.emit('MarquerEmailEnvoyeAttempted', attemptedEvent);

        // 3. Publish to RabbitMQ for async command processing
        await rabbitMQMock.publishToTopic('MarquerEmailEnvoye-queue', command);

        console.log(`[MarquerEmailEnvoyeHandler] Command attempted and queued for processing: ${command.streamId}`);
    };
};
