/*
 * Copyright (c) 2025 Nebulit GmbH
 * Licensed under the MIT License.
 */

import { useEffect, useState } from 'react';

export default function <%- screenName %>() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/<%- apiSlug %>')
            .then(res => res.json())
            .then(setData)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <h1><%- screenTitle %></h1>
            <ul>
                {data.map((item, index) => (
                    <li key={index}>{JSON.stringify(item)}</li>
                ))}
            </ul>
        </div>
    );
}
