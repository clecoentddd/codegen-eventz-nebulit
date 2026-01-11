/*
 * Copyright (c) 2025 Nebulit GmbH
 * Licensed under the MIT License.
 */

import Navigation from '../app/src/components/Navigation';

<%- commandImports %>

export default function <%- sliceName %>Page() {
    return (
        <>
            <Navigation />
            <div className="slice-page">
                <h2><%- sliceTitle %></h2>
                <div className="commands">
                    <%- commandUIs %>
                </div>
            </div>
        </>
    );
}
