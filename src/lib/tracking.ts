import { create } from "zustand";
import { trackPixel } from "./checkout/pixel";

export type PixelEventName =
	| "service_viewed"
	| "estimate_requested"
	| "deposit_started"
	| "lead"
	| "invoice_created";

export type PixelEventEntry = {
	id: string;
	event: PixelEventName;
	data: Record<string, unknown>;
	timestamp: string;
	whopPixelPresent: boolean;
};

type PixelLogState = {
	events: PixelEventEntry[];
	drawerOpen: boolean;
	record: (entry: PixelEventEntry) => void;
	setDrawerOpen: (open: boolean) => void;
	toggleDrawer: () => void;
};

export const usePixelLog = create<PixelLogState>((set) => ({
	events: [],
	drawerOpen: false,
	record: (entry) =>
		set((state) => ({
			events: [entry, ...state.events].slice(0, 25),
		})),
	setDrawerOpen: (open) => set({ drawerOpen: open }),
	toggleDrawer: () => set((state) => ({ drawerOpen: !state.drawerOpen })),
}));

/**
 * Fires a Whop custom pixel event via `window.whop.track(event, data)` (injected on
 * whop.app / *.whop.site hosting) and records it in the live event log + console
 * so every event (`service_viewed`, `estimate_requested`, `deposit_started`) is
 * immediately verifiable in DevTools and on-screen.
 */
export function trackRoofingEvent(
	event: PixelEventName,
	data: Record<string, unknown>,
) {
	const pixel: unknown =
		typeof globalThis !== "undefined" ? Reflect.get(globalThis, "whop") : null;
	const whopPixelPresent =
		typeof pixel === "object" &&
		pixel !== null &&
		"track" in pixel &&
		typeof (pixel as { track?: unknown }).track === "function";

	trackPixel(event, data);

	if (typeof console !== "undefined") {
		console.info(`[whop.track] ${event}`, data);
	}

	usePixelLog.getState().record({
		id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
		event,
		data,
		timestamp: new Date().toLocaleTimeString(),
		whopPixelPresent,
	});
}
