import { Link } from "@tanstack/react-router";
import type { WhopConstructor } from "@whop/elements";
import {
	Checkout,
	CheckoutElement,
	ExpressCheckoutElement,
	WhopElements,
} from "@whop/elements-react";
import { useEffect, useState } from "react";
import type { RoofingServiceConfig } from "../../config/company";
import { ENVIRONMENT, loadElements } from "../../lib/checkout/environment";
import { trackRoofingEvent } from "../../lib/tracking";

type PaymentElementsModalProps = {
	service: RoofingServiceConfig | null;
	onClose: () => void;
};

export function PaymentElementsModal({
	service,
	onClose,
}: PaymentElementsModalProps) {
	const [elements, setElements] = useState<Promise<WhopConstructor> | null>(
		null,
	);
	const [completedPaymentId, setCompletedPaymentId] = useState<string | null>(
		null,
	);

	useEffect(() => {
		if (!service) return;
		setCompletedPaymentId(null);
		setElements(loadElements());
		trackRoofingEvent("deposit_started", {
			service_id: service.id,
			service_name: service.title,
			plan_id: service.planId,
			product_id: service.productId,
			amount: service.price,
			currency: "USD",
			checkout_surface: "embedded_whop_checkout_elements",
		});
	}, [service]);

	if (!service) return null;

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm"
			role="dialog"
			aria-modal="true"
			aria-labelledby="whop-checkout-modal-title"
		>
			<div className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
				{/* Header */}
				<div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-slate-900 px-6 py-4 text-white">
					<div>
						<div className="flex items-center gap-2">
							<span className="inline-flex items-center rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-semibold text-amber-300">
								Whop Payment Elements
							</span>
							<span className="text-xs text-slate-400">{service.planId}</span>
						</div>
						<h3
							id="whop-checkout-modal-title"
							className="mt-1 text-lg font-bold tracking-tight"
						>
							{service.title} — {service.priceLabel}
						</h3>
						<p className="text-xs text-slate-300">{service.billingNote}</p>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="rounded-lg p-1.5 text-slate-300 transition hover:bg-slate-800 hover:text-white"
						aria-label="Close checkout"
					>
						<svg
							className="h-5 w-5"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
						>
							<path d="M18 6 6 18M6 6l12 12" />
						</svg>
					</button>
				</div>

				{/* Body */}
				<div className="overflow-y-auto p-6">
					{completedPaymentId ? (
						<div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
							<p className="text-sm font-semibold uppercase tracking-wider text-emerald-700">
								Payment Confirmed via Whop
							</p>
							<h4 className="mt-1 text-xl font-bold text-slate-900">
								Thank you! Your booking is locked in.
							</h4>
							<p className="mt-2 text-sm text-slate-600">
								Receipt / Payment ID:{" "}
								<code className="rounded bg-white px-2 py-0.5 font-mono text-xs text-slate-900">
									{completedPaymentId}
								</code>
							</p>
							<button
								type="button"
								onClick={onClose}
								className="mt-4 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
							>
								Return to IronCrest Roofing
							</button>
						</div>
					) : (
						<WhopElements elements={elements} environment={ENVIRONMENT}>
							<div className="space-y-5">
								{/* ExpressCheckoutElement and CheckoutElement each occupy the exclusive "entry" slot,
								    so each mounts under its own <Checkout> provider while sharing <WhopElements>. */}
								<Checkout
									key={`${service.planId}-express`}
									plan={service.planId}
									metadata={{
										service_id: service.id,
										service_title: service.title,
										surface: "express_checkout",
										template: "ironcrest-roofing-whop-website",
									}}
									onComplete={(result) => {
										const id =
											"paymentId" in result
												? result.paymentId
												: "setupIntentId" in result
													? result.setupIntentId
													: "completed";
										setCompletedPaymentId(String(id));
									}}
								>
									<div>
										<p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
											Express Checkout (Apple Pay / Google Pay)
										</p>
										<ExpressCheckoutElement />
									</div>
								</Checkout>

								<div className="relative flex items-center py-1">
									<div className="flex-grow border-t border-slate-200" />
									<span className="mx-3 flex-shrink text-xs font-medium text-slate-400">
										Cards · Financing (Klarna, Affirm, Afterpay, Splitit)
									</span>
									<div className="flex-grow border-t border-slate-200" />
								</div>

								<Checkout
									key={`${service.planId}-full`}
									plan={service.planId}
									metadata={{
										service_id: service.id,
										service_title: service.title,
										surface: "checkout_element",
										template: "ironcrest-roofing-whop-website",
									}}
									onComplete={(result) => {
										const id =
											"paymentId" in result
												? result.paymentId
												: "setupIntentId" in result
													? result.setupIntentId
													: "completed";
										setCompletedPaymentId(String(id));
									}}
									fallback={
										<div className="space-y-3 py-8 text-center">
											<div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
											<p className="text-sm text-slate-500">
												Loading Whop Payment Elements…
											</p>
										</div>
									}
								>
									<CheckoutElement />
								</Checkout>
							</div>
						</WhopElements>
					)}

					<div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 text-xs text-slate-500">
						<span>
							Need custom PaymentElement + BrandingElement full-page view?
						</span>
						<Link
							to="/checkout/$planId"
							params={{ planId: service.planId }}
							onClick={onClose}
							className="font-semibold text-amber-700 underline decoration-amber-400 underline-offset-2 hover:text-amber-800"
						>
							Open Full-Page PaymentElement Checkout →
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
}
