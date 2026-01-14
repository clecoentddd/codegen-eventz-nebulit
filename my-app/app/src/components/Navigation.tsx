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
          <li><NavLinkPill href="/admin-connection">Admin Connection</NavLinkPill></li>
        <li><NavLinkPill href="/admin-connecte">Admin Connecté</NavLinkPill></li>
        <li><NavLinkPill href="/entreprise-a-retrouver-api">Entreprise A Retrouver API</NavLinkPill></li>
        <li><NavLinkPill href="/liste-des-entreprises">Liste des entreprises</NavLinkPill></li>
        <li><NavLinkPill href="/prepare-invitation">Prepare Invitation</NavLinkPill></li>
        <li><NavLinkPill href="/invitation-a-envoyer">invitation à envoyer</NavLinkPill></li>
        <li><NavLinkPill href="/processor-smtp">processor SMTP</NavLinkPill></li>
        <li><NavLinkPill href="/client-creation-compte">Client Création Compte</NavLinkPill></li>
        <li><NavLinkPill href="/client-a-authentifie">client à authentifié</NavLinkPill></li>
        <li><NavLinkPill href="/client-authentification-auth0">Client Authentification Auth0</NavLinkPill></li>
        <li><NavLinkPill href="/projet-a-recuperer">projet à récupérer</NavLinkPill></li>
        <li><NavLinkPill href="/projet-requete-api-boond">Projet Requête API boond</NavLinkPill></li>
        <li><NavLinkPill href="/projet-recupere-depuis-boond">projet récupéré depuis Boond</NavLinkPill></li>
        <li><NavLinkPill href="/facture-a-recuperer">facture A récupérer</NavLinkPill></li>
        <li><NavLinkPill href="/requete-facture-api-boond">Requête Facture API Boond</NavLinkPill></li>
        <li><NavLinkPill href="/liste-des-factures-depuis-boond">Liste des factures depuis boond</NavLinkPill></li>
        </ul>
      </div>
    </nav>
  );
}
