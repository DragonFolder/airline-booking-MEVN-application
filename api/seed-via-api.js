/**
 * seed-via-api.js
 *
 * Populates the airline-booking database by calling the ALREADY RUNNING
 * HTTP API (not by touching MongoDB directly). Every record goes through
 * the real Express routes, so all controller logic and schema validation
 * runs exactly as it would for a real client.
 *
 *   - Talks only HTTP -- it does NOT need MONGODB_STRING or JWT_SECRET_KEY.
 *     (The API process needs those; this script just needs the API online.)
 *   - Registers users      -> POST /auth/register
 *   - Logs them in         -> POST /auth/login        (returns { access })
 *   - Creates flights      -> POST /flights           (ADMIN token required)
 *   - Creates bookings     -> POST /bookings          (any user token)
 *
 * ABOUT THE ADMIN:
 *   POST /auth/register can only ever create role:"user" -- there is no
 *   HTTP endpoint that mints an admin. Flight creation is admin-only, so
 *   to seed flights you must supply credentials for an admin that ALREADY
 *   exists (ADMIN_EMAIL / ADMIN_PASSWORD). If you don't, the script skips
 *   flight creation and seeds bookings against whatever flights already
 *   exist in the database.
 *
 * USAGE:
 *   1. Start the API first (in the /api folder):  npm start  (or nodemon)
 *   2. Optionally put config in  api/.env  (see CONFIG block below).
 *   3. Double-click  seed-via-api.bat   (Windows)
 *      OR run        node seed-via-api.js
 */

// dotenv is already an API dependency -- lets users put config in api/.env.
try { require('dotenv').config(); } catch { /* dotenv optional */ }

// Global fetch ships with Node 18+. Express 5 / Mongoose 9 already require
// a modern Node, but fail loudly if someone runs this on an old one.
if (typeof fetch === 'undefined') {
	console.error('ERROR: global fetch is not available. Use Node 18 or newer.');
	process.exit(1);
}

// =========================================================================
// CONFIG  --  override any of these via api/.env or the shell environment
// =========================================================================

// Where the running API is reachable. api/index.js listens on
// process.env.PORT || 3000, so set API_BASE to match how you started it.
const API_BASE = process.env.API_BASE || 'http://localhost:4000';

// Credentials for an EXISTING admin account (needed to create flights).
// Leave unset to skip flight creation and only seed bookings against
// flights that already exist.
const ADMIN_EMAIL    = process.env.ADMIN_EMAIL    || '';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';

// Shared password for every generated user. Must be >= 8 chars (User
// schema enforces minlength 8).
const USER_PASSWORD = process.env.USER_PASSWORD || 'Password123!';

// Volume.
const NUM_USERS    = Number(process.env.NUM_USERS    || 15);
const NUM_FLIGHTS  = Number(process.env.NUM_FLIGHTS  || 30);
const NUM_BOOKINGS = Number(process.env.NUM_BOOKINGS || 40);

// Departure window (YYYY-MM-DD). START_DATE must be in the future, because
// the Flight schema validates departure_time > now.
const START_DATE = process.env.START_DATE || '2026-06-01';
const END_DATE   = process.env.END_DATE   || '2026-07-01';

// =========================================================================
// REFERENCE DATA  --  small baked-in tables so the script runs offline
// =========================================================================

const AIRLINES = [
	{ code: 'PR', name: 'Philippine Airlines' },
	{ code: '5J', name: 'Cebu Pacific'        },
	{ code: 'SQ', name: 'Singapore Airlines'  },
	{ code: 'JL', name: 'Japan Airlines'      },
	{ code: 'KE', name: 'Korean Air'          },
	{ code: 'CX', name: 'Cathay Pacific'      },
	{ code: 'EK', name: 'Emirates'            },
];

const AIRPORTS = {
	MNL: 'Manila',     CEB: 'Cebu',        DVO: 'Davao',
	ILO: 'Iloilo',     NRT: 'Tokyo',       ICN: 'Seoul',
	HKG: 'Hong Kong',  SIN: 'Singapore',   BKK: 'Bangkok',
	DXB: 'Dubai',      LAX: 'Los Angeles',
};

// [origin, destination, durationMinutes]
const ROUTES = [
	['MNL', 'CEB',  85], ['MNL', 'DVO', 105], ['MNL', 'ILO',  75],
	['CEB', 'DVO',  60], ['MNL', 'NRT', 240], ['MNL', 'ICN', 230],
	['MNL', 'HKG', 130], ['MNL', 'SIN', 215], ['MNL', 'BKK', 200],
	['MNL', 'DXB', 580], ['MNL', 'LAX', 800],
];

const FIRST_NAMES = [
	'Juan', 'Maria', 'Jose', 'Sofia', 'Liam', 'Olivia', 'Noah', 'Emma',
	'Hiroshi', 'Sakura', 'Minjun', 'Jiwoo', 'Wei', 'Mei', 'Aarav', 'Priya',
];

const LAST_NAMES = [
	'Santos', 'Reyes', 'Cruz', 'Garcia', 'Mendoza', 'Smith', 'Johnson',
	'Tanaka', 'Suzuki', 'Kim', 'Park', 'Lee', 'Chen', 'Patel', 'Nguyen',
];

// =========================================================================
// SMALL HELPERS
// =========================================================================

const randInt    = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randChoice = (arr)      => arr[Math.floor(Math.random() * arr.length)];
const randFloat  = (min, max) => Math.random() * (max - min) + min;

function randCabinClass() {
	const r = Math.random();
	if (r < 0.80) return 'Economy';
	if (r < 0.95) return 'Business';
	return 'First';
}

// Random Date between two Dates (inclusive).
function randDateBetween(startDate, endDate) {
	return new Date(randInt(startDate.getTime(), endDate.getTime()));
}

// Past DOB so the passenger is 18-75 years old (schema needs DOB in past).
function randDOB() {
	const now      = Date.now();
	const minAgeMs = 18 * 365.25 * 24 * 3600 * 1000;
	const maxAgeMs = 75 * 365.25 * 24 * 3600 * 1000;
	return new Date(now - randInt(minAgeMs, maxAgeMs));
}

// Thin wrapper around fetch: always sends/parses JSON, attaches a bearer
// token when given, and returns { status, body } without throwing on
// non-2xx (callers decide what a failure means).
async function apiCall(method, path, { body, token } = {}) {
	const headers = { 'Content-Type': 'application/json' };
	if (token) headers.Authorization = `Bearer ${token}`;

	let res;
	try {
		res = await fetch(`${API_BASE}${path}`, {
			method,
			headers,
			body: body ? JSON.stringify(body) : undefined,
		});
	} catch (err) {
		// Network-level failure (API not running, wrong port, etc.)
		throw new Error(
			`Cannot reach the API at ${API_BASE}${path}\n` +
			`  ${err.message}\n` +
			`  Is the API running? Does API_BASE match its port ` +
			`(api/index.js uses PORT || 3000)?`
		);
	}

	// Most endpoints return JSON; a few send plain text on errors.
	const raw = await res.text();
	let parsed;
	try { parsed = raw ? JSON.parse(raw) : {}; } catch { parsed = raw; }

	return { status: res.status, body: parsed };
}

// =========================================================================
// STEPS
// =========================================================================

// Confirm the API is up before doing anything else. GET /flights needs no
// auth and always returns an array, so it doubles as a health check.
async function healthCheck() {
	const { status, body } = await apiCall('GET', '/flights');
	if (status !== 200 || !Array.isArray(body)) {
		throw new Error(
			`API health check failed (GET /flights -> ${status}). ` +
			`Expected 200 with an array.`
		);
	}
	console.log(`API reachable at ${API_BASE} (currently ${body.length} flights).\n`);
}

// Register NUM_USERS users and log each one in. Returns an array of
// { email, token }. A 409 (email already exists) is fine -- we just log
// that user in instead of recreating them.
async function seedUsers() {
	console.log(`Registering + logging in ${NUM_USERS} users...`);
	const users     = [];
	const seenEmail = new Set();

	for (let i = 0; i < NUM_USERS; i++) {
		const first = randChoice(FIRST_NAMES);
		const last  = randChoice(LAST_NAMES);

		let email = `${first}.${last}.${i}@example.com`.toLowerCase();
		while (seenEmail.has(email)) email = `user${i}.${randInt(0, 9999)}@example.com`;
		seenEmail.add(email);

		const reg = await apiCall('POST', '/auth/register', {
			body: { full_name: `${first} ${last}`, email, password: USER_PASSWORD },
		});

		// 201 = created, 409 = already exists (both are usable).
		if (reg.status !== 201 && reg.status !== 409) {
			console.log(`  ! register failed for ${email} (${reg.status}) -- skipping`);
			continue;
		}

		const login = await apiCall('POST', '/auth/login', {
			body: { email, password: USER_PASSWORD },
		});
		if (login.status !== 200 || !login.body || !login.body.data || !login.body.data.access) {
			console.log(`  ! login failed for ${email} (${login.status}) -- skipping`);
			continue;
		}

		users.push({ email, token: login.body.data.access });
	}

	console.log(`  got ${users.length} usable user tokens\n`);
	return users;
}

// Log in an existing admin (if creds were supplied) and return the token,
// or null if no admin is available. Never throws -- a missing admin just
// means "skip flight creation".
async function getAdminToken() {
	if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
		console.log(
			'No ADMIN_EMAIL / ADMIN_PASSWORD set -- skipping flight creation.\n' +
			'  (POST /auth/register cannot create admins. To seed flights, set\n' +
			'   ADMIN_EMAIL/ADMIN_PASSWORD for an existing admin in api/.env, or\n' +
			'   promote a user to role:"admin" in MongoDB, then re-run.)\n'
		);
		return null;
	}

	const login = await apiCall('POST', '/auth/login', {
		body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
	});
	if (login.status !== 200 || !login.body || !login.body.data || !login.body.data.access) {
		console.log(
			`Admin login failed for ${ADMIN_EMAIL} (${login.status}) -- ` +
			`skipping flight creation.\n`
		);
		return null;
	}

	console.log(`Admin logged in as ${ADMIN_EMAIL}.\n`);
	return login.body.data.access;
}

// Create NUM_FLIGHTS flights via the admin-only endpoint. The controller
// forces seats:[] on creation, so we send total/available seat COUNTS only
// (no seat subdocuments). Retries once on a 409 duplicate flight_number.
async function seedFlights(adminToken) {
	if (!adminToken) return 0;

	const start = new Date(START_DATE + 'T00:00:00');
	const end   = new Date(END_DATE   + 'T23:59:59');

	console.log(`Creating ${NUM_FLIGHTS} flights...`);
	let created = 0;

	for (let i = 0; i < NUM_FLIGHTS; i++) {
		const [a, b, duration] = randChoice(ROUTES);
		const reversed    = Math.random() < 0.5;
		const origin      = reversed ? b : a;
		const destination = reversed ? a : b;

		const airline    = randChoice(AIRLINES);
		const cabinClass  = randCabinClass();
		const totalSeats  = randInt(120, 280);

		const dep = randDateBetween(start, end);
		dep.setHours(randInt(5, 22), randInt(0, 59), 0, 0);
		const arr = new Date(dep.getTime() + duration * 60 * 1000);

		const basePrice = duration * 0.10;
		const mult      = cabinClass === 'First' ? 5 : cabinClass === 'Business' ? 3 : 1;
		const price     = Math.round(basePrice * mult * randFloat(0.85, 1.2) * 100) / 100;

		// Build the body fresh each attempt so a retry gets a new number.
		const makeBody = () => ({
			flight_number:    `${airline.code}${randInt(100, 9999)}`,
			airline:          airline.name,
			origin_code:      origin,
			origin_city:      AIRPORTS[origin],
			destination_code: destination,
			destination_city: AIRPORTS[destination],
			departure_time:   dep.toISOString(),
			arrival_time:     arr.toISOString(),
			duration_minutes: duration,
			stops:            duration > 500 && Math.random() < 0.4 ? 1 : 0,
			cabin_class:      cabinClass,
			price,
			total_seats:      totalSeats,
			available_seats:  totalSeats,
		});

		let resp = await apiCall('POST', '/flights', { body: makeBody(), token: adminToken });
		if (resp.status === 409) {
			// Duplicate flight_number -- one retry with a fresh number.
			resp = await apiCall('POST', '/flights', { body: makeBody(), token: adminToken });
		}

		if (resp.status === 201) {
			created++;
		} else {
			const msg = resp.body && (resp.body.message || resp.body.errors || resp.body.error);
			console.log(`  ! flight ${i} failed (${resp.status}): ${JSON.stringify(msg)}`);
		}
	}

	console.log(`  created ${created} flights\n`);
	return created;
}

// Fetch all flight IDs currently in the system (GET /flights returns the
// raw array). Used so bookings can target real flights even when this run
// didn't create any.
async function getFlightIds() {
	const { status, body } = await apiCall('GET', '/flights');
	if (status !== 200 || !Array.isArray(body)) return [];
	return body
		.filter(f => f && f.status !== 'cancelled')
		.map(f => f._id)
		.filter(Boolean);
}

// Create NUM_BOOKINGS bookings: each is a random user booking a random
// flight. We deliberately omit seat_number -- flights created over the API
// have an empty seats[] array, so any seat_number would be rejected as
// "Invalid seat number". seat_number is optional in createNewBooking.
async function seedBookings(users, flightIds) {
	if (users.length === 0) {
		console.log('No user tokens -- skipping bookings.\n');
		return 0;
	}
	if (flightIds.length === 0) {
		console.log(
			'No flights available -- skipping bookings.\n' +
			'  (Seed flights first: supply admin creds, or create flights another way.)\n'
		);
		return 0;
	}

	console.log(`Creating ${NUM_BOOKINGS} bookings...`);
	let created = 0;

	for (let i = 0; i < NUM_BOOKINGS; i++) {
		const user   = randChoice(users);
		const flight = randChoice(flightIds);

		const resp = await apiCall('POST', '/bookings', {
			token: user.token,
			body: {
				flight_id:       flight,
				first_name:      randChoice(FIRST_NAMES),
				last_name:       randChoice(LAST_NAMES),
				date_of_birth:   randDOB().toISOString(),
				passport_number: 'P' + String(randInt(0, 99999999)).padStart(8, '0'),
			},
		});

		if (resp.status === 201) {
			created++;
		} else {
			const msg = resp.body && (resp.body.message ||
				(resp.body.error && resp.body.error.message) || resp.body.error);
			console.log(`  ! booking ${i} failed (${resp.status}): ${JSON.stringify(msg)}`);
		}
	}

	console.log(`  created ${created} bookings\n`);
	return created;
}

// =========================================================================
// MAIN
// =========================================================================

async function main() {
	const start = new Date(START_DATE + 'T00:00:00');
	const end   = new Date(END_DATE   + 'T23:59:59');
	if (isNaN(start) || isNaN(end)) throw new Error('START_DATE / END_DATE must be YYYY-MM-DD.');
	if (start > end)                throw new Error('START_DATE must be on or before END_DATE.');
	if (start <= new Date())        throw new Error('START_DATE must be in the future.');

	await healthCheck();

	const users      = await seedUsers();
	const adminToken = await getAdminToken();
	const flights    = await seedFlights(adminToken);
	const flightIds  = await getFlightIds();
	const bookings   = await seedBookings(users, flightIds);

	console.log('Done.');
	console.log(`  users seeded:        ${users.length}`);
	console.log(`  flights created:     ${flights}`);
	console.log(`  flights in system:   ${flightIds.length}`);
	console.log(`  bookings created:    ${bookings}`);
}

main().catch(err => {
	console.error('\nERROR:', err.message);
	process.exitCode = 1;
});
