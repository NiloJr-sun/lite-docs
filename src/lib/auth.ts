/**
 * Simulated authentication.
 *
 * There is no real backend here — credentials are checked against a small set
 * of seeded accounts. The returned `User` never contains the password.
 */

export interface User {
  id: string;
  email: string;
  name: string;
}

interface SeedAccount extends User {
  password: string;
}

/** Hard-coded test accounts. Both use the password `password123`. */
export const SEED_ACCOUNTS: readonly SeedAccount[] = [
  {
    id: "1",
    email: "alice@example.com",
    name: "Alice Anderson",
    password: "password123",
  },
  {
    id: "2",
    email: "bob@example.com",
    name: "Bob Brown",
    password: "password123",
  },
];

/**
 * Validate credentials against the seeded accounts.
 *
 * @returns the matching `User` (without password), or `null` if the email /
 * password combination is invalid.
 */
export function authenticate(email: string, password: string): User | null {
  const normalizedEmail = email.trim().toLowerCase();
  const match = SEED_ACCOUNTS.find(
    (account) =>
      account.email.toLowerCase() === normalizedEmail &&
      account.password === password,
  );

  if (!match) {
    return null;
  }

  return { id: match.id, email: match.email, name: match.name };
}
