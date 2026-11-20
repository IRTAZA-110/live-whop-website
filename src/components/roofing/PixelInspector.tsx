import { usePixelLog } from "../../lib/tracking";

const REQUIRED_EVENTS = [
	"service_viewed",
	"deposit_started",
	"estimate_requested",
] as const;

export function PixelInspector() {
	const events = usePixelLog((s) => s.events);
	const drawerOpen = usePixelLog((s) => s.drawerOpen);
	const toggleDrawer = usePixelLog((s) => s.toggleDrawer);

	const firedSet = new Set(events.map((e) => e.event));

	return (
		<div className="fixed right-4 bottom-4 z-40 flex flex-col items-end">
			{drawerOpen ? (
				<div className="mb-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 text-white shadow-2xl">
					<div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
						<div>
							<p className="text-xs font-bold text-amber-400">
								Whop Pixel Event Monitor
							</p>
							<p className="text-[11px] text-slate-400">
								Live <code>whop.track()</code> stream
							</p>
						</div>
						<button
							type="button"
							onClick={toggleDrawer}
							className="rounded px-2 py-1 text-xs text-slate-400 hover:bg-slate-800 hover:text-white"
						>
							Close
						</button>
					</div>

					{/* Required checklist */}
					<div className="flex flex-wrap gap-1.5 border-b border-slate-800 bg-slate-900/70 px-4 py-2.5">
						{REQUIRED_EVENTS.map((name) => {
							const ok = firedSet.has(name);
							return (
								<span
									key={name}
									className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold ${
										ok
											? "bg-emerald-500/20 text-emerald-300"
											: "bg-slate-800 text-slate-400"
									}`}
								>
									{ok ? "✓" : "○"} {name}
								</span>
							);
						})}
					</div>

					<div className="max-h-60 overflow-y-auto p-3">
						{events.length === 0 ? (
							<p className="py-4 text-center text-xs text-slate-400">
								Click a Service card, Deposit CTA, or submit the Estimate form
								to fire custom <code>whop.track</code> events.
							</p>
						) : (
							<ul className="space-y-2">
								{events.map((ev) => (
									<li
										key={ev.id}
										className="rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-[11px]"
									>
										<div className="flex items-center justify-between">
											<span className="font-mono font-bold text-amber-300">
												whop.track(&quot;{ev.event}&quot;)
											</span>
											<span className="text-[10px] text-slate-500">
												{ev.timestamp}
											</span>
										</div>
										<pre className="mt-1 overflow-x-auto font-mono text-[10px] text-slate-300">
											{JSON.stringify(ev.data)}
										</pre>
									</li>
								))}
							</ul>
						)}
					</div>
				</div>
			) : null}

			<button
				type="button"
				onClick={toggleDrawer}
				className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white shadow-lg transition hover:bg-slate-800"
			>
				<span className="h-2 w-2 rounded-full bg-emerald-400" />
				whop.track ({events.length})
			</button>
		</div>
	);
}
