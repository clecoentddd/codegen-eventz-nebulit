/*
 * Copyright (c) 2025 Nebulit GmbH
 * Licensed under the MIT License.
 */

import NavLinkPill from './ui/NavLinkPill';

export default function Navigation() {
  return (
    <nav className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-sm font-semibold text-white">
            EZ
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">Eventz Studio</p>
            <p className="text-xs text-slate-500">Command cockpit</p>
          </div>
        </div>
        <ul className="flex flex-wrap items-center gap-2">
          <li>
            <NavLinkPill href="/">Home</NavLinkPill>
          </li>
          <%- navigationLinks %>
        </ul>
      </div>
    </nav>
  );
}
