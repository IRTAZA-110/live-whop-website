import { COMPANY_CONFIG } from "../../config/company";

export function Footer() {
	return (
		<footer className="mt-auto border-t border-slate-800 bg-slate-950 py-10 text-slate-400">
			<div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-xs sm:flex-row sm:px-6 lg:px-8">
				<div>
					<p className="font-bold text-white">{COMPANY_CONFIG.name}</p>
					<p className="mt-1">{COMPANY_CONFIG.licenseNumber}</p>
				</div>
				<div className="flex flex-wrap items-center gap-4">
					<a href="/#services" className="hover:text-white">
						Services
					</a>
					<a href="/#deposit-flow" className="hover:text-white">
						Whop Billing Flow
					</a>
					<a href="/#estimate" className="hover:text-white">
						Request Estimate
					</a>
					<span className="text-slate-600">·</span>
					<span>Powered by Whop Websites &amp; Whop Payments</span>
				</div>
			</div>
		</footer>
	);
}
