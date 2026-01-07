/*
 * Copyright (c) 2025 Nebulit GmbH
 * Licensed under the MIT License.
 */

export interface CursorStore {
    getCursor(processorName: string): Promise<string | null>;
    saveCursor(processorName: string, lastProcessedId: string): Promise<void>;
}
