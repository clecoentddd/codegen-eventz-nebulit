/*
 * Copyright (c) 2025 Nebulit GmbH
 * Licensed under the MIT License.
 */

import { initialize } from '../../app/src/registry';

let isInitialized = false;

export function ensureInitialized() {
    if (!isInitialized) {
        initialize();
        isInitialized = true;
    }
}
