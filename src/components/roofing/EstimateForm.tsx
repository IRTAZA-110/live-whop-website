import { useState } from "react";
import { COMPANY_CONFIG } from "../../config/company";
import {
	type EstimateLeadResult,
	submitEstimateLead,
} from "../../lib/roofing.functions";
import { trackRoofingEvent } from "../../lib/tracking";

export function EstimateForm({
	selectedService = "replacement",
}: {
	selectedService?: "inspection" | "repair" | "replacement";
}) {
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [phone, setPhone] = useState("");
	const [streetAddress, setStreetAddress] = useState("");
	const [city, setCity] = useState("Plano");
	const [stateCode, setStateCode] = useState("TX");
	const [zip, setZip] = useState("");
	const [serviceType, setServiceType] = useState<
		"inspection" | "repair" | "replacement"
	>(selectedService);
	const [roofAge, setRoofAge] = useState("10–15 years");
	const [urgency, setUrgency] = useState("Within 1 week");
	const [notes, setNotes] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [result, setResult] = useState<EstimateLeadResult | null>(null);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setSubmitting(true);
		setResult(null);

		const service =
			COMPANY_CONFIG.services.find((s) => s.id === serviceType) ??
			COMPANY_CONFIG.services[0];

		// Fire required Whop custom pixel event `estimate_requested` + standard `lead`
		trackRoofingEvent("estimate_requested", {
			service_id: service.id,
			service_name: service.title,
			product_id: service.productId,
			estimated_value: service.price,
			zip: zip.trim(),
			urgency,
		});
		trackRoofingEvent("lead", {
			value: service.price,
			currency: "USD",
			service: service.id,
		});

		try {
			const res = await submitEstimateLead({
				data: {
					name,
					email,
					phone,
					streetAddress,
					city,
					state: stateCode,
					zip,
					serviceType,
					roofAge,
					urgency,
					notes,
					referrer:
						typeof window !== "undefined" ? window.location.href : undefined,
				},
			});
			setResult(res);
		} catch (err) {
			setResult({
				ok: false,
				accountId: COMPANY_CONFIG.whop.accountId,
				leadId: null,
				eventId: null,
				leadsApiStatus: null,
				message:
					err instanceof Error ? err.message : "Failed to submit estimate.",
				recordedAt: new Date().toISOString(),
			});
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<section id="estimate" className="bg-slate-900 py-16 text-white sm:py-20">
			<div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
				<div className="grid gap-10 lg:grid-cols-12 lg:items-start">
					{/* Left pitch */}
					<div className="lg:col-span-5">
						<span className="inline-flex items-center rounded-full bg-amber-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-300">
							Wired to Whop Leads API
						</span>
						<h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
							Request Your Free Itemized Roofing Estimate
						</h2>
						<p className="mt-4 text-sm leading-relaxed text-slate-300">
							Tell us about your roof and our HAAG-certified project estimator
							will respond within 2 business hours with satellite measurements,
							material options, and financing scenarios.
						</p>

						<ul className="mt-6 space-y-3 text-sm text-slate-200">
							<li className="flex items-start gap-2.5">
								<span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-amber-400" />
								<span>
									Every submission posts directly to the{" "}
									<strong className="text-white">Whop Leads API</strong> and
									creates a tracked homeowner profile on the contractor&apos;s
									Whop account.
								</span>
							</li>
							<li className="flex items-start gap-2.5">
								<span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-amber-400" />
								<span>
									Fires custom pixel event{" "}
									<code className="rounded bg-slate-800 px-1.5 py-0.5 text-xs text-amber-300">
										whop.track(&quot;estimate_requested&quot;)
									</code>{" "}
									for ad attribution.
								</span>
							</li>
							<li className="flex items-start gap-2.5">
								<span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-amber-400" />
								<span>
									Zero obligation · Insurance claim documentation included.
								</span>
							</li>
						</ul>

						<div className="mt-8 rounded-xl border border-slate-700 bg-slate-800/60 p-4 text-xs text-slate-300">
							<p className="font-semibold text-white">
								Need emergency storm tarping today?
							</p>
							<p className="mt-1">
								Call dispatch directly at{" "}
								<a
									href={COMPANY_CONFIG.phoneHref}
									className="font-bold text-amber-400 underline"
								>
									{COMPANY_CONFIG.phone}
								</a>{" "}
								— {COMPANY_CONFIG.hours}.
							</p>
						</div>
					</div>

					{/* Right form card */}
					<div className="rounded-2xl border border-slate-700 bg-white p-6 text-slate-900 shadow-2xl sm:p-8 lg:col-span-7">
						<form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
							<div className="grid gap-4 sm:grid-cols-2">
								<label className="block text-xs font-semibold text-slate-700">
									Full Name *
									<input
										required
										type="text"
										placeholder="Taylor Brooks"
										value={name}
										onChange={(e) => setName(e.target.value)}
										className="mt-1 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:border-amber-500 focus:outline-none"
									/>
								</label>
								<label className="block text-xs font-semibold text-slate-700">
									Email Address *
									<input
										required
										type="email"
										placeholder="taylor@example.com"
										value={email}
										onChange={(e) => setEmail(e.target.value)}
										className="mt-1 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:border-amber-500 focus:outline-none"
									/>
								</label>
							</div>

							<div className="grid gap-4 sm:grid-cols-2">
								<label className="block text-xs font-semibold text-slate-700">
									Phone Number *
									<input
										required
										type="tel"
										placeholder="(469) 555-0148"
										value={phone}
										onChange={(e) => setPhone(e.target.value)}
										className="mt-1 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:border-amber-500 focus:outline-none"
									/>
								</label>
								<label className="block text-xs font-semibold text-slate-700">
									Service Needed *
									<select
										value={serviceType}
										onChange={(e) =>
											setServiceType(
												e.target.value as
													| "inspection"
													| "repair"
													| "replacement",
											)
										}
										className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm focus:border-amber-500 focus:outline-none"
									>
										<option value="replacement">
											Full Roof Replacement ($500 Deposit)
										</option>
										<option value="repair">
											Emergency Leak &amp; Shingle Repair ($349 Flat-Rate)
										</option>
										<option value="inspection">
											21-Point Drone Roof Inspection ($149)
										</option>
									</select>
								</label>
							</div>

							<div className="grid gap-4 sm:grid-cols-6">
								<label className="block text-xs font-semibold text-slate-700 sm:col-span-3">
									Property Street Address *
									<input
										required
										type="text"
										placeholder="1420 Legacy Dr"
										value={streetAddress}
										onChange={(e) => setStreetAddress(e.target.value)}
										className="mt-1 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:border-amber-500 focus:outline-none"
									/>
								</label>
								<label className="block text-xs font-semibold text-slate-700 sm:col-span-1">
									City
									<input
										required
										type="text"
										value={city}
										onChange={(e) => setCity(e.target.value)}
										className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-amber-500 focus:outline-none"
									/>
								</label>
								<label className="block text-xs font-semibold text-slate-700 sm:col-span-1">
									State
									<input
										required
										type="text"
										maxLength={2}
										value={stateCode}
										onChange={(e) => setStateCode(e.target.value.toUpperCase())}
										className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-amber-500 focus:outline-none"
									/>
								</label>
								<label className="block text-xs font-semibold text-slate-700 sm:col-span-1">
									ZIP *
									<input
										required
										type="text"
										placeholder="75024"
										value={zip}
										onChange={(e) => setZip(e.target.value)}
										className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-amber-500 focus:outline-none"
									/>
								</label>
							</div>

							<div className="grid gap-4 sm:grid-cols-2">
								<label className="block text-xs font-semibold text-slate-700">
									Approximate Roof Age
									<select
										value={roofAge}
										onChange={(e) => setRoofAge(e.target.value)}
										className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm focus:border-amber-500 focus:outline-none"
									>
										<option>Under 5 years</option>
										<option>5–10 years</option>
										<option>10–15 years</option>
										<option>15+ years / Unsure</option>
									</select>
								</label>
								<label className="block text-xs font-semibold text-slate-700">
									Timeline / Urgency
									<select
										value={urgency}
										onChange={(e) => setUrgency(e.target.value)}
										className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm focus:border-amber-500 focus:outline-none"
									>
										<option>Emergency — Active Leak Today</option>
										<option>Within 1 week</option>
										<option>Within 30 days</option>
										<option>Just comparing quotes &amp; financing</option>
									</select>
								</label>
							</div>

							<label className="block text-xs font-semibold text-slate-700">
								Project Details (Hail Damage, Insurance Carrier, Notes)
								<textarea
									rows={3}
									placeholder="e.g., Missing ridge shingles on south slope after last night's storm…"
									value={notes}
									onChange={(e) => setNotes(e.target.value)}
									className="mt-1 w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-amber-500 focus:outline-none"
								/>
							</label>

							<button
								type="submit"
								disabled={submitting}
								className="w-full rounded-xl bg-amber-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg transition hover:bg-amber-700 disabled:opacity-50"
							>
								{submitting
									? "Sending Quote Request to Whop Leads API…"
									: "Request Free Roofing Estimate →"}
							</button>
						</form>

						{result ? (
							<div
								className={`mt-5 rounded-xl border p-4 text-xs ${
									result.ok
										? "border-emerald-200 bg-emerald-50 text-emerald-900"
										: "border-rose-200 bg-rose-50 text-rose-900"
								}`}
							>
								<p className="font-bold">
									{result.ok
										? "Quote Request Received & Logged in Whop!"
										: "Could not submit estimate"}
								</p>
								<p className="mt-1">{result.message}</p>
								{result.ok ? (
									<div className="mt-2 flex flex-wrap gap-2 font-mono text-[11px]">
										<span className="rounded bg-white px-2 py-0.5">
											account: {result.accountId}
										</span>
										{result.leadId ? (
											<span className="rounded bg-emerald-100 px-2 py-0.5 font-bold">
												lead_id: {result.leadId}
											</span>
										) : null}
										{result.eventId ? (
											<span className="rounded bg-white px-2 py-0.5">
												event_id: {result.eventId}
											</span>
										) : null}
									</div>
								) : null}
							</div>
						) : null}
					</div>
				</div>
			</div>
		</section>
	);
}
