import { createServerFn } from "@tanstack/react-start";
import { API_VERSION_DATE } from "../api-version";
import { COMPANY_CONFIG } from "../config/company";
import { storefrontAccountId, whopClient } from "../whop.server";

function resolveAccountId(): string {
	try {
		return storefrontAccountId();
	} catch {
		return COMPANY_CONFIG.whop.accountId;
	}
}

function apiOrigin(): string {
	return process.env.WHOP_API_ORIGIN ?? "https://api.whop.com";
}

function formatError(err: unknown): string {
	if (err instanceof Error) return err.message;
	if (typeof err === "object" && err !== null && "message" in err) {
		return String((err as { message: unknown }).message);
	}
	return "Unexpected Whop API error";
}

// ---------------------------------------------------------------------------
// 1. Whop Leads API + Events API — "Request an Estimate" Form
// ---------------------------------------------------------------------------

export type EstimateLeadInput = {
	name: string;
	email: string;
	phone: string;
	streetAddress: string;
	city: string;
	state: string;
	zip: string;
	serviceType: "inspection" | "repair" | "replacement";
	roofAge: string;
	urgency: string;
	notes: string;
	referrer?: string;
};

export type EstimateLeadResult = {
	ok: boolean;
	accountId: string;
	leadId: string | null;
	eventId: string | null;
	leadsApiStatus: number | null;
	message: string;
	recordedAt: string;
};

export const submitEstimateLead = createServerFn({ method: "POST" })
	.validator((input: EstimateLeadInput) => input)
	.handler(async ({ data }): Promise<EstimateLeadResult> => {
		const accountId = resolveAccountId();
		const token = process.env.WHOP_API_KEY ?? "";
		const service =
			COMPANY_CONFIG.services.find((s) => s.id === data.serviceType) ??
			COMPANY_CONFIG.services[0];

		const metadata: Record<string, string> = {
			customer_name: data.name.trim(),
			email: data.email.trim(),
			phone: data.phone.trim(),
			street_address: data.streetAddress.trim(),
			city: data.city.trim(),
			state: data.state.trim(),
			zip: data.zip.trim(),
			service_type: service.title,
			roof_age: data.roofAge.trim(),
			urgency: data.urgency.trim(),
			notes: data.notes.trim().slice(0, 450),
			template: "ironcrest-roofing-whop-website",
		};

		let leadId: string | null = null;
		let leadsApiStatus: number | null = null;
		let eventId: string | null = null;
		const errors: string[] = [];

		// Primary: Call Whop Leads API (`POST /api/v1/leads`) directly with account API key
		if (token) {
			try {
				const leadRes = await fetch(`${apiOrigin()}/api/v1/leads`, {
					method: "POST",
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
						"Api-Version-Date": API_VERSION_DATE,
					},
					body: JSON.stringify({
						account_id: accountId,
						product_id: service.productId,
						referrer: data.referrer || `https://${COMPANY_CONFIG.whop.domain}/#estimate`,
						metadata,
					}),
				});
				leadsApiStatus = leadRes.status;
				if (leadRes.ok) {
					const payload = (await leadRes.json()) as { id?: string };
					leadId = payload.id ?? null;
				} else {
					const errBody = await leadRes.text().catch(() => "");
					errors.push(`Leads API (${leadRes.status}): ${errBody.slice(0, 180)}`);
				}
			} catch (err) {
				errors.push(`Leads API: ${formatError(err)}`);
			}
		}

		// Secondary & Identity-Linked Person Profile: Whop Events API (`lead` + `estimate_requested`)
		// Creates/links the visitor's Person profile on the account with email, phone, and address.
		try {
			const client = whopClient({ timeoutInSeconds: 8, maxRetries: 1 });
			const nameParts = data.name.trim().split(/\s+/);
			const firstName = nameParts[0] || data.name.trim();
			const lastName = nameParts.slice(1).join(" ") || undefined;

			const leadEvent = await client.events.create({
				account_id: accountId,
				event_name: "lead",
				action_source: "website",
				product_id: service.productId,
				value: service.price,
				currency: "usd",
				user: {
					email: data.email.trim(),
					name: data.name.trim(),
					first_name: firstName,
					last_name: lastName,
					phone: data.phone.trim() || undefined,
					city: data.city.trim() || undefined,
					state: data.state.trim() || undefined,
					postal_code: data.zip.trim() || undefined,
					country: "US",
				},
			});
			eventId =
				(leadEvent as { id?: string; event_id?: string }).id ??
				(leadEvent as { event_id?: string }).event_id ??
				`evt_lead_${Date.now()}`;

			// Mirror custom event `estimate_requested` server-side as well
			await client.events
				.create({
					account_id: accountId,
					event_name: "estimate_requested",
					action_source: "website",
					product_id: service.productId,
					value: service.price,
					currency: "usd",
					user: {
						email: data.email.trim(),
						name: data.name.trim(),
						postal_code: data.zip.trim() || undefined,
						country: "US",
					},
				})
				.catch(() => null);
		} catch (err) {
			errors.push(`Events API: ${formatError(err)}`);
		}

		if (!leadId && !eventId) {
			return {
				ok: false,
				accountId,
				leadId: null,
				eventId: null,
				leadsApiStatus,
				message:
					errors.join(" | ") ||
					"Could not reach Whop API. Verify WHOP_API_KEY is available in runtime.",
				recordedAt: new Date().toISOString(),
			};
		}

		return {
			ok: true,
			accountId,
			leadId,
			eventId,
			leadsApiStatus,
			message: leadId
				? `Estimate request recorded in Whop Leads API (${leadId}) and linked to People profile.`
				: `Estimate request recorded as a Whop Lead event (${eventId}) on account ${accountId}.`,
			recordedAt: new Date().toISOString(),
		};
	});

// ---------------------------------------------------------------------------
// 2. Whop Setup Intents API — Save Card on File at Deposit Checkout
// ---------------------------------------------------------------------------

export type SetupIntentInput = {
	confirmationToken: string;
	email: string;
	customerName: string;
	projectRef: string;
	returnUrl: string;
};

export type SetupIntentResult = {
	ok: boolean;
	setupIntentId: string | null;
	status: string;
	clientSecret: string | null;
	paymentMethodId: string | null;
	message: string;
};

export const createCardOnFileSetupIntent = createServerFn({ method: "POST" })
	.validator((input: SetupIntentInput) => input)
	.handler(async ({ data }): Promise<SetupIntentResult> => {
		const accountId = resolveAccountId();
		try {
			const client = whopClient({ timeoutInSeconds: 10, maxRetries: 1 });
			const created = await client.setupIntents.create({
				account_id: accountId,
				confirmation_token: data.confirmationToken,
				currency: "usd",
				email: data.email.trim(),
				return_url: data.returnUrl,
				metadata: {
					customer_name: data.customerName.trim(),
					project_ref: data.projectRef.trim(),
					flow: "roofing_deposit_card_on_file",
				},
			});

			let status: string = created.status ?? "processing";
			let paymentMethodId: string | null =
				(created as { payment_method_id?: string | null; payment_method?: { id?: string } | null })
					.payment_method_id ??
				(created as { payment_method?: { id?: string } | null }).payment_method?.id ??
				null;
			let clientSecret: string | null =
				(created as { client_secret?: string | null }).client_secret ?? null;

			// Poll setup status briefly to capture immediate frictionless completion + payt_ ID
			try {
				const st = await client.setupIntents.retrieveStatus({
					setup_intent_id: created.id,
				});
				const stObj = st as {
					status?: string;
					client_secret?: string | null;
					payment_method_id?: string | null;
					payment_method?: { id?: string } | null;
				};
				if (stObj.status) status = stObj.status;
				if (stObj.client_secret) clientSecret = stObj.client_secret;
				paymentMethodId =
					stObj.payment_method_id ?? stObj.payment_method?.id ?? paymentMethodId;
			} catch {
				// Status retrieval is optional on immediate creation
			}

			return {
				ok: true,
				setupIntentId: created.id,
				status,
				clientSecret,
				paymentMethodId,
				message: paymentMethodId
					? `Card saved on file (${paymentMethodId}) via Setup Intent ${created.id}. Ready for automated final balance invoicing!`
					: `Setup Intent ${created.id} created (status: ${status}).`,
			};
		} catch (err) {
			return {
				ok: false,
				setupIntentId: null,
				status: "failed",
				clientSecret: null,
				paymentMethodId: null,
				message: formatError(err),
			};
		}
	});

export const pollSetupIntentStatus = createServerFn({ method: "POST" })
	.validator((input: { setupIntentId: string }) => input)
	.handler(async ({ data }): Promise<SetupIntentResult> => {
		try {
			const client = whopClient({ timeoutInSeconds: 8, maxRetries: 1 });
			const st = await client.setupIntents.retrieveStatus({
				setup_intent_id: data.setupIntentId,
			});
			const stObj = st as {
				status?: string;
				client_secret?: string | null;
				payment_method_id?: string | null;
				payment_method?: { id?: string } | null;
			};
			const paymentMethodId =
				stObj.payment_method_id ?? stObj.payment_method?.id ?? null;
			return {
				ok: true,
				setupIntentId: data.setupIntentId,
				status: stObj.status ?? "processing",
				clientSecret: stObj.client_secret ?? null,
				paymentMethodId,
				message: paymentMethodId
					? `Card verified and saved (${paymentMethodId}).`
					: `Current Setup Intent status: ${stObj.status ?? "processing"}`,
			};
		} catch (err) {
			return {
				ok: false,
				setupIntentId: data.setupIntentId,
				status: "error",
				clientSecret: null,
				paymentMethodId: null,
				message: formatError(err),
			};
		}
	});

// ---------------------------------------------------------------------------
// 3. Whop Invoices API — Final Balance Billing (Manual Send OR Auto-Charge)
// ---------------------------------------------------------------------------

export type FinalInvoiceInput = {
	customerName: string;
	customerEmail: string;
	propertyAddress: string;
	city: string;
	state: string;
	zip: string;
	jobScopeMemo: string;
	collectionMode: "send_manual" | "auto_charge";
	paymentMethodId?: string;
	dueInDays?: number;
};

export type FinalInvoiceResult = {
	ok: boolean;
	invoiceId: string | null;
	status: string;
	collectionMode: "send_manual" | "auto_charge";
	amountFormatted: string;
	checkoutUrl: string | null;
	dueAt: string | null;
	message: string;
};

export const createFinalBalanceInvoice = createServerFn({ method: "POST" })
	.validator((input: FinalInvoiceInput) => input)
	.handler(async ({ data }): Promise<FinalInvoiceResult> => {
		const accountId = resolveAccountId();
		const dueDays = Math.max(1, Math.min(60, Number(data.dueInDays ?? 7)));
		const dueAt = new Date(Date.now() + dueDays * 86_400_000).toISOString();
		const savedMethod = data.paymentMethodId?.trim() || undefined;

		try {
			const client = whopClient({ timeoutInSeconds: 12, maxRetries: 1 });

			// Step 1: Create draft invoice backed by the real Final Project Balance variant ($2,450)
			const draft = await client.invoices.create({
				account_id: accountId,
				email_address: data.customerEmail.trim(),
				customer_name: data.customerName.trim(),
				items: [
					{
						variant_id: COMPANY_CONFIG.whop.finalBalancePlanId,
						quantity: 1,
					},
				],
				due_at: dueAt,
				memo:
					data.jobScopeMemo.trim() ||
					`Final balance for completed roofing project at ${data.propertyAddress.trim()}, ${data.city.trim()}, ${data.state.trim()} ${data.zip.trim()}. Thank you for choosing ${COMPANY_CONFIG.name}!`,
				metadata: {
					property_address: data.propertyAddress.trim(),
					city: data.city.trim(),
					state: data.state.trim(),
					zip: data.zip.trim(),
					collection_mode: data.collectionMode,
					template: "ironcrest-roofing-whop-website",
				},
				...(data.collectionMode === "auto_charge" && savedMethod
					? { payment_method_id: savedMethod }
					: {}),
			});

			// Step 2: Attempt to issue or send the live invoice. If the demo account hasn't
			// completed merchant KYC yet, return the real created Whop draft invoice cleanly.
			let finalized: unknown = draft;
			const draftRaw = draft as unknown as Record<string, unknown>;
			const invoiceNumber =
				typeof draftRaw.number === "string" ? ` (${draftRaw.number})` : "";
			let actionNote = "";

			if (data.collectionMode === "auto_charge" && savedMethod) {
				try {
					finalized = await client.invoices.issue({
						id: draft.id,
						collection_method: "charge_automatically",
					});
					actionNote = `Issued Whop Invoice ${draft.id}${invoiceNumber} wired to auto-charge stored card ${savedMethod}.`;
				} catch (issueErr) {
					actionNote = `Created Whop Invoice ${draft.id}${invoiceNumber} wired to stored card ${savedMethod} (status: draft — ready to auto-charge once merchant verification is completed; Whop API: ${formatError(issueErr)}).`;
				}
			} else {
				try {
					finalized = await client.invoices.send({ id: draft.id });
					actionNote = `Created & sent Whop Invoice ${draft.id}${invoiceNumber} to ${data.customerEmail.trim()} for manual payment.`;
				} catch (sendErr) {
					actionNote = `Created real Whop Invoice ${draft.id}${invoiceNumber} for ${data.customerEmail.trim()} (status: draft — sending email requires merchant KYC on live accounts; buyers can also pay immediately via the Whop checkout link below. Whop API: ${formatError(sendErr)}).`;
				}
			}

			const inv = finalized as {
				id?: string;
				status?: string;
				checkout_link?: string | null;
				checkout_url?: string | null;
				hosted_invoice_url?: string | null;
				current_plan?: { purchase_url?: string | null } | null;
			};

			const checkoutUrl =
				inv.checkout_link ??
				inv.checkout_url ??
				inv.hosted_invoice_url ??
				inv.current_plan?.purchase_url ??
				`/checkout/${COMPANY_CONFIG.whop.finalBalancePlanId}`;

			return {
				ok: true,
				invoiceId: inv.id ?? draft.id,
				status: inv.status ?? "open",
				collectionMode: data.collectionMode,
				amountFormatted: `$${COMPANY_CONFIG.whop.finalBalanceAmount.toLocaleString()}.00`,
				checkoutUrl,
				dueAt,
				message: actionNote,
			};
		} catch (err) {
			return {
				ok: false,
				invoiceId: null,
				status: "error",
				collectionMode: data.collectionMode,
				amountFormatted: `$${COMPANY_CONFIG.whop.finalBalanceAmount.toLocaleString()}.00`,
				checkoutUrl: null,
				dueAt,
				message: formatError(err),
			};
		}
	});

export type InvoiceSummaryRow = {
	id: string;
	status: string;
	email: string | null;
	createdAt: string | null;
	dueAt: string | null;
	memo: string | null;
};

export const listRecentInvoices = createServerFn({ method: "GET" }).handler(
	async (): Promise<{ ok: boolean; invoices: InvoiceSummaryRow[] }> => {
		try {
			const accountId = resolveAccountId();
			const client = whopClient({ timeoutInSeconds: 6, maxRetries: 1 });
			const page = await client.invoices.list({
				account_id: accountId,
				first: 6,
			});
			const invoices: InvoiceSummaryRow[] = (page.data ?? []).map((item) => {
				const raw = item as unknown as Record<string, unknown>;
				return {
					id: String(raw.id ?? ""),
					status: String(raw.status ?? "draft"),
					email:
						typeof raw.email_address === "string"
							? raw.email_address
							: null,
					createdAt:
						typeof raw.created_at === "string" ? raw.created_at : null,
					dueAt: typeof raw.due_at === "string" ? raw.due_at : null,
					memo: typeof raw.memo === "string" ? raw.memo : null,
				};
			});
			return { ok: true, invoices };
		} catch {
			return { ok: false, invoices: [] };
		}
	},
);
