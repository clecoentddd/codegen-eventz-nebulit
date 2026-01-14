/*
 * Copyright (c) 2025 Nebulit GmbH
 * Licensed under the MIT License.
 */

type SignalHandler = (event: any) => void;

class SignalMock {
    private signals: Map<string, SignalHandler[]> = new Map();

    // Emit a signal to all subscribers
    async emit(signalName: string, event: any): Promise<void> {
        const handlers = this.signals.get(signalName);
        if (handlers) {
            // Simulate async processing
            setTimeout(() => {
                handlers.forEach(handler => {
                    try {
                        handler(event);
                    } catch (error) {
                        console.error(`Error in signal handler for ${signalName}:`, error);
                    }
                });
            }, 0);
        } else {
            console.warn(`[SignalMock] No handlers for signal: ${signalName}`);
        }
    }

    // Subscribe to a signal
    subscribe(signalName: string, handler: SignalHandler): void {
        if (!this.signals.has(signalName)) {
            this.signals.set(signalName, []);
        }
        this.signals.get(signalName)!.push(handler);
        console.log(`[SignalMock] Subscribed to signal: ${signalName}`);
    }

    // Unsubscribe from a signal
    unsubscribe(signalName: string, handler: SignalHandler): void {
        const handlers = this.signals.get(signalName);
        if (handlers) {
            const index = handlers.indexOf(handler);
            if (index > -1) {
                handlers.splice(index, 1);
                console.log(`[SignalMock] Unsubscribed from signal: ${signalName}`);
            }
        }
    }

    // Get signal handler count (for testing/debugging)
    getSignalHandlerCount(signalName: string): number {
        return this.signals.get(signalName)?.length || 0;
    }

    // Clear all handlers (for testing)
    clear(): void {
        this.signals.clear();
        console.log(`[SignalMock] Cleared all signal handlers`);
    }
}

export const signalMock = new SignalMock();
