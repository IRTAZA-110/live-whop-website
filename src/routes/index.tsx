import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { DepositToInvoiceFlow } from "../components/roofing/DepositToInvoiceFlow";
import { EstimateForm } from "../components/roofing/EstimateForm";
import { PaymentElementsModal } from "../components/roofing/PaymentElementsModal";
import { PixelInspector } from "../components/roofing/PixelInspector";
import {
	COMPANY_CONFIG,
	type RoofingServiceConfig,
} from "../config/company";
import { trackRoofingEvent } from "../lib/tracking";

export const Route = createFileRoute("/")({
	head: () => ({
		meta: [
			{
				title: `${COMPANY_CONFIG.name} | Licensed US Roofing · Whop Payments`,
			},
			{
				name: "description",
				content:
					"21-point drone roof inspections, flat-rate leak repairs, and full roof replacements with instant Whop financing, card-on-file deposits, and Whop invoicing.",
			},
		],
	}),
	component: RoofingHomePage,
});

function RoofingHomePage() {
	const [activeCheckoutService, setActiveCheckoutService] =
		useState<RoofingServiceConfig | null>(null);
	const [selectedServiceId, setSelectedServiceId] = useState<
		"inspection" | "repair" | "replacement"
	>("inspection");
	const [zipInput, setZipInput] = useState("");
	const [zipStatus, setZipStatus] = useState<"idle" | "covered" | "nearby">(
		"idle",
	);

	function handleSelectService(service: RoofingServiceConfig) {
		setSelectedServiceId(service.id);
		trackRoofingEvent("service_viewed", {
			service_id: service.id,
			service_name: service.title,
			category: service.category,
			plan_id: service.planId,
			price: service.price,
			currency: "USD",
		});
	}

	function handleOpenCheckout(service: RoofingServiceConfig) {
		handleSelectService(service);
		setActiveCheckoutService(service);
	}

	function handleCheckZip(e: React.FormEvent) {
		e.preventDefault();
		const clean = zipInput.trim().slice(0, 5);
		if (!clean) return;
		if (
			(COMPANY_CONFIG.serviceArea.coveredZips as readonly string[]).includes(
				clean,
			) ||
			clean.startsWith("750") ||
			clean.startsWith("752") ||
			clean.startsWith("760") ||
			clean.startsWith("761")
		) {
			setZipStatus("covered");
		} else {
			setZipStatus("nearby");
		}
	}

	const inspectionService = COMPANY_CONFIG.services[0];
	const depositService = COMPANY_CONFIG.services[2];

	return (
		<div className="bg-white text-slate-900">
			{/* HERO */}
			<section className="relative overflow-hidden bg-slate-950 text-white">
				<div
					className="pointer-events-none absolute inset-0 opacity-25"
					style={{
						backgroundImage:
							"radial-gradient(circle at 20% 20%, #f59e0b 0%, transparent 45%), radial-gradient(circle at 80% 70%, #1e40af 0%, transparent 50%)",
					}}
				/>
				<div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
					<div className="grid gap-12 lg:grid-cols-12 lg:items-center">
						<div className="lg:col-span-7">
							<div className="inline-flex flex-wrap items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/10 px-3.5 py-1 text-xs font-semibold text-amber-300">
								<span>{COMPANY_CONFIG.licenseNumber}</span>
							</div>

							<h1 className="mt-5 text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
								Storm-Ready US Roofing.{" "}
								<span className="text-amber-400">Book, Finance &amp; Pay</span>{" "}
								in Minutes.
							</h1>

							<p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
								Transparent upfront pricing for 21-point drone inspections,
								flat-rate emergency leak repairs, and full architectural roof
								replacements—backed by Whop Payments, Apple Pay / Google Pay,
								instant BNPL financing, and seamless final balance invoicing.
							</p>

							<div className="mt-8 flex flex-wrap gap-3">
								<button
									type="button"
									onClick={() => handleOpenCheckout(inspectionService)}
									className="rounded-xl bg-amber-500 px-6 py-3.5 text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/20 transition hover:bg-amber-400"
								>
									Book {inspectionService.priceLabel} Drone Inspection
								</button>
								<button
									type="button"
									onClick={() => handleOpenCheckout(depositService)}
									className="rounded-xl border border-slate-600 bg-slate-900/80 px-6 py-3.5 text-sm font-bold text-white transition hover:border-amber-400 hover:bg-slate-800"
								>
									Lock {depositService.priceLabel} Project Deposit
								</button>
								<a
									href="#estimate"
									className="rounded-xl border border-slate-700 px-5 py-3.5 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
								>
									Free Written Estimate
								</a>
							</div>

							<div className="mt-10 grid grid-cols-2 gap-4 border-t border-slate-800 pt-8 sm:grid-cols-4">
								{COMPANY_CONFIG.stats.map((stat) => (
									<div key={stat.label}>
										<p className="text-2xl font-extrabold text-amber-400">
											{stat.value}
										</p>
										<p className="mt-0.5 text-xs text-slate-400">
											{stat.label}
										</p>
									</div>
								))}
							</div>
						</div>

						{/* Right Quick-Start Pitch Card */}
						<div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl lg:col-span-5">
							<p className="text-xs font-semibold uppercase tracking-wider text-amber-400">
								Transparent Upfront Roofing Plans
							</p>
							<h2 className="mt-1 text-xl font-bold text-white">
								Choose Your Starting Point
							</h2>
							<p className="mt-1 text-xs text-slate-400">
								Every plan runs natively on Whop Payment Elements with Apple
								Pay, Google Pay, and automatic financing options.
							</p>

							<div className="mt-5 space-y-3">
								{COMPANY_CONFIG.services.map((svc) => (
									<div
										key={svc.id}
										className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/80 p-3.5 transition hover:border-amber-500/60"
									>
										<div>
											<p className="text-sm font-bold text-white">
												{svc.title}
											</p>
											<p className="text-xs text-slate-400">
												{svc.category} · {svc.priceLabel}
											</p>
										</div>
										<button
											type="button"
											onClick={() => handleOpenCheckout(svc)}
											className="shrink-0 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-slate-950 transition hover:bg-amber-400"
										>
											Checkout →
										</button>
									</div>
								))}
							</div>

							<div className="mt-5 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-800/70 px-4 py-3 text-xs text-slate-300">
								<span>24/7 Storm Dispatch:</span>
								<a
									href={COMPANY_CONFIG.phoneHref}
									className="font-bold text-amber-400 hover:underline"
								>
									{COMPANY_CONFIG.phone}
								</a>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* SERVICES SECTION: Inspection, Repair, Replacement */}
			<section id="services" className="py-16 sm:py-20">
				<div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
					<div className="flex flex-wrap items-end justify-between gap-4">
						<div className="max-w-2xl">
							<span className="text-xs font-bold uppercase tracking-wider text-amber-600">
								Services &amp; Live Whop Plans
							</span>
							<h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
								Inspection, Repair &amp; Full Replacement
							</h2>
							<p className="mt-2 text-base text-slate-600">
								Select a service to inspect scope (fires{" "}
								<code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">
									whop.track(&quot;service_viewed&quot;)
								</code>
								) or check out directly with Whop Payment Elements.
							</p>
						</div>
						<a
							href="#deposit-flow"
							className="text-sm font-semibold text-amber-700 hover:text-amber-800"
						>
							See Deposit → Final Invoice Flow ↓
						</a>
					</div>

					<div className="mt-10 grid gap-6 lg:grid-cols-3">
						{COMPANY_CONFIG.services.map((service) => {
							const isSelected = selectedServiceId === service.id;
							return (
								<article
									key={service.id}
									onClick={() => handleSelectService(service)}
									className={`flex cursor-pointer flex-col rounded-2xl border p-6 transition ${
										isSelected
											? "border-amber-500 bg-amber-50/30 shadow-lg ring-1 ring-amber-500/40"
											: "border-slate-200 bg-white shadow-sm hover:border-slate-300 hover:shadow-md"
									}`}
								>
									<div className="flex items-center justify-between gap-2">
										<span className="rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
											{service.category}
										</span>
										{service.badge ? (
											<span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-800">
												{service.badge}
											</span>
										) : null}
									</div>

									<h3 className="mt-4 text-xl font-bold text-slate-900">
										{service.title}
									</h3>
									<p className="mt-1.5 text-sm text-slate-600">
										{service.tagline}
									</p>

									<div className="mt-5 border-y border-slate-100 py-4">
										<div className="flex items-baseline gap-2">
											<span className="text-4xl font-extrabold tracking-tight text-slate-900">
												{service.priceLabel}
											</span>
											<span className="text-xs font-medium text-slate-500">
												USD
											</span>
										</div>
										<p className="mt-1 text-xs text-slate-500">
											{service.billingNote}
										</p>
									</div>

									<ul className="mt-5 flex-1 space-y-2.5 text-sm text-slate-700">
										{service.features.map((feat) => (
											<li key={feat} className="flex items-start gap-2">
												<span className="mt-1 text-amber-600">✓</span>
												<span>{feat}</span>
											</li>
										))}
									</ul>

									<div className="mt-6 space-y-2">
										<button
											type="button"
											onClick={(e) => {
												e.stopPropagation();
												handleOpenCheckout(service);
											}}
											className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-amber-600"
										>
											{service.ctaLabel}
										</button>
										<Link
											to="/checkout/$planId"
											params={{ planId: service.planId }}
											onClick={(e) => {
												e.stopPropagation();
												trackRoofingEvent("deposit_started", {
													service_id: service.id,
													plan_id: service.planId,
													amount: service.price,
													currency: "USD",
													checkout_surface: "full_page_payment_element",
												});
											}}
											className="block w-full rounded-xl border border-slate-200 px-4 py-2 text-center text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
										>
											Open Full PaymentElement Checkout →
										</Link>
									</div>
								</article>
							);
						})}
					</div>
				</div>
			</section>

			{/* FINANCING CALLOUT */}
			<section
				id="financing"
				className="bg-gradient-to-r from-amber-600 via-amber-500 to-orange-500 py-14 text-slate-950"
			>
				<div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
					<div className="grid gap-8 lg:grid-cols-12 lg:items-center">
						<div className="lg:col-span-6">
							<span className="inline-flex rounded-full bg-slate-950/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-slate-950">
								Built-In Roof Financing via Whop
							</span>
							<h2 className="mt-3 text-3xl font-extrabold tracking-tight">
								Split Your Roof Project Into Flexible Monthly Payments
							</h2>
							<p className="mt-3 text-sm font-medium leading-relaxed text-slate-900/90">
								Because checkout runs natively on{" "}
								<strong>Whop Payments</strong>, buy-now-pay-later and
								installment options surface automatically for approved US
								merchants—no separate lender portals, paper contracts, or custom
								card forms required.
							</p>
						</div>
						<div className="grid gap-3 sm:grid-cols-2 lg:col-span-6">
							{COMPANY_CONFIG.financingPartners.map((partner) => (
								<div
									key={partner.name}
									className="rounded-xl bg-white/95 p-4 shadow-md"
								>
									<p className="text-base font-extrabold text-slate-900">
										{partner.name}
									</p>
									<p className="mt-0.5 text-xs text-slate-600">
										{partner.detail}
									</p>
								</div>
							))}
						</div>
					</div>
				</div>
			</section>

			{/* DEPOSIT -> JOB -> FINAL INVOICE INTERACTIVE FLOW */}
			<DepositToInvoiceFlow
				onOpenDepositCheckout={() => handleOpenCheckout(depositService)}
			/>

			{/* SERVICE AREA */}
			<section id="service-area" className="py-16 sm:py-20">
				<div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
					<div className="grid gap-10 lg:grid-cols-12 lg:items-center">
						<div className="lg:col-span-6">
							<span className="text-xs font-bold uppercase tracking-wider text-amber-600">
								Service Area
							</span>
							<h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
								{COMPANY_CONFIG.serviceArea.regionTitle}
							</h2>
							<p className="mt-3 text-sm leading-relaxed text-slate-600">
								{COMPANY_CONFIG.serviceArea.summary}
							</p>

							<form
								onSubmit={handleCheckZip}
								className="mt-5 flex max-w-md gap-2"
							>
								<input
									type="text"
									inputMode="numeric"
									maxLength={5}
									placeholder="Enter 5-digit ZIP (e.g. 75024)"
									value={zipInput}
									onChange={(e) => {
										setZipInput(e.target.value);
										setZipStatus("idle");
									}}
									className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-amber-500 focus:outline-none"
								/>
								<button
									type="submit"
									className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800"
								>
									Check ZIP
								</button>
							</form>

							{zipStatus === "covered" ? (
								<p className="mt-2.5 text-xs font-semibold text-emerald-700">
									✓ Great news! ZIP {zipInput} is in our priority 24-hour
									dispatch zone.
								</p>
							) : zipStatus === "nearby" ? (
								<p className="mt-2.5 text-xs font-semibold text-amber-700">
									Extended territory — submit the estimate form below and
									we&apos;ll confirm crew availability for ZIP {zipInput}.
								</p>
							) : null}
						</div>

						<div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 lg:col-span-6">
							<p className="text-xs font-bold uppercase tracking-wider text-slate-500">
								Active Dispatch Cities
							</p>
							<div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
								{COMPANY_CONFIG.serviceArea.cities.map((city) => (
									<div
										key={city}
										className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800"
									>
										<span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
										{city}, TX
									</div>
								))}
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* REVIEWS & TRUST */}
			<section
				id="reviews"
				className="border-t border-slate-200 bg-slate-50 py-16 sm:py-20"
			>
				<div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
					<div className="text-center">
						<span className="text-xs font-bold uppercase tracking-wider text-amber-600">
							Verified Homeowner Trust
						</span>
						<h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
							Trusted by 480+ Texas Homeowners
						</h2>
					</div>

					<div className="mt-8 flex flex-wrap justify-center gap-2.5">
						{COMPANY_CONFIG.certifications.map((cert) => (
							<span
								key={cert}
								className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-semibold text-slate-700 shadow-xs"
							>
								★ {cert}
							</span>
						))}
					</div>

					<div className="mt-10 grid gap-6 md:grid-cols-3">
						{COMPANY_CONFIG.reviews.map((review) => (
							<blockquote
								key={review.author}
								className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
							>
								<div className="text-sm text-amber-500">★★★★★</div>
								<p className="mt-3 flex-1 text-sm leading-relaxed text-slate-700">
									&ldquo;{review.quote}&rdquo;
								</p>
								<footer className="mt-5 border-t border-slate-100 pt-3">
									<p className="text-sm font-bold text-slate-900">
										{review.author}
									</p>
									<p className="text-xs text-slate-500">
										{review.location} · {review.service}
									</p>
								</footer>
							</blockquote>
						))}
					</div>
				</div>
			</section>

			{/* REQUEST AN ESTIMATE FORM (WHOP LEADS API) */}
			<EstimateForm selectedService={selectedServiceId} />

			{/* CONTACT SECTION */}
			<section id="contact" className="border-t border-slate-200 bg-white py-14">
				<div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
					<div className="grid gap-6 md:grid-cols-3">
						<div className="rounded-xl border border-slate-200 p-5">
							<p className="text-xs font-bold uppercase tracking-wider text-amber-600">
								Office &amp; Dispatch
							</p>
							<p className="mt-2 text-sm font-semibold text-slate-900">
								{COMPANY_CONFIG.name}
							</p>
							<p className="mt-1 text-xs text-slate-600">
								{COMPANY_CONFIG.headquarters}
							</p>
						</div>
						<div className="rounded-xl border border-slate-200 p-5">
							<p className="text-xs font-bold uppercase tracking-wider text-amber-600">
								Direct Phone &amp; Email
							</p>
							<p className="mt-2 text-sm font-semibold text-slate-900">
								<a href={COMPANY_CONFIG.phoneHref} className="hover:underline">
									{COMPANY_CONFIG.phone}
								</a>
							</p>
							<p className="mt-1 text-xs text-slate-600">
								{COMPANY_CONFIG.email}
							</p>
						</div>
						<div className="rounded-xl border border-slate-200 p-5">
							<p className="text-xs font-bold uppercase tracking-wider text-amber-600">
								Hours &amp; Licensing
							</p>
							<p className="mt-2 text-sm font-semibold text-slate-900">
								{COMPANY_CONFIG.hours}
							</p>
							<p className="mt-1 text-xs text-slate-600">
								{COMPANY_CONFIG.licenseNumber}
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* EMBEDDED WHOP PAYMENT ELEMENTS CHECKOUT MODAL */}
			<PaymentElementsModal
				service={activeCheckoutService}
				onClose={() => setActiveCheckoutService(null)}
			/>

			{/* LIVE WHOP PIXEL EVENT INSPECTOR */}
			<PixelInspector />
		</div>
	);
}
