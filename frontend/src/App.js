import React, { useState } from 'react';
import Fuse from 'fuse.js';
import naicsData from './data/naics.json';
import { API } from 'aws-amplify';

const fuse = new Fuse(naicsData, { keys: ['description', 'code'] });

export default function App() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    const fuseResults = fuse.search(query).map(res => res.item);
    if (fuseResults.length > 0) {
      setResults(fuseResults);
    } else {
      setLoading(true);
      try {
        const response = await API.post('naicsapi', '/lookup', { body: { description: query } });
        setResults(Array.isArray(response) ? response : [response]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div>
      <h1>NAICS Lookup</h1>
      <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Describe your business" />
      <button onClick={handleSearch} disabled={loading}>Search</button>
      <ul>
        {results.map(r => (
          <li key={r.code}>{r.code} - {r.description}</li>
        ))}
      </ul>
    </div>
  );
}
