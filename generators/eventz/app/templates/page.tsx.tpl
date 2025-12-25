/*
 * Copyright (c) 2025 Nebulit GmbH
 * Licensed under the MIT License.
 */

<%= commandImports %>

export default function <%= sliceName %>Page() {
    return (
        <div className="slice-page">
            <h2><%= sliceTitle %></h2>
            <div className="commands">
                <%= commandUIs %>
            </div>
        </div>
    );
}
