/*
 * Copyright (c) 2025 Nebulit GmbH
 * Licensed under the MIT License.
 */

type MessageHandler = (message: any) => void;

class RabbitMQMock {
    private queues: Map<string, MessageHandler[]> = new Map();
    private exchanges: Map<string, MessageHandler[]> = new Map();

    // Publish to a queue (direct messaging)
    async publishToTopic(queueName: string, message: any): Promise<void> {
        console.log(`[RabbitMQMock] Publishing to queue: ${queueName}`);
        console.log(`[RabbitMQMock] Publishing message:`, JSON.stringify(message, null, 2));
        console.log(`[RabbitMQMock] Message type: ${message?.type || 'unknown'}`);
        console.log(`[RabbitMQMock] Message streamId: ${message?.streamId || 'unknown'}`);

        const handlers = this.queues.get(queueName);
        const handlerCount = handlers ? handlers.length : 0;
        console.log(`[RabbitMQMock] Handlers found for queue ${queueName}: ${handlerCount}`);

        if (handlers && handlers.length > 0) {
            console.log(`[RabbitMQMock] Processing message asynchronously...`);
            // Simulate async processing
            setTimeout(() => {
                console.log(`[RabbitMQMock] Executing ${handlers.length} handler(s) for queue: ${queueName}`);
                handlers.forEach((handler, index) => {
                    try {
                        console.log(`[RabbitMQMock] Executing handler ${index + 1}/${handlers.length} for queue: ${queueName}`);
                        handler(message);
                        console.log(`[RabbitMQMock] Handler ${index + 1} completed successfully`);
                    } catch (error) {
                        console.error(`[RabbitMQMock] Error in queue handler ${index + 1} for ${queueName}:`, error);
                    }
                });
                console.log(`[RabbitMQMock] All handlers executed for queue: ${queueName}`);
            }, 0);
        } else {
            console.warn(`[RabbitMQMock] No handlers for queue: ${queueName}`);
            console.log(`[RabbitMQMock] Available queues:`, Array.from(this.queues.keys()));
            console.log(`[RabbitMQMock] Queue handler counts:`, Object.fromEntries(
                Array.from(this.queues.entries()).map(([queue, handlers]) => [queue, handlers.length])
            ));
        }
    }

    // Subscribe to a queue
    subscribeToQueue(queueName: string, handler: MessageHandler): void {
        if (!this.queues.has(queueName)) {
            this.queues.set(queueName, []);
        }
        this.queues.get(queueName)!.push(handler);
        const newHandlerCount = this.queues.get(queueName)!.length;
        console.log(`[RabbitMQMock] Subscribed to queue: ${queueName} (total handlers: ${newHandlerCount})`);
        console.log(`[RabbitMQMock] All subscribed queues:`, Array.from(this.queues.keys()));
    }

    // Publish to an exchange (pub/sub messaging)
    async publishToExchange(exchangeName: string, message: any): Promise<void> {
        const handlers = this.exchanges.get(exchangeName);
        if (handlers) {
            // Simulate async processing
            setTimeout(() => {
                handlers.forEach(handler => {
                    try {
                        handler(message);
                    } catch (error) {
                        console.error(`Error in exchange handler for ${exchangeName}:`, error);
                    }
                });
            }, 0);
        } else {
            console.warn(`[RabbitMQMock] No handlers for exchange: ${exchangeName}`);
        }
    }

    // Subscribe to an exchange
    subscribeToExchange(exchangeName: string, handler: MessageHandler): void {
        if (!this.exchanges.has(exchangeName)) {
            this.exchanges.set(exchangeName, []);
        }
        this.exchanges.get(exchangeName)!.push(handler);
        console.log(`[RabbitMQMock] Subscribed to exchange: ${exchangeName}`);
    }

    // Unsubscribe from queue
    unsubscribeFromQueue(queueName: string, handler: MessageHandler): void {
        const handlers = this.queues.get(queueName);
        if (handlers) {
            const index = handlers.indexOf(handler);
            if (index > -1) {
                handlers.splice(index, 1);
                console.log(`[RabbitMQMock] Unsubscribed from queue: ${queueName}`);
            }
        }
    }

    // Unsubscribe from exchange
    unsubscribeFromExchange(exchangeName: string, handler: MessageHandler): void {
        const handlers = this.exchanges.get(exchangeName);
        if (handlers) {
            const index = handlers.indexOf(handler);
            if (index > -1) {
                handlers.splice(index, 1);
                console.log(`[RabbitMQMock] Unsubscribed from exchange: ${exchangeName}`);
            }
        }
    }

    // Get queue handler count (for testing/debugging)
    getQueueHandlerCount(queueName: string): number {
        return this.queues.get(queueName)?.length || 0;
    }

    // Get exchange handler count (for testing/debugging)
    getExchangeHandlerCount(exchangeName: string): number {
        return this.exchanges.get(exchangeName)?.length || 0;
    }

    // Generic publish method (defaults to queue publishing)
    async publish(queueOrExchangeName: string, message: any): Promise<void> {
        // If it looks like an exchange name (contains 'exchange' or has routing key), use exchange
        if (queueOrExchangeName.includes('exchange') || typeof message === 'object' && message.routingKey) {
            return this.publishToExchange(queueOrExchangeName, message);
        } else {
            // Default to queue publishing
            return this.publishToTopic(queueOrExchangeName, message);
        }
    }
}

export const rabbitMQMock = new RabbitMQMock();
