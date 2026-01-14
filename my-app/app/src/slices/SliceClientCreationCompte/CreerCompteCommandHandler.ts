/*
 * Copyright (c) 2025 Nebulit GmbH
 * Licensed under the MIT License.
 */

import { EventStore } from '../../common/domain/EventStore';
import { rabbitMQMock } from '../../common/infrastructure/RabbitMQMock';
import { signalMock } from '../../common/infrastructure/SignalMock';
import { CreerCompteCommand } from './CreerCompteCommand';
import { CreerCompteAttempted, CreerCompteAttemptedEventName } from '../../events/CreerCompteAttempted';

export const createCreerCompteCommandHandler = (eventStore: EventStore) => {
    return async (command: CreerCompteCommand) => {
        // EventZ Pattern: Append "Attempted" event and publish to RabbitMQ for async processing

        // 1. Append Attempted event to event store
        const attemptedEvent: CreerCompteAttempted = {
            streamId: command.streamId,
            type: CreerCompteAttemptedEventName,
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
        await signalMock.emit('CreerCompteAttempted', attemptedEvent);

        // 3. Publish to RabbitMQ for async command processing
        await rabbitMQMock.publishToTopic('CreerCompte-queue', command);

        console.log(`[CreerCompteHandler] Command attempted and queued for processing: ${command.streamId}`);
    };
};
