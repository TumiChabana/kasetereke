# Permissions Matrix

Each cell says what the role may do in that module. Use only these words: Read, Write, Read and Write, or None.

| Role | Listings | Bookings | Reviews | Users | Security Configuration |
|------|----------|----------|---------|-------|------------------------|
| Traveller | Read | Read and Write | Read and Write | Read and Write | None |
| Operator | Read and Write | Read | Read | Read and Write | None |
| Administrator | Read and Write | Read and Write | Read and Write | Read and Write | Read |
| Security Officer | Read | None | Read | Read | Read and Write |

Note 1: A traveller can read and write only their own bookings, reviews and profile. A review can be written only after a confirmed or completed booking.

Note 2: An operator can write only the listings that they own, can read only the bookings made for their own listings, and can read and write only their own profile.

Note 3: An administrator can change only the status and the hash columns of a booking, and can delete a review but not write one.

Note 4: The Security Configuration column is a proposal and still needs the approval of the group.
