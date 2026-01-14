/*
 * Copyright (c) 2025 Nebulit GmbH
 * Licensed under the MIT License.
 */

import { useEffect, useState } from 'react';

import ReadmodelList from '../../../components/ui/ReadmodelList';

export default function ListeDesEntreprisesDepuisBoond() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetch('/api/liste-des-entreprises-depuis-boond')
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

    const description = 'Apercu des donnees.';

    return (
        <ReadmodelList
            title="Liste des entreprises depuis Boond"
            description={description}
            items={data}
            loading={loading}
            error={error}
        />
    );
}
