/*
 * Copyright (c) 2025 Nebulit GmbH
 * Licensed under the MIT License.
 */
import { MessageBus } from '../../common/infrastructure/messageBus';
import { signalMock } from '../../common/infrastructure/SignalMock';
import { get<%- readmodelName %>TodoProjection } from './projection<%- readmodelName %>';

export interface TodoProcessorConfig {
    queueName: string;
    maxRetries: number;
    batchSize: number;
}

const config: TodoProcessorConfig = {
    queueName: '<%- readmodelName %>-todo-queue',
    maxRetries: 3,
    batchSize: 10
};

export class <%- readmodelName %>TodoProcessor {
    private processing: boolean = false;

    constructor() {
        // No constructor parameters needed for signal-based processing
    }

    async start(): Promise<void> {
        console.log(`Starting <%- readmodelName %> Todo Processor...`);

        // Subscribe to signals for event-driven processing
        // Listen for events that might create todos (e.g., CustomerCreated)
        signalMock.subscribe('CustomerCreated', async (event: any) => {
            await this.processPendingTodos();
        });

        // Initial processing on startup
        await this.processPendingTodos();
    }

    private async processPendingTodos(): Promise<void> {
        if (this.processing) {
            console.log('Todo processor already running, skipping...');
            return;
        }

        this.processing = true;

        try {
            const pendingTodos = await get<%- readmodelName %>TodoProjection();

            if (pendingTodos.length === 0) {
                console.log('No pending todos to process');
                return;
            }

            console.log(`Processing ${pendingTodos.length} pending todos...`);

            // Process todos in batches
            const batches = [];
            for (let i = 0; i < pendingTodos.length; i += config.batchSize) {
                batches.push(pendingTodos.slice(i, i + config.batchSize));
            }

            for (const batch of batches) {
                await this.processBatch(batch);
            }

        } catch (error) {
            console.error('Error processing todos:', error);
        } finally {
            this.processing = false;
        }
    }

    private async processBatch(todos: any[]): Promise<void> {
        const promises = todos.map(async (todo) => {
            try {
                await this.processTodo(todo);
            } catch (error) {
                console.error(`Failed to process todo ${todo.id}:`, error);
                await this.handleProcessingError(todo, error);
            }
        });

        await Promise.allSettled(promises);
    }

    private async processTodo(todo: any): Promise<void> {
        // Idempotent processing - check if already processed
        if (todo.status === 'processing') {
            console.log(`Todo ${todo.id} already being processed, skipping...`);
            return;
        }

        console.log(`Processing todo: ${JSON.stringify(todo)}`);

        // TODO: Replace with actual command dispatch based on processor configuration
        // Example: await this.messageBus.publish('<%- commandType %>', {
        //     streamId: todo.correlationId, // Use correlationId as streamId
        //     type: '<%- commandType %>',
        //     data: {
        //         <%- commandPayload %>
        //     },
        //     metadata: {
        //         correlation_id: todo.correlationId,
        //         causation_id: todo.correlationId
        //     }
        // });

        console.log(`Successfully processed todo ${todo.id}`);
    }

    private async handleProcessingError(todo: any, error: any): Promise<void> {
        const retryCount = (todo.retryCount || 0) + 1;

        if (retryCount >= config.maxRetries) {
            console.error(`Todo ${todo.id} failed permanently after ${retryCount} retries`);
            // TODO: Publish failure message to dead letter queue
        } else {
            console.log(`Todo ${todo.id} failed, will retry (${retryCount}/${config.maxRetries})`);
            // TODO: Publish retry message with delay
        }
    }

    async stop(): Promise<void> {
        console.log('Stopping <%- readmodelName %> Todo Processor...');
        this.processing = false;
    }
}

// Factory function for creating the processor
export function create<%- readmodelName %>TodoProcessor(): <%- readmodelName %>TodoProcessor {
    return new <%- readmodelName %>TodoProcessor();
}
