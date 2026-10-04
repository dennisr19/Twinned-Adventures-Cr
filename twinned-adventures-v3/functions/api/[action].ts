interface Env {
	SANITY_PROJECT_ID: string;
	SANITY_DATASET: string;
	SANITY_API_TOKEN: string;
	TURNSTILE_SECRET_KEY: string;
	ADMIN_WEBHOOK_URL?: string;
}
interface Context {
	request: Request;
	env: Env;
	params: { action: string };
	waitUntil: (promise: Promise<unknown>) => void;
}
const reply = (data: unknown, status = 200) =>
	new Response(JSON.stringify(data), {
		status,
		headers: {
			"Content-Type": "application/json",
			"Cache-Control": "no-store",
			"X-Content-Type-Options": "nosniff",
		},
	});
const text = (data: Record<string, unknown>, key: string, max = 200) =>
	typeof data[key] === "string"
		? (data[key] as string).trim().slice(0, max)
		: "";
const emailOK = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
async function query(env: Env, q: string, params: Record<string, string>) {
	const u = new URL(
		`https://${env.SANITY_PROJECT_ID}.api.sanity.io/v2025-02-19/data/query/${env.SANITY_DATASET}`,
	);
	u.searchParams.set("query", q);
	for (const [k, v] of Object.entries(params))
		u.searchParams.set("$" + k, JSON.stringify(v));
	const r = await fetch(u, {
		headers: { Authorization: `Bearer ${env.SANITY_API_TOKEN}` },
	});
	if (!r.ok) throw new Error("STORAGE_UNAVAILABLE");
	return ((await r.json()) as { result: any }).result;
}
export async function onRequestPost({
	request,
	env,
	params,
	waitUntil,
}: Context) {
	try {
		const action = params.action;
		if (
			!["booking", "tracking", "review", "inquiry", "contact"].includes(action)
		)
			return reply({ error: "NOT_FOUND" }, 404);
		const origin = request.headers.get("Origin");
		if (!origin || origin !== new URL(request.url).origin)
			return reply({ error: "FORBIDDEN" }, 403);
		if (!request.headers.get("Content-Type")?.startsWith("application/json"))
			return reply({ error: "BAD_REQUEST" }, 400);
		if (Number(request.headers.get("Content-Length") || 0) > 16000)
			return reply({ error: "TOO_LARGE" }, 413);
		const raw = await request.text();
		if (raw.length > 16000) return reply({ error: "TOO_LARGE" }, 413);
		let data: Record<string, unknown>;
		try {
			data = JSON.parse(raw);
		} catch {
			return reply({ error: "BAD_REQUEST" }, 400);
		}
		if (!data || Array.isArray(data) || typeof data !== "object")
			return reply({ error: "BAD_REQUEST" }, 400);
		if (text(data, "website")) return reply({ error: "BAD_REQUEST" }, 400);
		if (
			!env.SANITY_PROJECT_ID ||
			!env.SANITY_API_TOKEN ||
			!env.SANITY_DATASET ||
			!env.TURNSTILE_SECRET_KEY
		)
			return reply({ error: "SERVICE_UNAVAILABLE" }, 503);
		const token = text(data, "cf-turnstile-response", 4000);
		if (!token) return reply({ error: "CAPTCHA_REQUIRED" }, 400);
		const verified = await fetch(
			"https://challenges.cloudflare.com/turnstile/v0/siteverify",
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					secret: env.TURNSTILE_SECRET_KEY,
					response: token,
					remoteip: request.headers.get("CF-Connecting-IP"),
				}),
			},
		);
		const check = (await verified.json()) as {
			success: boolean;
			hostname?: string;
		};
		if (!check.success || check.hostname !== new URL(request.url).hostname)
			return reply({ error: "CAPTCHA_FAILED" }, 400);
		const email = text(data, "email").toLowerCase();
		if (!emailOK(email)) return reply({ error: "INVALID_EMAIL" }, 400);
		const code = text(data, "code").toUpperCase();
		if (action === "tracking") {
			const booking = await query(
				env,
				'*[_type=="booking" && code==$code && email==$email][0]{status}',
				{ code, email },
			);
			return booking
				? reply({ status: booking.status })
				: reply({ error: "NOT_FOUND" }, 404);
		}
		if (data.consent !== "on") return reply({ error: "CONSENT_REQUIRED" }, 400);
		const name = text(data, "name");
		if (name.length < 2) return reply({ error: "INVALID_NAME" }, 400);
		const document: Record<string, unknown> = {
			_id: crypto.randomUUID(),
			_type:
				action === "review"
					? "reviewSubmission"
					: action === "booking"
						? "booking"
						: "inquiry",
			name,
			email,
			lang: data.lang === "en" ? "en" : "es",
			createdAt: new Date().toISOString(),
			consentAt: new Date().toISOString(),
			message: text(data, "message", 2000),
		};
		if (action === "booking") {
			const adults = Number(data.adults),
				minors = Number(data.minors);
			const date = text(data, "date");
			if (
				!Number.isInteger(adults) ||
				adults < 1 ||
				adults > 50 ||
				!Number.isInteger(minors) ||
				minors < 0 ||
				minors > 50 ||
				adults + minors > 50
			)
				return reply({ error: "INVALID_PARTICIPANTS" }, 400);
			const parsed = new Date(date + "T00:00:00Z");
			if (
				!/^\d{4}-\d{2}-\d{2}$/.test(date) ||
				!Number.isFinite(parsed.getTime()) ||
				parsed.toISOString().slice(0, 10) !== date
			)
				return reply({ error: "INVALID_DATE" }, 400);
			const today = new Intl.DateTimeFormat("en-CA", {
				timeZone: "America/Costa_Rica",
				year: "numeric",
				month: "2-digit",
				day: "2-digit",
			}).format(new Date());
			if (date < today) return reply({ error: "INVALID_DATE" }, 400);
			for (const key of ["phone", "country", "time", "ages"])
				if (!text(data, key)) return reply({ error: "MISSING_FIELD" }, 400);
			const pricing = await query(env, '*[_type=="tour"][0]{price}', {});
			Object.assign(document, {
				code:
					"TA-" +
					crypto.randomUUID().replaceAll("-", "").slice(0, 16).toUpperCase(),
				status: "received",
				date,
				adults,
				minors,
				pricePerPerson:
					typeof pricing?.price === "number" ? pricing.price : 100,
				currency: "USD",
			});
			for (const key of ["phone", "country", "time", "ages", "pickup", "needs"])
				document[key] = text(data, key, key === "needs" ? 2000 : 200);
		} else if (action === "review") {
			const rating = Number(data.rating);
			if (
				!Number.isInteger(rating) ||
				rating < 1 ||
				rating > 5 ||
				!document.message ||
				!code
			)
				return reply({ error: "INVALID_REVIEW" }, 400);
			const booking = await query(
				env,
				'*[_type=="booking" && code==$code && email==$email][0]{_id,status}',
				{ code, email },
			);
			if (!booking || booking.status !== "completed")
				return reply({ error: "NOT_FOUND" }, 404);
			Object.assign(document, {
				rating,
				country: text(data, "country"),
				experienceDate: text(data, "date"),
				booking: { _type: "reference", _ref: booking._id },
				status: "pending",
				verified: false,
			});
		} else {
			if (!document.message) return reply({ error: "MISSING_FIELD" }, 400);
			if (action === "inquiry") {
				const booking = await query(
					env,
					'*[_type=="booking" && code==$code && email==$email][0]{_id}',
					{ code, email },
				);
				if (!booking) return reply({ error: "NOT_FOUND" }, 404);
				document.booking = { _type: "reference", _ref: booking._id };
			}
			document.status = "new";
		}
		const saved = await fetch(
			`https://${env.SANITY_PROJECT_ID}.api.sanity.io/v2025-02-19/data/mutate/${env.SANITY_DATASET}`,
			{
				method: "POST",
				headers: {
					Authorization: `Bearer ${env.SANITY_API_TOKEN}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ mutations: [{ create: document }] }),
			},
		);
		if (!saved.ok) return reply({ error: "STORAGE_UNAVAILABLE" }, 503);
		if (env.ADMIN_WEBHOOK_URL?.startsWith("https://"))
			waitUntil(
				fetch(env.ADMIN_WEBHOOK_URL, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						id: document._id,
						type: document._type,
						createdAt: document.createdAt,
					}),
				})
					.then((r) => {
						if (!r.ok) console.error("Notification delivery failed", r.status);
					})
					.catch(() => console.error("Notification delivery failed")),
			);
		return reply(
			action === "booking"
				? { code: document.code, status: "received" }
				: { received: true },
			201,
		);
	} catch {
		return reply({ error: "SERVICE_UNAVAILABLE" }, 503);
	}
}
export const onRequestGet = () => reply({ error: "METHOD_NOT_ALLOWED" }, 405);
