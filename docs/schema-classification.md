# Schema Classification

Each column of the database is given one of the four data classes from the file data-classification.md.

## districts

| Column | Class |
|--------|-------|
| id | Public |
| name | Public |

## places

| Column | Class |
|--------|-------|
| id | Public |
| name | Public |
| district_id | Public |
| type | Public |
| price_band | Public |
| family_friendly | Public |
| needs_4x4 | Public |
| source | Public |
| operator_id | Private |

## profiles

| Column | Class |
|--------|-------|
| id | Private |
| auth_user_id | Restricted |
| display_name | Private |
| email | Private |
| role | Restricted |
| created_at | Private |

## bookings

| Column | Class |
|--------|-------|
| id | Confidential |
| profile_id | Confidential |
| place_id | Confidential |
| check_in | Confidential |
| check_out | Confidential |
| guests | Confidential |
| total_amount | Confidential |
| status | Confidential |
| payment_ref | Confidential |
| record_hash | Confidential |
| chain_tx_hash | Confidential |
| created_at | Confidential |

## reviews

| Column | Class |
|--------|-------|
| id | Public |
| profile_id | Private |
| place_id | Public |
| reviewer_pseudonym | Public |
| rating | Public |
| comment | Public |
| comment_hash | Public |
| chain_tx_hash | Confidential |
| created_at | Public |

Note 1: Every column of the bookings table is Confidential, because a booking shows who stayed where and when. The group decided that bookings, payment references and transaction hashes are Confidential.

Note 2: In the reviews table, the profile_id column is Private because it identifies the real person behind the pseudonym. Only the pseudonym is shown to other users.

Note 3: The operator_id column is Private because it points to the profile of a lodge owner.

Note 4: This classification is a proposal and needs the approval of the group.
