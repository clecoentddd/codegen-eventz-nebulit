/*
 * Copyright (c) 2025 Nebulit GmbH
 * Licensed under the MIT License.
 */

import Link from 'next/link';

export default function Navigation() {
  return (
    <nav style={{ 
      padding: '1rem', 
      borderBottom: '1px solid #ccc', 
      marginBottom: '2rem',
      backgroundColor: '#f5f5f5'
    }}>
      <ul style={{ 
        listStyle: 'none', 
        padding: 0, 
        margin: 0, 
        display: 'flex', 
        gap: '1.5rem',
        flexWrap: 'wrap'
      }}>
        <li><Link href="/" style={{ textDecoration: 'none', color: '#0070f3' }}>Home</Link></li>
        <%- navigationLinks %>
      </ul>
    </nav>
  );
}
