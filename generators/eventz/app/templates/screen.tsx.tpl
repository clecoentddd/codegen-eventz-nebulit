/*
 * Copyright (c) 2025 Nebulit GmbH
 * Licensed under the MIT License.
 */

import { useEffect, useState } from 'react';

export default function <%- screenName %>() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetch('/api/<%- apiSlug %>')
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch data');
                return res.json();
            })
            .then(setData)
            .catch(err => {
                console.error(err);
                setError('Failed to load data. Please try again.');
            })
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div>Loading...</div>;
    if (error) return <div className="alert alert-error" role="alert">{error}</div>;

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
