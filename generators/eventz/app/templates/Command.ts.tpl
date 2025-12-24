/*
 * Copyright (c) 2025 Nebulit GmbH
 * Licensed under the MIT License.
 */

export type Command<T extends string = string, D = Record<string, unknown>> = {
    streamId: string;
    type: T;
    data: D;
    metadata?: {
        correlation_id?: string;
        causation_id?: string;
    };
};
