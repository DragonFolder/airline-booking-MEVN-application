/**
 * seed-data.js
 *
 * Populates the airline-booking MongoDB database with realistic-looking
 * fictional data for Users, Flights, and Bookings.
 *
 *   - Connects using MONGODB_STRING from the local .env file.
 *   - Uses the Mongoose models in /models so all schema validation runs.
 *   - Generates data from baked-in reference tables (no external API needed).
 *
 * USAGE:
 *   1. Edit the CONFIG block below if you want a different date range,
 *      different volume, or to switch between wipe-and-replace vs append.
 *   2. Double-click  seed-data.bat   (Windows)
 *      OR run        node seed-data.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const { nanoid } = require('nanoid');

const User    = require('./models/User');
const Flight  = require('./models/Flight');
const Booking = require('./models/Booking');

// =========================================================================
// CONFIG  --  edit these to control what gets generated
// =========================================================================

// Date window for flight departures (YYYY-MM-DD).  START_DATE must be in
// the future, because the Flight schema validates departure_time > now.
const START_DATE      = '2026-06-09';
const END_DATE        = '2026-09-01';

// Volume.  FLIGHTS_PER_ROUTE_PER_DAY controls how many flights each route
// gets per direction, per day.  Because every route is covered every day,
// a "from + to + exact date" search (which the web form always sends) is
// guaranteed to return results.  At 2 this is ~9k flights over the default
// date range — still only a few MB on a MongoDB Atlas free (M0) cluster.
// Lower it to 1 for a lighter dataset.
const FLIGHTS_PER_ROUTE_PER_DAY = 2;
const NUM_USERS                 = 30;
const NUM_BOOKINGS              = 150;

// true  => wipe Users / Flights / Bookings collections before inserting
// false => keep what's already there and add on top
const WIPE_EXISTING   = true;

// =========================================================================
// REFERENCE DATA  --  baked-in tables so the script runs offline
// =========================================================================

// Real airlines + IATA codes.  Mix of Philippine carriers and big
// international ones the demo's PH user base would recognize.
const AIRLINES = [
	{ code: 'PR', name: 'Philippine Airlines'   },
	{ code: '5J', name: 'Cebu Pacific'          },
	{ code: 'Z2', name: 'AirAsia Philippines'   },
	{ code: '2P', name: 'PAL Express'           },
	{ code: 'SQ', name: 'Singapore Airlines'    },
	{ code: 'NH', name: 'ANA'                   },
	{ code: 'JL', name: 'Japan Airlines'        },
	{ code: 'KE', name: 'Korean Air'            },
	{ code: 'CX', name: 'Cathay Pacific'        },
	{ code: 'EK', name: 'Emirates'              },
	{ code: 'QR', name: 'Qatar Airways'         },
	{ code: 'TG', name: 'Thai Airways'          },
	{ code: 'BR', name: 'EVA Air'               },
	{ code: 'UA', name: 'United Airlines'       },
];

// IATA airport code => city name.  Heavy Philippine bias.
const AIRPORTS = {
	// Philippines (domestic)
	MNL: 'Manila',           CEB: 'Cebu',         DVO: 'Davao',
	ILO: 'Iloilo',           KLO: 'Kalibo',       PPS: 'Puerto Princesa',
	BCD: 'Bacolod',          ZAM: 'Zamboanga',    GES: 'General Santos',
	CGY: 'Cagayan de Oro',   TAG: 'Tagbilaran',
	// International (top routes for PH travellers)
	NRT: 'Tokyo',            ICN: 'Seoul',        HKG: 'Hong Kong',
	SIN: 'Singapore',        KUL: 'Kuala Lumpur', BKK: 'Bangkok',
	TPE: 'Taipei',           DXB: 'Dubai',        LAX: 'Los Angeles',
	SFO: 'San Francisco',    JFK: 'New York',     YVR: 'Vancouver',
	SYD: 'Sydney',
};

// [origin, destination, durationMinutes].  Direction-agnostic — the
// generator randomly reverses each pick, so reverse routes are also created
// (which gives the round-trip variety the demo wants).
const ROUTES = [
	// Domestic Philippines -- the bulk of the data
	['MNL','CEB',  85], ['MNL','DVO', 105], ['MNL','ILO',  75],
	['MNL','KLO',  60], ['MNL','PPS',  80], ['MNL','BCD',  70],
	['MNL','ZAM', 110], ['MNL','GES', 110], ['MNL','CGY',  95],
	['MNL','TAG',  90], ['CEB','DVO',  60], ['CEB','CGY',  50],
	['CEB','ILO',  45],
	// PH <-> Asia
	['MNL','NRT', 240], ['MNL','ICN', 230], ['MNL','HKG', 130],
	['MNL','SIN', 215], ['MNL','KUL', 220], ['MNL','BKK', 200],
	['MNL','TPE', 130], ['CEB','NRT', 290], ['CEB','HKG', 175],
	['CEB','SIN', 230],
	// PH <-> long haul
	['MNL','DXB', 580], ['MNL','LAX', 800], ['MNL','SFO', 770],
	['MNL','SYD', 540], ['MNL','YVR', 820],
];

const FIRST_NAMES = [
	'Juan','Maria','Jose','Andres','Emilio','Antonio','Gabriela','Sofia',
	'Isabel','Liza','Carlos','Miguel','Angelo','Paolo','Cristina','Diana',
	'Liam','Olivia','Noah','Emma','Aiden','Ava','Lucas','Mia',
	'Hiroshi','Sakura','Minjun','Jiwoo','Wei','Mei','Aarav','Priya',
];

const LAST_NAMES = [
	'Santos','Reyes','Cruz','Bautista','Garcia','Mendoza','Torres','Castillo',
	'Ramos','Aquino','DelaCruz','Lopez','Hernandez','Flores','Gonzales',
	'Smith','Johnson','Williams','Brown','Jones','Tanaka','Suzuki','Kim',
	'Park','Lee','Chen','Wang','Patel','Khan','Nguyen',
];

// =========================================================================
// SMALL HELPERS
// =========================================================================

const SEAT_COLS_NARROW = ['A','B','C','D','E','F'];               // 3-3
const SEAT_COLS_WIDE   = ['A','B','C','D','E','F','G','H','J'];   // 3-3-3

const randInt    = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randChoice = (arr)      => arr[Math.floor(Math.random() * arr.length)];
const randFloat  = (min, max) => Math.random() * (max - min) + min;

// Pick a flight cabin class with a realistic distribution.
function randCabinClass() {
	const r = Math.random();
	if (r < 0.80) return 'Economy';
	if (r < 0.95) return 'Business';
	return 'First';
}

// "PR1234" — airline code + 3-4 digit flight number.
function makeFlightNumber(airlineCode) {
	return `${airlineCode}${randInt(100, 9999)}`;
}

// Build the embedded seats[] array.  Layout depends on duration (long-haul
// gets a wide-body 3-3-3) and on cabin class (premium cabins are smaller).
function makeSeats(durationMinutes, cabinClass) {
	const wide    = durationMinutes > 300;
	const columns = wide ? SEAT_COLS_WIDE : SEAT_COLS_NARROW;

	let rowCount;
	if      (cabinClass === 'First')    rowCount = wide ? 4  : 3;
	else if (cabinClass === 'Business') rowCount = wide ? 8  : 6;
	else /* Economy */                  rowCount = wide ? 30 : 25;

	const seats = [];
	for (let row = 1; row <= rowCount; row++) {
		for (const col of columns) {
			seats.push({
				seat_number: `${row}${col}`,
				row,
				column:      col,
				class:       cabinClass,
				status:      'available',
			});
		}
	}
	return seats;
}

// Approximate Philippine Peso fare: a fixed base fare plus a per-minute
// rate, scaled by cabin class, with random jitter so two flights on the
// same route aren't identically priced.  Rounded to the nearest whole peso.
function makePrice(durationMinutes, cabinClass) {
	const BASE_FARE  = 1500;   // ₱ fixed component (taxes/surcharges-ish)
	const PER_MINUTE = 45;     // ₱ per minute of flight time
	const base       = BASE_FARE + durationMinutes * PER_MINUTE;
	const multiplier = cabinClass === 'First'    ? 5
	                 : cabinClass === 'Business' ? 3
	                 : 1;
	const jitter     = randFloat(0.85, 1.20);
	return Math.round(base * multiplier * jitter);
}

// Random Date between two Dates (inclusive).
function randDateBetween(startDate, endDate) {
	return new Date(randInt(startDate.getTime(), endDate.getTime()));
}

// Random past DOB so the passenger is between 18 and 75 years old.
function randDOB() {
	const now      = Date.now();
	const minAgeMs = 18 * 365.25 * 24 * 3600 * 1000;
	const maxAgeMs = 75 * 365.25 * 24 * 3600 * 1000;
	return new Date(now - randInt(minAgeMs, maxAgeMs));
}

// "SKY-AB12CD34" — matches the format the live API produces in
// controllers/booking.js: `SKY-${nanoid(8).toUpperCase()}`.
// (Caller still de-duplicates against an in-memory Set.)
function makeBookingRef() {
	return `SKY-${nanoid(8).toUpperCase()}`;
}

// =========================================================================
// GENERATORS
// =========================================================================

// Build N user objects ready for User.insertMany.
async function buildUsers(count) {
	// Pre-hash one shared password — bcrypt is slow, no need to hash N times.
	// Demo password: "Password123!"
	const passwordHash = await bcrypt.hash('Password123!', 10);

	const users      = [];
	const seenEmails = new Set();

	// Two fixed, known-credential accounts so the app is always easy to log
	// into — a regular user and an admin.  Passwords are bcrypt-hashed (login
	// uses bcrypt.compare), so the short plaintext is fine: the schema's
	// minlength applies to the stored hash, not the plaintext.
	const FIXED_ACCOUNTS = [
		{ full_name: 'Demo User',  email: 'user@mail.com',  password: 'user123',  role: 'user'  },
		{ full_name: 'Demo Admin', email: 'admin@mail.com', password: 'admin123', role: 'admin' },
	];
	for (const acct of FIXED_ACCOUNTS) {
		users.push({
			full_name:     acct.full_name,
			email:         acct.email,
			password_hash: await bcrypt.hash(acct.password, 10),
			role:          acct.role,
		});
		seenEmails.add(acct.email);
	}

	// Fill the remainder with random users so the total stays `count`.
	for (let i = users.length; i < count; i++) {
		const first = randChoice(FIRST_NAMES);
		const last  = randChoice(LAST_NAMES);

		// Suffix the index so emails stay unique even when names collide.
		let email = `${first}.${last}.${i}@example.com`.toLowerCase();
		while (seenEmails.has(email)) {
			email = `${first}${i}${randInt(0, 9999)}@example.com`.toLowerCase();
		}
		seenEmails.add(email);

		users.push({
			full_name:     `${first} ${last}`,
			email,
			password_hash: passwordHash,
			// ~10% admins so the demo has a mix of roles.
			role: Math.random() < 0.10 ? 'admin' : 'user',
		});
	}
	return users;
}

// Returns a `buildDayFlights(dayStart, perRoutePerDay)` function that builds
// all flights for a SINGLE day.  The full multi-month set is far too large to
// hold in memory at once (it OOMs Node), so the caller inserts one day at a
// time instead of building everything up front.
//
// Every route is generated in BOTH directions, every day, `perRoutePerDay`
// times each.  Full daily coverage means a "from + to + exact date" search
// (which the web form always requires) reliably returns results instead of
// hitting an empty route/date combination.  The unique-flight-number state is
// kept in the closure so it persists across days.
function createFlightBuilder() {
	// flight_number is `unique` in the schema, so keep regenerating until we
	// get one we haven't used yet (mirrors the email / booking-ref dedup).
	const seenFlightNumbers = new Set();
	const uniqueFlightNumber = (airlineCode) => {
		let fn = makeFlightNumber(airlineCode);
		while (seenFlightNumbers.has(fn)) fn = makeFlightNumber(airlineCode);
		seenFlightNumbers.add(fn);
		return fn;
	};

	// Build one flight on a given route/day.  Departure hours are set in
	// LOCAL time so they line up with the API's local-day search window.
	const makeFlight = (origin, destination, duration, dayStart) => {
		const airline    = randChoice(AIRLINES);
		const cabinClass = randCabinClass();

		// Departure between 5am and 11pm on this day.
		const dep = new Date(dayStart);
		dep.setHours(randInt(5, 23), randInt(0, 59), 0, 0);
		const arr = new Date(dep.getTime() + duration * 60 * 1000);

		const seats = makeSeats(duration, cabinClass);

		return {
			flight_number:    uniqueFlightNumber(airline.code),
			airline:          airline.name,
			origin_code:      origin,
			origin_city:      AIRPORTS[origin],
			destination_code: destination,
			destination_city: AIRPORTS[destination],
			departure_time:   dep,
			arrival_time:     arr,
			duration_minutes: duration,
			// Long-haul flights occasionally have a stop, short-haul don't.
			stops:            duration > 600 && Math.random() < 0.4 ? 1 : 0,
			cabin_class:      cabinClass,
			price:            makePrice(duration, cabinClass),
			total_seats:      seats.length,
			available_seats:  seats.length,
			// A small fraction get cancelled so the data isn't all-green.
			status:           Math.random() < 0.03 ? 'cancelled' : 'scheduled',
			seats,
		};
	};

	return function buildDayFlights(dayStart, perRoutePerDay) {
		const dayFlights = [];
		for (const [a, b, duration] of ROUTES) {
			// Both directions so outbound and return legs exist every day.
			for (let n = 0; n < perRoutePerDay; n++) {
				dayFlights.push(makeFlight(a, b, duration, dayStart));
				dayFlights.push(makeFlight(b, a, duration, dayStart));
			}
		}
		return dayFlights;
	};
}

// Build N bookings.  Mutates the given flightDocs in-place: when a seat is
// booked it gets marked 'taken' and the flight's available_seats drops by 1.
// Returns the list of booking objects (NOT inserted yet).
function buildBookings(count, userDocs, flightDocs) {
	const bookings  = [];
	const seenRefs  = new Set();

	// Only book on scheduled flights that still have seats.
	const bookable = flightDocs.filter(
		f => f.status === 'scheduled' && f.available_seats > 0
	);
	if (bookable.length === 0) return bookings;

	for (let i = 0; i < count; i++) {
		// Find a flight with a free seat (a few retries, then bail).
		let flight = null;
		for (let tries = 0; tries < 50; tries++) {
			const candidate = randChoice(bookable);
			if (candidate.available_seats > 0) { flight = candidate; break; }
		}
		if (!flight) continue;

		// Take the first available seat on that flight.
		const seat = flight.seats.find(s => s.status === 'available');
		if (!seat) continue;
		seat.status = 'taken';
		flight.available_seats -= 1;

		// Unique booking reference.
		let ref = makeBookingRef();
		while (seenRefs.has(ref)) ref = makeBookingRef();
		seenRefs.add(ref);

		// Vary payment status so the demo has paid / pending / unpaid bookings.
		const r = Math.random();
		let transaction = null;
		if (r < 0.85) {
			transaction = {
				amount:         flight.price,
				card_last_four: String(randInt(0, 9999)).padStart(4, '0'),
				payment_status: 'approved',
				created_at:     new Date(),
			};
		} else if (r < 0.95) {
			transaction = {
				amount:         flight.price,
				card_last_four: String(randInt(0, 9999)).padStart(4, '0'),
				payment_status: 'pending',
				created_at:     new Date(),
			};
		} // else: leave null  -> unpaid booking

		bookings.push({
			booking_reference: ref,
			user_id:           randChoice(userDocs)._id,   // FK -> User
			flight_id:         flight._id,                 // FK -> Flight
			seat_number:       seat.seat_number,
			total_price:       flight.price,
			// API enum is exactly "Pending" | "Confirmed" | "Cancelled".
			status:            transaction && transaction.payment_status === 'approved' ? 'Confirmed' : 'Pending',
			passenger: {
				first_name:      randChoice(FIRST_NAMES),
				last_name:       randChoice(LAST_NAMES),
				date_of_birth:   randDOB(),
				passport_number: 'P' + String(randInt(0, 99999999)).padStart(8, '0'),
			},
			transaction,
		});
	}
	return bookings;
}

// =========================================================================
// MAIN
// =========================================================================

async function main() {
	// Validate the date config up-front -- catches the most common foot-gun
	// (a START_DATE in the past, which the schema validator would reject).
	const start = new Date(START_DATE + 'T00:00:00');
	const end   = new Date(END_DATE   + 'T23:59:59');
	if (isNaN(start) || isNaN(end))   throw new Error('START_DATE / END_DATE must be YYYY-MM-DD strings.');
	if (start > end)                  throw new Error('START_DATE must be on or before END_DATE.');
	if (start <= new Date())          throw new Error('START_DATE must be in the future (Flight schema requires departure_time > now).');

	const uri = process.env.MONGODB_STRING;
	if (!uri) throw new Error('MONGODB_STRING is not set in .env');

	console.log('Connecting to MongoDB...');
	await mongoose.connect(uri);
	// Print the exact database the script is writing to, so it's obvious
	// in Atlas where to look for the data.
	console.log(`Connected.  Writing to database: "${mongoose.connection.name}"\n`);

	if (WIPE_EXISTING) {
		console.log('Wiping Users / Flights / Bookings...');
		await Promise.all([
			User.deleteMany({}),
			Flight.deleteMany({}),
			Booking.deleteMany({}),
		]);
	}

	// 1) Users first -- bookings need their _ids as FKs.
	console.log(`Generating ${NUM_USERS} users...`);
	const userDocs = await User.insertMany(await buildUsers(NUM_USERS));
	console.log(`  inserted ${userDocs.length} users`);

	// 2) Flights next -- inserted ONE DAY AT A TIME so the full multi-month
	//    set never lives in memory all at once (building it all up front
	//    OOMs Node).  We keep only a small random sample of flights around
	//    for booking generation; the rest are GC'd after each day's insert.
	const buildDayFlights = createFlightBuilder();
	const dayMs   = 24 * 3600 * 1000;
	const numDays = Math.floor((end.getTime() - start.getTime()) / dayMs) + 1;

	// Reservoir of scheduled flights kept for bookings (so we don't retain
	// every flight document).  Sized to comfortably cover NUM_BOOKINGS.
	const POOL_CAP    = Math.max(NUM_BOOKINGS * 4, 500);
	const flightPool  = [];
	let   totalFlights  = 0;
	let   scheduledSeen = 0;

	console.log(`Generating flights for ${numDays} days (this can take a moment)...`);
	for (let d = 0; d < numDays; d++) {
		const dayStart = new Date(start.getTime() + d * dayMs);
		const inserted = await Flight.insertMany(buildDayFlights(dayStart, FLIGHTS_PER_ROUTE_PER_DAY));
		totalFlights += inserted.length;

		// Reservoir-sample scheduled flights so bookings spread across the
		// whole date range without holding onto every document.
		for (const f of inserted) {
			if (f.status !== 'scheduled') continue;
			scheduledSeen++;
			if (flightPool.length < POOL_CAP) {
				flightPool.push(f);
			} else {
				const j = Math.floor(Math.random() * scheduledSeen);
				if (j < POOL_CAP) flightPool[j] = f;
			}
		}

		if (d % 10 === 0 || d === numDays - 1) {
			console.log(`  ...${totalFlights} flights inserted (day ${d + 1}/${numDays})`);
		}
	}
	console.log(`  inserted ${totalFlights} flights`);

	// 3) Bookings -- this also mutates the sampled flights (seat status, available_seats).
	console.log(`Generating ${NUM_BOOKINGS} bookings...`);
	const bookings = buildBookings(NUM_BOOKINGS, userDocs, flightPool);
	if (bookings.length > 0) await Booking.insertMany(bookings);
	console.log(`  inserted ${bookings.length} bookings`);

	// 4) Persist the seat updates that buildBookings made on the sampled flights.
	//    bulkWrite is one round-trip vs. ~N saves, which keeps Atlas happy.
	const seatUpdateOps = flightPool
		.filter(f => f.available_seats < f.total_seats)  // only changed flights
		.map(f => ({
			updateOne: {
				filter: { _id: f._id },
				update: { $set: { seats: f.seats, available_seats: f.available_seats } },
			},
		}));
	if (seatUpdateOps.length > 0) {
		console.log(`Updating ${seatUpdateOps.length} flights with seat assignments...`);
		await Flight.bulkWrite(seatUpdateOps);
	}

	// Final counts so the user can see what landed.
	console.log('\nDone.');
	console.log('  Users in DB:    ' + await User.countDocuments());
	console.log('  Flights in DB:  ' + await Flight.countDocuments());
	console.log('  Bookings in DB: ' + await Booking.countDocuments());
}

main()
	.catch(err => { console.error('\nERROR:', err.message); process.exitCode = 1; })
	.finally(async () => { await mongoose.disconnect().catch(() => {}); });
