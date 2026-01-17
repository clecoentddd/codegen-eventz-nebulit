/*
 * Copyright (c) 2025 Nebulit GmbH
 * Licensed under the MIT License.
 */

import Navigation from '../app/src/components/Navigation';
import Badge from '../app/src/components/ui/Badge';
import Card from '../app/src/components/ui/Card';

<%- commandImports %>

export default function <%- sliceName %>Page() {
    return (
        <div className="min-h-screen">
            <Navigation />
            <main className="mx-auto max-w-6xl px-4 pb-16">
                <header className="mt-10 grid gap-6 md:grid-cols-[1.2fr_0.8fr] md:items-center">
                    <div className="space-y-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Slice</p>
                        <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl"><%- sliceTitle %></h1>
                        <p className="text-base text-slate-600">
                            Pilotez les commandes et observez la trajectoire des evenements et readmodels.
                        </p>
                        <div className="flex flex-wrap gap-2 text-xs font-medium text-slate-600">
                            <Badge>Commands</Badge>
                            <Badge>Events</Badge>
                            <Badge>Readmodels</Badge>
                        </div>
                    </div>
                </header>
                <section className="mt-10 grid gap-6">
                    <%- commandUIs %>
                </section>
            </main>
        </div>
    );
}
