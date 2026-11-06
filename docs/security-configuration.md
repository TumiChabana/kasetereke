# Security Configuration Module

## Purpose

The Security Configuration module is the place where the rules that protect the app are managed. It is part of the administrator console and is not part of the traveller app.

## Why it is on a different domain

1. The traveller app is hosted on GitHub Pages. The administrator console, which contains this module, is hosted on Cloudflare Pages, so it has its own separate domain.
2. A separate domain means that a travellers' page and an administrator page are never served from the same place, so a mistake in one does not open the other.
3. A browser keeps the stored data of each domain apart from every other domain, so data stored by the traveller app is not shared with the administrator console.
4. Fewer people need to know about the administrator console, so it is easier to protect.

## Who can use the module

| Role | Access | Reason |
|------|--------|--------|
| Traveller | None | Travellers have no reason to see security settings. |
| Operator | None | Lodge owners manage only their own listings. |
| Administrator | Read | The administrator can see the settings but cannot change them. |
| Security Officer | Read and Write | The Security Officer is responsible for the settings. |

## What the module manages

| Item | Data class |
|------|------------|
| Roles and permissions | Restricted |
| Data classification of each column | Restricted |
| Compliance levels | Restricted |
| Record of changes made to the settings | Restricted |

## Rules for secrets

1. No key, password, token, or connection string is ever saved in the repository, because the repository is public.
2. Secrets are kept in a private file called .env, which is never committed.
3. Only test wallets are used on the blockchain, and never a wallet that holds real money.
4. Payments are mock payments only, so no real payment data is stored.

Note 1: The access table matches the file permissions-matrix.md. The access of the Administrator is a proposal and needs the approval of the group.

Note 2: The list of items managed by the module is a proposal and needs the approval of the group.
