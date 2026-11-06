# General Data Protection Regulation Compliance

This file describes how the app protects personal data. It uses the four data classes from the file data-classification.md.

## Compliance levels

| Level | Data class | Contains personal data | Protection rules |
|-------|------------|------------------------|------------------|
| Level 1 | Public | No | Anyone signed in can read it. Only the owner or an administrator can change it. |
| Level 2 | Private | Yes | Stored only in the database. Each user can read and change only their own record. Never written to the blockchain. |
| Level 3 | Confidential | Linked to a person | Only the owner of the record, the lodge owner concerned, and the administrator can read it. Only a hash of it may be written to the blockchain. |
| Level 4 | Restricted | Not shown to users | Only the Security Officer and the administrator can reach it. It is never committed to the repository and never written to the blockchain. |

## How the app supports the rights of a person

| Right | Article | How the app supports it |
|-------|---------|-------------------------|
| Access | Article 15 | A traveller can read their own profile and bookings. |
| Correction | Article 16 | A traveller can update their own display name and email address. |
| Erasure | Article 17 | The personal data is deleted from the database. The blockchain holds only hashes, so no personal data remains on it. |
| Portability | Article 20 | The administrator can export a traveller record on request. |

## Rules for the blockchain

1. Only hashes and small fields are written to the blockchain. Examples are the booking identifier hash, the district identifier, the timestamp, the status, and the review rating.
2. No name, email address, phone number, or other personal data is written to the blockchain, because the blockchain is permanent and cannot be erased.
3. Reviews use a pseudonymous identifier. Pseudonymised data is still treated as personal data, so the link between the pseudonym and the real person stays in the database only.

## Other duties

1. Data protection by design (Article 25): the database rules and the data classes were decided before the app was built.
2. Security of processing (Article 32): row-level security, separate roles, and a separate domain for the administrator console.
3. Breach notification (Article 33): the Security Officer tells the supervisory authority within 72 hours of finding a breach.

Note 1: The levels are a proposal and need the approval of the group.

Note 2: The lecturer may expect different levels. This file must be checked against the assignment brief.

Note 3: The app uses mock payments only, so no real payment data is stored.
