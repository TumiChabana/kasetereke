# Admin Console Plan

The admin console is a separate site in the folder apps/admin. It is plain HTML, CSS, and JavaScript, with no framework and no build step. It is hosted on Cloudflare Pages, so it has its own domain. It has a desktop layout with a sidebar and a wide table. Screens use hash routes, such as #/users, and never path routes.

## Screens

| Screen | Route | Who can open it | What it shows | Data it needs |
|--------|-------|-----------------|---------------|---------------|
| Users and roles | #/users | Admin can read and change roles. Security Officer can read. | A list of profiles and their roles. Only an Admin can change the role of another person. | The profiles table |
| Data classification | #/classification | Admin and Security Officer can read. | The class of every database column, as written in schema-classification.md. | None. The content is fixed. |
| Security settings | #/security | Security Officer can read and write. Admin can read. | The settings described in security-configuration.md. | To be decided with the database owner |
| Operator dashboard | #/operator | Operator | Only the listings of that operator, and the bookings made for those listings. | The places and bookings tables |
| Audit log | #/audit | Admin and Security Officer can read. | A record of changes, such as a change of role. | An audit table. The name is not known yet. |

## Build order

1. The page frame: the sidebar and the hash routes.
2. Users and roles, with sample data.
3. Data classification.
4. Security settings.
5. Operator dashboard.
6. Audit log, after the database owner gives the table name.
7. Connect to the real database, after the database owner gives the sign-in details and the public Data API address.

## Rules

1. The roles are Traveller, Operator, Admin, and Security Officer. The Traveller does not use the admin console.
2. Only an Admin can change the role of another person.
3. The console is first built with sample data, and then connected to the database.
4. No key, password, or connection string is ever saved in the repository.
5. The colours and fonts follow the traveller app, which are shared through the file css/tokens.css.

Note 1: The screens and the access of each role are a proposal and need the approval of the group.

Note 2: The dashboards for the artificial intelligence part belong to the teammate who owns data and artificial intelligence, so they are not listed here. The file dashboards.md must be updated to match this plan.
