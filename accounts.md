# Demo Accounts

These accounts are created automatically by the database seeder
(`api/seed-data.js`). Use them to log in and try the app.

| Role  | Email            | Password   | What it's for                                  |
| ----- | ---------------- | ---------- | ---------------------------------------------- |
| User  | `user@mail.com`  | `user123`  | Regular customer — search, book, and pay.      |
| Admin | `admin@mail.com` | `admin123` | Admin — access to the admin-only API routes.   |

## Notes

- These two accounts are **always** recreated whenever the seed runs, so the
  credentials above are stable across reseeds.
- The seeder also generates ~28 random demo users (with realistic names and
  `@example.com` emails). They all share the password **`Password123!`**, but
  their emails are randomized each reseed, so they aren't meant to be logged
  into directly.
- Passwords are stored hashed (bcrypt); the plaintext values above are only
  what you type at the login screen.

## Reseeding

To (re)create these accounts and the flight/booking data, run the seeder from
the `api/` folder:

```bash
node seed-data.js
```

or double-click `api/seed-data.bat` on Windows. This wipes and repopulates the
Users, Flights, and Bookings collections.
