/*
 * Copyright (c) 2025 Nebulit GmbH
 * Licensed under the MIT License.
 */

import { Command } from "../domain/Command";

type Handler<T> = (command: T) => void;
type QueueHandler = (message: any) => void;

class MessageBus {
    private handlers: Map<string, Handler<any>> = new Map();
    private queueHandlers: Map<string, QueueHandler> = new Map();

    subscribe<T extends Command>(commandType: T['type'], handler: Handler<T>) {
        this.handlers.set(commandType, handler);
    }

    subscribeQueue(queueName: string, handler: QueueHandler) {
        this.queueHandlers.set(queueName, handler);
    }

    async publish<T extends Command>(commandType: T['type'], command: T) {
        const handler = this.handlers.get(commandType);
        if (handler) {
            await handler(command);
        } else {
            console.warn(`[MessageBus] No handler registered for command type: ${commandType}`);
        }
    }

    async publishToTopic(queueName: string, message: any) {
        const handler = this.queueHandlers.get(queueName);
        if (handler) {
            await handler(message);
        } else {
            console.warn(`[MessageBus] No handler registered for queue: ${queueName}`);
        }
    }
}

export const messageBus = new MessageBus();
