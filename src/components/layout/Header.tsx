import { Link } from "@tanstack/react-router";
import { COMPANY_CONFIG } from "../../config/company";

type HeaderProps = {
	onCartOpen: () => void;
	cartCount: number;
};

export function Header({ onCartOpen: _onCartOpen, cartCount: _cartCount }: HeaderProps) {
	return (
		<header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/95 text-white backdrop-blur">
			<div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
				<Link
					to="/"
					className="flex items-center gap-2.5 text-base font-extrabold tracking-tight text-white no-underline"
				>
					<span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 text-sm font-black text-slate-950">
						IR
					</span>
					<span>{COMPANY_CONFIG.shortName}</span>
				</Link>

				<nav className="hidden items-center gap-6 text-xs font-semibold text-slate-300 md:flex">
					<a href="/#services" className="transition hover:text-amber-400">
						Services
					</a>
					<a href="/#financing" className="transition hover:text-amber-400">
						Financing
					</a>
					<a href="/#deposit-flow" className="transition hover:text-amber-400">
						Deposit &amp; Invoicing
					</a>
					<a href="/#service-area" className="transition hover:text-amber-400">
						Service Area
					</a>
					<a href="/#reviews" className="transition hover:text-amber-400">
						Reviews
					</a>
					<a href="/#contact" className="transition hover:text-amber-400">
						Contact
					</a>
				</nav>

				<div className="flex items-center gap-2.5">
					<a
						href={COMPANY_CONFIG.phoneHref}
						className="hidden text-xs font-semibold text-slate-300 hover:text-white sm:inline"
					>
						{COMPANY_CONFIG.phone}
					</a>
					<a
						href="/#estimate"
						className="rounded-lg bg-amber-500 px-3.5 py-2 text-xs font-bold text-slate-950 transition hover:bg-amber-400"
					>
						Free Estimate
					</a>
				</div>
			</div>
		</header>
	);
}
