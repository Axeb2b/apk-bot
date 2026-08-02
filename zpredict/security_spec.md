# Security Specifications & Data Invariants for zPredict

This document details the security rules, attribute-based access control (ABAC), and threat vectors for the `zPredict` web3 trading and swap application backend on Firebase.

## 1. Data Invariants

1. **User Identity Isolation (PII Partitioning)**: A user's profile database entry (containing their email) can only be read or written by the authenticated owner of that account (`request.auth.uid == userId`). Blanket list queries are strictly forbidden.
2. **Transaction Integrity**: Every financial transaction logged (swap, bridge, buy, or sell) must contain an immutable token set, network, and amount, and must be anchored to the user's authentic `request.auth.uid`.
3. **Temporal Validity**: Creation and modification times (`createdAt`, `updatedAt`) must strictly match the server time (`request.time`) to prevent frontloaded history spoofing.
4. **Restricted State Mutations**: Non-owner transactions are blocked entirely. Within owners, transaction fields (token symbols, values, chains) are immutable once written; only the `status` can be changed during execution tracking.

---

## 2. The "Dirty Dozen" Threat Payloads

The following malicious payloads must be blocked by the Firestore rules:

### Path: `/users/{userId}`

1. **Self-Elevating User profile creation**
   - *Attack*: Attempt to set `userId` to a target victim's UID.
   - *Expectation*: `PERMISSION_DENIED`
2. **Profile Scraping (Blanket Read)**
   - *Attack*: Logged-in attacker queries all records in `/users` without limiting query to their own UID.
   - *Expectation*: `PERMISSION_DENIED`
3. **Immutability Bypass via Update**
   - *Attack*: Attempting to update `createdAt` or change the `email` of a profile.
   - *Expectation*: `PERMISSION_DENIED`
4. **Junk character ID Injection**
   - *Attack*: Injecting a 2MB string as the `userId` document path.
   - *Expectation*: `PERMISSION_DENIED` (handled by size/regex guards)

### Path: `/transactions/{transactionId}`

5. **Cross-User Transaction Logging**
   - *Attack*: Logged-in User A tries to log a transaction under User B's UID in `/transactions`.
   - *Expectation*: `PERMISSION_DENIED`
6. **Transaction Spoofing (Query Harvesting)**
   - *Attack*: Client queries all transactions without filtering by `userId == auth.uid`.
   - *Expectation*: `PERMISSION_DENIED`
7. **Value Poisoning (Type Mismatch)**
   - *Attack*: Trying to write `fromAmount` as a boolean `true` or a huge 1MB string to crash parsing models.
   - *Expectation*: `PERMISSION_DENIED`
8. **Forwarded History Injection (Temporal Fraud)**
   - *Attack*: Trying to save a transaction with an ancient `createdAt` timestamp.
   - *Expectation*: `PERMISSION_DENIED`
9. **Transaction Detail Corruption**
   - *Attack*: Trying to update `fromToken` or `fromAmount` of an existing logged transaction.
   - *Expectation*: `PERMISSION_DENIED` (only `status` and `updatedAt` are alterable)
10. **Malicious Enum Injection**
    - *Attack*: Setting `type` to `"steal_funds"` or `status` to `"hacked"`.
    - *Expectation*: `PERMISSION_DENIED`
11. **Orphaned Writes**
    - *Attack*: Attempting to create a transaction where `fromAmount` is negative or NaN.
    - *Expectation*: `PERMISSION_DENIED`
12. **Out of bounds string ID poisoning**
    - *Attack*: Creating a transaction with a hash ID that has invalid characters like slashes, commas, or quotes.
    - *Expectation*: `PERMISSION_DENIED`

---

## 3. Access Matrix

| Collection | Document ID | Read (Get) | Read (List) | Create | Update | Delete |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `users` | `{userId}` | Owner Only | Blocked | Owner Only | Owner Only | Blocked |
| `transactions` | `{txId}` | Owner Only | Owner Only (Query-enforced) | Owner Only | Owner Only | Blocked |
