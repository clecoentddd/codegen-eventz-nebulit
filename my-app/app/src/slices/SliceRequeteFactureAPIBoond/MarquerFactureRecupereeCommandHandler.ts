/*
 * Copyright (c) 2025 Nebulit GmbH
 * Licensed under the MIT License.
 */

import { EventStore } from '../../common/domain/EventStore';
import { rabbitMQMock } from '../../common/infrastructure/RabbitMQMock';
import { signalMock } from '../../common/infrastructure/SignalMock';
import { MarquerFactureRecupereeCommand } from './MarquerFactureRecupereeCommand';
import { MarquerFactureRecupereeAttempted, MarquerFactureRecupereeAttemptedEventName } from '../../events/MarquerFactureRecupereeAttempted';

export const createMarquerFactureRecupereeCommandHandler = (eventStore: EventStore) => {
    return async (command: MarquerFactureRecupereeCommand) => {
        // EventZ Pattern: Append "Attempted" event and publish to RabbitMQ for async processing

        // 1. Append Attempted event to event store
        const attemptedEvent: MarquerFactureRecupereeAttempted = {
            streamId: command.streamId,
            type: MarquerFactureRecupereeAttemptedEventName,
            data: {
                factureId: command.data.factureId,
                projetId: command.data.projetId,
                entrepriseId: command.data.entrepriseId
            },
            metadata: {
                correlation_id: command.metadata?.correlation_id,
                causation_id: command.metadata?.causation_id
            }
        };

        await eventStore.appendEvents(command.streamId, [attemptedEvent]);

        // 2. Emit signal for processors/projections to wake up
        await signalMock.emit('MarquerFactureRecupereeAttempted', attemptedEvent);

        // 3. Publish to RabbitMQ for async command processing
        await rabbitMQMock.publishToTopic('MarquerFactureRecuperee-queue', command);

        console.log(`[MarquerFactureRecupereeHandler] Command attempted and queued for processing: ${command.streamId}`);
    };
};
