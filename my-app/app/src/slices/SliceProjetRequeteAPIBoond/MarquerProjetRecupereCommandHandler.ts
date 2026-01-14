/*
 * Copyright (c) 2025 Nebulit GmbH
 * Licensed under the MIT License.
 */

import { EventStore } from '../../common/domain/EventStore';
import { rabbitMQMock } from '../../common/infrastructure/RabbitMQMock';
import { signalMock } from '../../common/infrastructure/SignalMock';
import { MarquerProjetRecupereCommand } from './MarquerProjetRecupereCommand';
import { MarquerProjetRecupereAttempted, MarquerProjetRecupereAttemptedEventName } from '../../events/MarquerProjetRecupereAttempted';

export const createMarquerProjetRecupereCommandHandler = (eventStore: EventStore) => {
    return async (command: MarquerProjetRecupereCommand) => {
        // EventZ Pattern: Append "Attempted" event and publish to RabbitMQ for async processing

        // 1. Append Attempted event to event store
        const attemptedEvent: MarquerProjetRecupereAttempted = {
            streamId: command.streamId,
            type: MarquerProjetRecupereAttemptedEventName,
            data: {
                projetId: command.data.projetId,
                entrepriseId: command.data.entrepriseId,
                projetNom: command.data.projetNom
            },
            metadata: {
                correlation_id: command.metadata?.correlation_id,
                causation_id: command.metadata?.causation_id
            }
        };

        await eventStore.appendEvents(command.streamId, [attemptedEvent]);

        // 2. Emit signal for processors/projections to wake up
        await signalMock.emit('MarquerProjetRecupereAttempted', attemptedEvent);

        // 3. Publish to RabbitMQ for async command processing
        await rabbitMQMock.publishToTopic('MarquerProjetRecupere-queue', command);

        console.log(`[MarquerProjetRecupereHandler] Command attempted and queued for processing: ${command.streamId}`);
    };
};
