/*
 * Copyright (c) 2025 Nebulit GmbH
 * Licensed under the MIT License.
 */

import { EventStore } from '../../common/domain/EventStore';
import { rabbitMQMock } from '../../common/infrastructure/RabbitMQMock';
import { signalMock } from '../../common/infrastructure/SignalMock';
import { EntrepriseRetrouveeCommand } from './EntrepriseRetrouveeCommand';
import { EntrepriseRetrouveeAttempted, EntrepriseRetrouveeAttemptedEventName } from '../../events/EntrepriseRetrouveeAttempted';

export const createEntrepriseRetrouveeCommandHandler = (eventStore: EventStore) => {
    return async (command: EntrepriseRetrouveeCommand) => {
        // EventZ Pattern: Append "Attempted" event and publish to RabbitMQ for async processing

        // 1. Append Attempted event to event store
        const attemptedEvent: EntrepriseRetrouveeAttempted = {
            streamId: command.streamId,
            type: EntrepriseRetrouveeAttemptedEventName,
            data: {
                entrepriseId: command.data.entrepriseId,
                entrepriseNom: command.data.entrepriseNom,
                connectionId: command.data.connectionId
            },
            metadata: {
                correlation_id: command.metadata?.correlation_id,
                causation_id: command.metadata?.causation_id
            }
        };

        await eventStore.appendEvents(command.streamId, [attemptedEvent]);

        // 2. Emit signal for processors/projections to wake up
        await signalMock.emit('EntrepriseRetrouveeAttempted', attemptedEvent);

        // 3. Publish to RabbitMQ for async command processing
        await rabbitMQMock.publishToTopic('EntrepriseRetrouvee-queue', command);

        console.log(`[EntrepriseRetrouveeHandler] Command attempted and queued for processing: ${command.streamId}`);
    };
};
