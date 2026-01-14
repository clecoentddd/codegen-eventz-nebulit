/*
 * Copyright (c) 2025 Nebulit GmbH
 * Licensed under the MIT License.
 */


export type Command<T = any> = {
    streamId: string;
    type: string;
    data: T;
    metadata?: {
        correlation_id?: string;
        causation_id?: string;
    };
};

