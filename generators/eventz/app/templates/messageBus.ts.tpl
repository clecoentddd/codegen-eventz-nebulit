/*
 * Copyright (c) 2025 Nebulit GmbH
 * Licensed under the MIT License.
 */

import { Command } from "../domain/Command";

type Handler<T> = (command: T) => void;

class MessageBus {
    private handlers: Map<string, Handler<any>> = new Map();

    subscribe<T extends Command>(commandType: T['type'], handler: Handler<T>) {
        this.handlers.set(commandType, handler);
    }

    async publish<T extends Command>(commandType: T['type'], command: T) {
        const handler = this.handlers.get(commandType);
        if (handler) {
            await handler(command);
        } else {
            console.warn(`[MessageBus] No handler registered for command type: ${commandType}`);
        }
    }
}

export const messageBus = new MessageBus();
