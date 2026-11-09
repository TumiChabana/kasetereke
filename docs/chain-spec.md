# Chain spec

Shared by Areas 1 (traveller app), 2 (database), 3 (blockchain) and 5 (admin console). Do not change the recipes below once records exist on the chain.

## Where it lives
- Network: Sepolia (chain ID 11155111)
- Contract: RecordRegistry at 0xbAE4e3421d073eABf87a0A2A8b7a5a00E4179692
- Source code: contracts/RecordRegistry.sol
- Only the owner wallet (the wallet that deployed it) can write. Anyone can read.

## What goes on the chain
Only fingerprints (hashes) and a timestamp. Never names, emails, phone numbers or comment text.
- Key = keccak256 of the record's UUID (ethers.id(id))
- Booking hash = keccak256 of: id|place_id|check_in|check_out|guests|total_amount (2 decimals)|status
- Review hash = keccak256 of: id|place_id|rating|comment|reviewer_pseudonym

## Who does what
- Traveller app (Area 1): read only. Calls KaChain.verifyBooking(row) or KaChain.verifyReview(row) from js/chain.js and shows the result.
- Admin console (Area 5): an Anchor button for confirmed bookings and posted reviews that have no hash yet. It records the hash through MetaMask with the owner wallet, then saves the hash and the transaction hash in the database.
- Database (Area 2): bookings.record_hash and bookings.chain_tx_hash; reviews.comment_hash (holds the whole review hash) and reviews.chain_tx_hash.

## Verify results
- verified: hash rebuilt from the database row equals the one on the chain
- pending: nothing recorded on the chain yet for this record
- mismatch: a hash exists but the row no longer produces it, so the record was changed

## Rules
- The traveller app never holds a wallet key. Nobody commits a key or recovery phrase.
- A status change (for example pending to confirmed) is recorded as a new entry. The old entry stays in the chain's history.
- Sepolia test ETH is limited, so anchor only records that matter for the demo.

## Open items
- Area 2: add an admin update rule for the reviews hash columns.
- Area 5: build the Anchor button.
- Area 1: show verified, pending and mismatch on the receipt and on reviews.
