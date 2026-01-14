/*
 * Copyright (c) 2025 Nebulit GmbH
 * Licensed under the MIT License.
 */

import { EventStore } from '../../common/domain/EventStore';
import { rabbitMQMock } from '../../common/infrastructure/RabbitMQMock';
import { signalMock } from '../../common/infrastructure/SignalMock';
import { ClientAuthentifieCommand } from './ClientAuthentifieCommand';
import { ClientAuthentifieAttempted, ClientAuthentifieAttemptedEventName } from '../../events/ClientAuthentifieAttempted';

export const createClientAuthentifieCommandHandler = (eventStore: EventStore) => {
    return async (command: ClientAuthentifieCommand) => {
        // EventZ Pattern: Append "Attempted" event and publish to RabbitMQ for async processing

        // 1. Append Attempted event to event store
        const attemptedEvent: ClientAuthentifieAttempted = {
            streamId: command.streamId,
            type: ClientAuthentifieAttemptedEventName,
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
        await signalMock.emit('ClientAuthentifieAttempted', attemptedEvent);

        // 3. Publish to RabbitMQ for async command processing
        await rabbitMQMock.publishToTopic('ClientAuthentifie-queue', command);

        console.log(`[ClientAuthentifieHandler] Command attempted and queued for processing: ${command.streamId}`);
    };
};
