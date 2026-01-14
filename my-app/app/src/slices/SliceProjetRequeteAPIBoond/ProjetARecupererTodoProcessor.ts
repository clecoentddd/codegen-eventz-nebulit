/*
 * Copyright (c) 2025 Nebulit GmbH
 * Licensed under the MIT License.
 */
import { randomUUID } from 'crypto';
import { signalMock } from '../../common/infrastructure/SignalMock';
import { getProjetARecupererTodoProjection } from './projectionProjetARecupererTodo';

import { MarquerProjetRecupereCommand } from './MarquerProjetRecupereCommand';
import { createMarquerProjetRecupereCommandHandler } from './MarquerProjetRecupereCommandHandler';
import { getEventStore } from '../../registry';


const ONE_STREAM_ONLY = "ONE_STREAM_ONLY";

export interface TodoProcessorConfig {
    queueName: string;
    maxRetries: number;
    batchSize: number;
}

const config: TodoProcessorConfig = {
    queueName: 'ProjetARecupererTodo-todo-queue',
    maxRetries: 3,
    batchSize: 10
};

export class ProjetARecupererTodoProcessor {
    private processing: boolean = false;

    constructor() {
        // No constructor parameters needed for signal-based processing
    }

    async start(): Promise<void> {
        console.log(`Starting ProjetARecupererTodo Todo Processor...`);

        // Subscribe to signals for event-driven processing
        signalMock.subscribe('ClientAuthentifie', async (event: any) => {
            console.log(`[Processor] Received event: ${event.type}`);
            await this.processPendingTodos();
        });

        // Initial processing on startup
        await this.processPendingTodos();
    }

    private async processPendingTodos(): Promise<void> {
        if (this.processing) {
            console.log('[Processor] Already running, skipping...');
            return;
        }

        this.processing = true;

        try {
            const eventStore = getEventStore();
            const pendingTodos = await getProjetARecupererTodoProjection(eventStore);

            if (pendingTodos.length === 0) {
                console.log('[Processor] No pending todos to process');
                return;
            }

            console.log(`[Processor] Processing ${pendingTodos.length} pending todos...`);
            
            // Process todos in batches
            for (let i = 0; i < pendingTodos.length; i += config.batchSize) {
                const batch = pendingTodos.slice(i, i + config.batchSize);
                await this.processBatch(batch);
            }

        } catch (error) {
            console.error('[Processor] Error processing todos:', error);
        } finally {
            this.processing = false;
        }
    }

    private async processBatch(todos: any[]): Promise<void> {
        for (const todo of todos) {
            try {
                await this.processTodo(todo);
            } catch (error) {
                console.error(`[Processor] Failed to process todo ${todo.id}:`, error);
                await this.handleProcessingError(todo, error);
            }
        }
    }

    private async processTodo(todo: any): Promise<void> {
        // Idempotent processing - check if already processed
        if (todo.status === 'processing') {
            console.log(`[Processor] Todo ${todo.id} already being processed, skipping...`);
            return;
        }

        console.log(`[Processor] Processing todo: ${JSON.stringify(todo)}`);


        // Create and dispatch command
        const command: MarquerProjetRecupereCommand = {
            streamId: ONE_STREAM_ONLY,
            type: 'MarquerProjetRecupere',
            data: {
                projetId: todo.projetId,
                entrepriseId: todo.entrepriseId,
                projetNom: todo.projetNom
            },
            metadata: {
                correlation_id: todo.correlationId,
                causation_id: todo.id
            }
        };

        const eventStore = getEventStore();
        const handler = createMarquerProjetRecupereCommandHandler(eventStore);
        await handler(command);
        
        console.log(`[Processor] Successfully dispatched MarquerProjetRecupere command for todo ${todo.id}`);

    }

    private async handleProcessingError(todo: any, error: any): Promise<void> {
        const retryCount = (todo.retryCount || 0) + 1;

        if (retryCount >= config.maxRetries) {
            console.error(`[Processor] Todo ${todo.id} failed permanently after ${retryCount} retries`);
            // TODO: Publish failure message to dead letter queue
        } else {
            console.log(`[Processor] Todo ${todo.id} failed, will retry (${retryCount}/${config.maxRetries})`);
            // TODO: Publish retry message with delay
        }
    }

    async stop(): Promise<void> {
        console.log(`Stopping ProjetARecupererTodo Todo Processor...`);
        this.processing = false;
    }
}

// Factory function
export function createProjetARecupererTodoProcessor(): ProjetARecupererTodoProcessor {
    return new ProjetARecupererTodoProcessor();
}
