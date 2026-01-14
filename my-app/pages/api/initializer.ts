/*
 * Copyright (c) 2025 Nebulit GmbH
 * Licensed under the MIT License.
 */

import { initialize } from '../../app/src/registry';

let isInitialized = false;

export async function ensureInitialized() {
    if (!isInitialized) {
        await initialize();
        isInitialized = true;
        console.log('[API] Command bus initialized.');
    }
}