import { Link } from "@tanstack/react-router";
import type { WhopConstructor } from "@whop/elements";
import {
	BrandingElement,
	EmailElement,
	PaymentElement,
	Payments,
	type PaymentsHandle,
	WhopElements,
} from "@whop/elements-react";
import { useEffect, useRef, useState } from "react";
import { COMPANY_CONFIG } from "../../config/company";
import { ENVIRONMENT, loadElements } from "../../lib/checkout/environment";
import {
	createCardOnFileSetupIntent,
	createFinalBalanceInvoice,
	type FinalInvoiceResult,
	type InvoiceSummaryRow,
	listRecentInvoices,
	pollSetupIntentStatus,
	type SetupIntentResult,
} from "../../lib/roofing.functions";
import { trackRoofingEvent } from "../../lib/tracking";

const DEPOSIT_SERVICE = COMPANY_CONFIG.services.find(
	(s) => s.id === "replacement",
)!;

export function DepositToInvoiceFlow({
	onOpenDepositCheckout,
}: {
	onOpenDepositCheckout: () => void;
}) {
	const [elements, setElements] = useState<Promise<WhopConstructor> | null>(
		null,
	);
	const paymentsRef = useRef<{ handle: PaymentsHandle | null }>(null);

	// Step 1: Card-on-File Setup Intent state
	const [setupEmail, setSetupEmail] = useState("");
	const [setupEmailComplete, setSetupEmailComplete] = useState(false);
	const [setupPaymentComplete, setSetupPaymentComplete] = useState(false);
	const [setupCustomerName, setSetupCustomerName] = useState("Jordan Hayes");
	const [setupProjectRef, setSetupProjectRef] = useState("ROOF-DFW-2026-104");
	const [setupBusy, setSetupBusy] = useState(false);
	const [setupResult, setSetupResult] = useState<SetupIntentResult | null>(
		null,
	);

	// Step 3: Final Balance Invoice state
	const [invoiceName, setInvoiceName] = useState("Jordan Hayes");
	const [invoiceEmail, setInvoiceEmail] = useState("jordan.hayes@example.com");
	const [invoiceAddress, setInvoiceAddress] = useState("418 Oak Ridge Ln");
	const [invoiceCity, setInvoiceCity] = useState("Plano");
	const [invoiceState, setInvoiceState] = useState("TX");
	const [invoiceZip, setInvoiceZip] = useState("75024");
	const [invoiceMemo, setInvoiceMemo] = useState(
		"Final project balance upon completion of 32-square GAF Timberline HDZ architectural roof replacement & magnetic nail sweep walkthrough.",
	);
	const [collectionMode, setCollectionMode] = useState<
		"send_manual" | "auto_charge"
	>("send_manual");
	const [paymentMethodId, setPaymentMethodId] = useState("");
	const [invoiceBusy, setInvoiceBusy] = useState(false);
	const [invoiceResult, setInvoiceResult] =
		useState<FinalInvoiceResult | null>(null);
	const [recentInvoices, setRecentInvoices] = useState<InvoiceSummaryRow[]>([]);

	useEffect(() => {
		setElements(loadElements());
		void listRecentInvoices()
			.then((res) => {
				if (res.ok) setRecentInvoices(res.invoices);
			})
			.catch(() => null);
	}, []);

	async function handleSaveCardOnFile() {
		const handle = paymentsRef.current?.handle;
		if (!handle) return;
		setSetupBusy(true);
		setSetupResult(null);

		trackRoofingEvent("deposit_started", {
			flow: "card_on_file_setup_intent",
			plan_id: DEPOSIT_SERVICE.planId,
			amount: DEPOSIT_SERVICE.price,
			currency: "USD",
		});

		try {
			const tokenRes = await handle.createConfirmationToken({
				billingDetails: {
					email: setupEmail.trim(),
					name: setupCustomerName.trim() || "Homeowner",
				},
			});

			const token = tokenRes.confirmationToken;
			const returnUrl =
				typeof window !== "undefined"
					? `${window.location.origin}/#deposit-flow`
					: `https://${COMPANY_CONFIG.whop.domain}/#deposit-flow`;

			let res = await createCardOnFileSetupIntent({
				data: {
					confirmationToken: token,
					email: setupEmail.trim(),
					customerName: setupCustomerName.trim(),
					projectRef: setupProjectRef.trim(),
					returnUrl,
				},
			});

			// Handle 3DS / next action if Whop requests verification
			if (res.ok && res.clientSecret && res.status !== "succeeded") {
				try {
					const maybeNext = (
						handle as unknown as {
							handleNextAction?: (secret: string) => Promise<unknown>;
						}
					).handleNextAction;
					if (typeof maybeNext === "function") {
						await maybeNext.call(handle, res.clientSecret);
					}
					if (res.setupIntentId) {
						res = await pollSetupIntentStatus({
							data: { setupIntentId: res.setupIntentId },
						});
					}
				} catch {
					// Keep the created setup intent result visible
				}
			}

			setSetupResult(res);
			if (res.paymentMethodId) {
				setPaymentMethodId(res.paymentMethodId);
				setCollectionMode("auto_charge");
			}
			if (setupEmail.trim()) {
				setInvoiceEmail(setupEmail.trim());
			}
			if (setupCustomerName.trim()) {
				setInvoiceName(setupCustomerName.trim());
			}
		} catch (err) {
			setSetupResult({
				ok: false,
				setupIntentId: null,
				status: "error",
				clientSecret: null,
				paymentMethodId: null,
				message:
					err instanceof Error
						? err.message
						: "Could not create card-on-file Setup Intent.",
			});
		} finally {
			setSetupBusy(false);
		}
	}

	async function handleCreateInvoice(e: React.FormEvent) {
		e.preventDefault();
		setInvoiceBusy(true);
		setInvoiceResult(null);
		try {
			const res = await createFinalBalanceInvoice({
				data: {
					customerName: invoiceName,
					customerEmail: invoiceEmail,
					propertyAddress: invoiceAddress,
					city: invoiceCity,
					state: invoiceState,
					zip: invoiceZip,
					jobScopeMemo: invoiceMemo,
					collectionMode,
					paymentMethodId: paymentMethodId.trim() || undefined,
					dueInDays: 7,
				},
			});
			setInvoiceResult(res);
			if (res.ok) {
				trackRoofingEvent("invoice_created", {
					invoice_id: res.invoiceId,
					collection_mode: res.collectionMode,
					amount: COMPANY_CONFIG.whop.finalBalanceAmount,
					currency: "USD",
				});
				const refreshed = await listRecentInvoices();
				if (refreshed.ok) setRecentInvoices(refreshed.invoices);
			}
		} catch (err) {
			setInvoiceResult({
				ok: false,
				invoiceId: null,
				status: "error",
				collectionMode,
				amountFormatted: `$${COMPANY_CONFIG.whop.finalBalanceAmount.toLocaleString()}.00`,
				checkoutUrl: null,
				dueAt: null,
				message:
					err instanceof Error ? err.message : "Invoice creation failed.",
			});
		} finally {
			setInvoiceBusy(false);
		}
	}

	return (
		<section
			id="deposit-flow"
			className="border-y border-slate-200 bg-slate-50 py-16 sm:py-20"
		>
			<div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
				<div className="max-w-3xl">
					<span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-800">
						High-Ticket Whop Billing Architecture
					</span>
					<h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
						Deposit → Job Completion → Final Invoice
					</h2>
					<p className="mt-3 text-base text-slate-600">
						Built for real US roofing jobs: collect a <strong>$500 deposit</strong>{" "}
						with Whop Payment Elements, store the homeowner&apos;s card on file via
						a <strong>Whop Setup Intent</strong>, and settle the final balance via
						the <strong>Whop Invoices API</strong> (auto-charge stored method or
						send a hosted invoice link).
					</p>
				</div>

				{/* Visual 3-stage pipeline indicator */}
				<div className="mt-8 grid gap-4 sm:grid-cols-3">
					<div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
						<div className="flex items-center gap-2.5">
							<span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white">
								1
							</span>
							<h3 className="font-bold text-slate-900">
								Deposit + Card on File
							</h3>
						</div>
						<p className="mt-2 text-xs leading-relaxed text-slate-600">
							Collect $500 deposit via Whop Checkout &amp; save payment method
							with <code>setup_intents.create</code> +{" "}
							<code>BrandingElement</code>.
						</p>
					</div>
					<div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
						<div className="flex items-center gap-2.5">
							<span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
								2
							</span>
							<h3 className="font-bold text-slate-900">
								Roof Build &amp; Walkthrough
							</h3>
						</div>
						<p className="mt-2 text-xs leading-relaxed text-slate-600">
							Crew completes tear-off, synthetic underlayment, Class 4 shingles,
							and homeowner approves final inspection photos.
						</p>
					</div>
					<div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
						<div className="flex items-center gap-2.5">
							<span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
								3
							</span>
							<h3 className="font-bold text-slate-900">
								Final Balance Invoice
							</h3>
						</div>
						<p className="mt-2 text-xs leading-relaxed text-slate-600">
							Create &amp; issue a Whop Invoice (<code>plan_cPJ4wJpDHNhpt</code>)
							to auto-charge the saved <code>payt_</code> method or email a pay
							link.
						</p>
					</div>
				</div>

				{/* Two-column interactive live demo */}
				<div className="mt-8 grid gap-6 lg:grid-cols-2">
					{/* LEFT: Step 1 — Card-on-File Setup Intent via Whop PaymentElement + BrandingElement */}
					<div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
						<div className="flex items-start justify-between gap-3">
							<div>
								<span className="text-xs font-semibold uppercase tracking-wider text-amber-700">
									Step 1 · Whop Setup Intent (Card on File)
								</span>
								<h3 className="mt-1 text-xl font-bold text-slate-900">
									Authorize Card on File for Final Balance
								</h3>
							</div>
							<button
								type="button"
								onClick={onOpenDepositCheckout}
								className="shrink-0 rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-amber-700"
							>
								Pay $500 Deposit Now
							</button>
						</div>

						<p className="mt-2 text-xs text-slate-600">
							Uses <code>&lt;Payments mode=&quot;setup&quot;&gt;</code>,{" "}
							<code>&lt;PaymentElement /&gt;</code>, and the required{" "}
							<code>&lt;BrandingElement /&gt;</code> to vault a reusable{" "}
							<code>payt_</code> method without double-charging the homeowner.
						</p>

						<div className="mt-4 grid gap-3 sm:grid-cols-2">
							<label className="block text-xs font-medium text-slate-700">
								Homeowner Name
								<input
									type="text"
									value={setupCustomerName}
									onChange={(e) => setSetupCustomerName(e.target.value)}
									className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-amber-500 focus:outline-none"
								/>
							</label>
							<label className="block text-xs font-medium text-slate-700">
								Project Reference #
								<input
									type="text"
									value={setupProjectRef}
									onChange={(e) => setSetupProjectRef(e.target.value)}
									className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-amber-500 focus:outline-none"
								/>
							</label>
						</div>

						<div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
							<WhopElements elements={elements} environment={ENVIRONMENT}>
								<Payments
									ref={paymentsRef}
									accountId={COMPANY_CONFIG.whop.accountId}
									mode="setup"
									currency="usd"
									setupFutureUsage="off_session"
									appearance={{ theme: { appearance: "light" } }}
									fallback={
										<p className="py-4 text-center text-xs text-slate-500">
											Booting Whop Setup PaymentElement…
										</p>
									}
								>
									<div className="space-y-3">
										<EmailElement
											labelMode="floating"
											onChange={(ev) => {
												setSetupEmail(ev.email);
												setSetupEmailComplete(ev.complete);
											}}
										/>
										<PaymentElement
											onChange={(ev) => setSetupPaymentComplete(ev.complete)}
										/>
										<button
											type="button"
											disabled={
												setupBusy || !setupEmailComplete || !setupPaymentComplete
											}
											onClick={() => void handleSaveCardOnFile()}
											className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
										>
											{setupBusy
												? "Creating Whop Setup Intent…"
												: "Save Card on File (Whop Setup Intent)"}
										</button>
										{/* Required BrandingElement inside <Payments> scope */}
										<div className="pt-1">
											<BrandingElement />
										</div>
									</div>
								</Payments>
							</WhopElements>
						</div>

						{setupResult ? (
							<div
								className={`mt-4 rounded-xl border p-3.5 text-xs ${
									setupResult.ok
										? "border-emerald-200 bg-emerald-50 text-emerald-900"
										: "border-rose-200 bg-rose-50 text-rose-900"
								}`}
							>
								<p className="font-semibold">{setupResult.message}</p>
								{setupResult.setupIntentId ? (
									<div className="mt-1.5 flex flex-wrap gap-2 font-mono text-[11px]">
										<span className="rounded bg-white px-2 py-0.5">
											setup_intent: {setupResult.setupIntentId}
										</span>
										<span className="rounded bg-white px-2 py-0.5">
											status: {setupResult.status}
										</span>
										{setupResult.paymentMethodId ? (
											<span className="rounded bg-emerald-100 px-2 py-0.5 font-bold">
												payment_method: {setupResult.paymentMethodId}
											</span>
										) : null}
									</div>
								) : null}
							</div>
						) : null}

						<div className="mt-auto pt-4 text-xs text-slate-500">
							Or run a complete deposit checkout on the dedicated Payment
							Elements page:{" "}
							<Link
								to="/checkout/$planId"
								params={{ planId: DEPOSIT_SERVICE.planId }}
								onClick={() =>
									trackRoofingEvent("deposit_started", {
										service_id: "replacement",
										plan_id: DEPOSIT_SERVICE.planId,
										amount: DEPOSIT_SERVICE.price,
										currency: "USD",
									})
								}
								className="font-semibold text-amber-700 underline"
							>
								/checkout/{DEPOSIT_SERVICE.planId} →
							</Link>
						</div>
					</div>

					{/* RIGHT: Step 3 — Final Balance Invoice via Whop Invoices API */}
					<div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
						<div>
							<span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
								Step 3 · Whop Invoices API (Final Balance)
							</span>
							<h3 className="mt-1 text-xl font-bold text-slate-900">
								Bill Final Roof Balance ($
								{COMPANY_CONFIG.whop.finalBalanceAmount.toLocaleString()})
							</h3>
							<p className="mt-1 text-xs text-slate-600">
								Calls <code>whop.invoices.create</code> backed by real variant{" "}
								<code>{COMPANY_CONFIG.whop.finalBalancePlanId}</code>, then
								either emails the hosted Whop invoice for manual payment or
								issues an auto-charge against a saved <code>payt_</code> method.
							</p>
						</div>

						<form onSubmit={(e) => void handleCreateInvoice(e)} className="mt-4 space-y-3">
							<div className="grid gap-3 sm:grid-cols-2">
								<label className="block text-xs font-medium text-slate-700">
									Customer Name
									<input
										required
										type="text"
										value={invoiceName}
										onChange={(e) => setInvoiceName(e.target.value)}
										className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-600 focus:outline-none"
									/>
								</label>
								<label className="block text-xs font-medium text-slate-700">
									Customer Email
									<input
										required
										type="email"
										value={invoiceEmail}
										onChange={(e) => setInvoiceEmail(e.target.value)}
										className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-600 focus:outline-none"
									/>
								</label>
							</div>

							<div className="grid gap-3 sm:grid-cols-3">
								<label className="block text-xs font-medium text-slate-700 sm:col-span-2">
									Property Address
									<input
										required
										type="text"
										value={invoiceAddress}
										onChange={(e) => setInvoiceAddress(e.target.value)}
										className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-600 focus:outline-none"
									/>
								</label>
								<label className="block text-xs font-medium text-slate-700">
									ZIP Code
									<input
										required
										type="text"
										value={invoiceZip}
										onChange={(e) => setInvoiceZip(e.target.value)}
										className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-600 focus:outline-none"
									/>
								</label>
							</div>

							<div className="grid gap-3 sm:grid-cols-2">
								<label className="block text-xs font-medium text-slate-700">
									City
									<input
										required
										type="text"
										value={invoiceCity}
										onChange={(e) => setInvoiceCity(e.target.value)}
										className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-600 focus:outline-none"
									/>
								</label>
								<label className="block text-xs font-medium text-slate-700">
									State
									<input
										required
										type="text"
										value={invoiceState}
										onChange={(e) => setInvoiceState(e.target.value)}
										className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-600 focus:outline-none"
									/>
								</label>
							</div>

							{/* Collection mode toggle */}
							<div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
								<p className="text-xs font-semibold text-slate-700">
									Final Balance Collection Method
								</p>
								<div className="mt-2 grid grid-cols-2 gap-2">
									<button
										type="button"
										onClick={() => setCollectionMode("send_manual")}
										className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
											collectionMode === "send_manual"
												? "border-slate-900 bg-slate-900 text-white"
												: "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
										}`}
									>
										Send Invoice (Manual Pay)
									</button>
									<button
										type="button"
										onClick={() => setCollectionMode("auto_charge")}
										className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
											collectionMode === "auto_charge"
												? "border-emerald-700 bg-emerald-700 text-white"
												: "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
										}`}
									>
										Auto-Charge Card on File
									</button>
								</div>

								{collectionMode === "auto_charge" ? (
									<label className="mt-3 block text-xs font-medium text-slate-700">
										Saved Whop Payment Method ID (auto-filled from Step 1)
										<input
											type="text"
											placeholder="payt_xxxxxxxxxxxxxx"
											value={paymentMethodId}
											onChange={(e) => setPaymentMethodId(e.target.value)}
											className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-xs text-slate-900 focus:border-emerald-600 focus:outline-none"
										/>
									</label>
								) : null}
							</div>

							<label className="block text-xs font-medium text-slate-700">
								Invoice Scope / Walkthrough Memo
								<textarea
									rows={2}
									value={invoiceMemo}
									onChange={(e) => setInvoiceMemo(e.target.value)}
									className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none"
								/>
							</label>

							<button
								type="submit"
								disabled={invoiceBusy}
								className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
							>
								{invoiceBusy
									? "Creating Whop Invoice…"
									: collectionMode === "auto_charge"
										? `Issue & Auto-Charge $${COMPANY_CONFIG.whop.finalBalanceAmount.toLocaleString()} Final Invoice`
										: `Create & Send $${COMPANY_CONFIG.whop.finalBalanceAmount.toLocaleString()} Final Invoice`}
							</button>
						</form>

						{invoiceResult ? (
							<div
								className={`mt-4 rounded-xl border p-3.5 text-xs ${
									invoiceResult.ok
										? "border-emerald-200 bg-emerald-50 text-emerald-900"
										: "border-rose-200 bg-rose-50 text-rose-900"
								}`}
							>
								<p className="font-semibold">{invoiceResult.message}</p>
								{invoiceResult.invoiceId ? (
									<div className="mt-2 flex flex-wrap items-center gap-2 font-mono text-[11px]">
										<span className="rounded bg-white px-2 py-0.5">
											invoice: {invoiceResult.invoiceId}
										</span>
										<span className="rounded bg-white px-2 py-0.5">
											status: {invoiceResult.status}
										</span>
										<span className="rounded bg-white px-2 py-0.5">
											amount: {invoiceResult.amountFormatted}
										</span>
									</div>
								) : null}
								{invoiceResult.checkoutUrl ? (
									<a
										href={invoiceResult.checkoutUrl}
										target="_blank"
										rel="noreferrer"
										className="mt-2 inline-block font-semibold text-emerald-800 underline"
									>
										Open Live Whop Invoice Payment Link →
									</a>
								) : null}
							</div>
						) : null}

						{/* Live recent invoices from the Whop account */}
						{recentInvoices.length > 0 ? (
							<div className="mt-4 border-t border-slate-100 pt-3">
								<p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
									Recent Invoices on Whop Account ({recentInvoices.length})
								</p>
								<ul className="mt-2 space-y-1.5">
									{recentInvoices.slice(0, 3).map((inv) => (
										<li
											key={inv.id}
											className="flex items-center justify-between rounded-lg bg-slate-50 px-2.5 py-1.5 font-mono text-[11px] text-slate-700"
										>
											<span className="truncate">{inv.id}</span>
											<span className="rounded bg-white px-1.5 py-0.5 font-sans text-[10px] font-semibold uppercase text-slate-600">
												{inv.status}
											</span>
										</li>
									))}
								</ul>
							</div>
						) : null}
					</div>
				</div>
			</div>
		</section>
	);
}
