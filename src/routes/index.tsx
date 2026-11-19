import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
	component: HomePage,
});

function HomePage() {
	return (
		<section style={{ padding: "2rem" }}>
			<p>Home page — the builder that owns this route replaces it.</p>
		</section>
	);
}
