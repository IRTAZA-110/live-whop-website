import type { ReactNode } from "react";
import { useEffect } from "react";
import {
	createRootRoute,
	HeadContent,
	Outlet,
	Scripts,
	useRouterState,
} from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { CartDrawer } from "../components/cart/CartDrawer";
import { Footer } from "../components/layout/Footer";
import { Header } from "../components/layout/Header";
import { useCartStore } from "../lib/cart";
import { locatedOrUnknown } from "../lib/checkout/countries";
import { buyerCountry } from "../lib/checkout/order.server";
import { ORDER_COMPLETE_PATH } from "../lib/checkout/shared";
import { COMPANY_CONFIG } from "../config/company";
// This file replaces the one the scaffold generated, which is where the global
// stylesheet was imported — without this line Tailwind and the reset never load.
import styles from "../styles.css?url";

const WHOP_PIXEL_SNIPPET = `!function(w,d,s,u,n,a,b){if(w[n])return;a=w[n]={q:[],t:+new Date,s:[],o:u,track:function(){a.q.push([+new Date].concat([].slice.call(arguments)))},setScope:function(){a.s=[].slice.call(arguments).filter(function(x){return typeof x==="string"});a.q.push([+new Date,"setScope"].concat(a.s))},scope:function(){var c=[].slice.call(arguments);return{track:function(){a.q.push([+new Date].concat([].slice.call(arguments)).concat([{__scope:c}]))}}}};b=d.createElement(s);b.async=1;b.src=u+"/s.js";d.getElementsByTagName(s)[0].parentNode.insertBefore(b,d.getElementsByTagName(s)[0])}(window,document,"script","https://t.whop.tw","whop");whop.setScope("${COMPANY_CONFIG.whop.accountId}");`;

function RootDocument({ children }: { children: ReactNode }) {
	return (
		<html lang="en">
			<head>
				<HeadContent />
				<script dangerouslySetInnerHTML={{ __html: WHOP_PIXEL_SNIPPET }} />
			</head>
			{/* Scripts belongs inside body: as a sibling of body the browser moves
			    it on parse, and the relocated nodes no longer match hydration. */}
			<body>
				{children}
				<Scripts />
			</body>
		</html>
	);
}

// Read when the server renders the first page: Cloudflare places the buyer by
// IP, which doesn't change between pages, so navigating never reads it again.
const loadBuyerCountry = createServerFn({ method: "GET" }).handler(() => ({
	buyerCountry: buyerCountry() ?? null,
}));

function RootLayout() {
	const cartOpen = useCartStore((state) => state.open);
	const openCart = useCartStore((state) => state.openCart);
	const closeCart = useCartStore((state) => state.closeCart);
	const cartCount = useCartStore((state) =>
		state.lines.reduce((total, line) => total + line.quantity, 0),
	);
	useEffect(() => {
		void useCartStore.persist.rehydrate();
	}, []);
	// Checkout and order confirmation draw their own header, and store links
	// there would pull the buyer away mid-purchase.
	const pathname = useRouterState({
		select: (state) => state.location.pathname,
	});
	const focused =
		pathname.startsWith("/checkout") ||
		pathname.startsWith(ORDER_COMPLETE_PATH);

	if (focused) return <Outlet />;

	return (
		<div
			style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
		>
			<Header onCartOpen={openCart} cartCount={cartCount} />
			<main style={{ flex: 1 }}>
				<Outlet />
			</main>
			<Footer />
			<CartDrawer open={cartOpen} onClose={closeCart} />
		</div>
	);
}

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{ content: "width=device-width, initial-scale=1", name: "viewport" },
			{ title: `${COMPANY_CONFIG.name} | US Roofing Whop Template` },
		],
		links: [
			{ rel: "stylesheet", href: styles },
			{
				rel: "icon",
				type: "image/svg+xml",
				href: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%23d97706'/%3E%3Ctext x='50%25' y='55%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial,sans-serif' font-weight='900' font-size='15' fill='%230f172a'%3EIR%3C/text%3E%3C/svg%3E",
			},
		],
	}),
	loader: () => locatedOrUnknown(loadBuyerCountry()),
	staleTime: Number.POSITIVE_INFINITY,
	component: RootLayout,
	shellComponent: RootDocument,
});
