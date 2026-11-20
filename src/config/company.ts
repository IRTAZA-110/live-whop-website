/**
 * Single-file white-label configuration for the US Roofing Whop Website Template.
 *
 * Swap company name, branding, contact info, service areas, reviews, and Whop plan/product IDs
 * here to pitch or deploy for any US roofing contractor without touching page layouts or API code.
 */

export type RoofingServiceConfig = {
	id: "inspection" | "repair" | "replacement";
	category: "Inspection" | "Repair" | "Replacement";
	title: string;
	tagline: string;
	price: number;
	priceLabel: string;
	billingNote: string;
	badge?: string;
	planId: string;
	productId: string;
	features: string[];
	ctaLabel: string;
};

export const COMPANY_CONFIG = {
	name: "IronCrest Roofing & Exteriors",
	shortName: "IronCrest Roofing",
	tagline: "Licensed US Residential & Storm-Damage Roofing — Powered by Whop Payments",
	phone: "(469) 555-0194",
	phoneHref: "tel:+14695550194",
	email: "estimates@ironcrestroofing.example",
	licenseNumber: "TX RCAT #RC-48291 · Insured $2M General Liability",
	headquarters: "2450 N Central Expy, Suite 400, Plano, TX 75074",
	hours: "Mon–Sat 7:00 AM – 7:00 PM · 24/7 Emergency Tarping",
	accentColor: "#d97706",
	whop: {
		accountId: "biz_6dNl1FHaawaN37",
		domain: "ironcrest-roofing-usa.whop.site",
		finalBalancePlanId: "plan_cPJ4wJpDHNhpt",
		finalBalanceProductId: "prod_LsN9tYetPq46O",
		finalBalanceAmount: 2450,
	},
	stats: [
		{ value: "4.9 / 5", label: "480+ Verified US Homeowner Reviews" },
		{ value: "25-Yr", label: "Workmanship & Leak-Free Warranty" },
		{ value: "24 hr", label: "Emergency Storm Inspection SLA" },
		{ value: "0% APR", label: "Financing via Whop Payments" },
	],
	services: [
		{
			id: "inspection",
			category: "Inspection",
			title: "21-Point Drone Roof Inspection",
			tagline: "Thermal leak scan, shingle wear grading, and insurance-ready photo report.",
			price: 149,
			priceLabel: "$149",
			billingNote: "One-time fee · Credited toward any repair or replacement",
			badge: "Most Popular First Step",
			planId: "plan_MWafPcByLgLKc",
			productId: "prod_DyJFcgtyJ1QK0",
			features: [
				"High-resolution 4K drone aerial imagery & hail-bruise mapping",
				"Attic moisture, decking & flashing thermal inspection",
				"Same-day PDF report + written itemized quote",
				"100% credited if you book a repair or replacement within 30 days",
			],
			ctaLabel: "Book $149 Inspection",
		},
		{
			id: "repair",
			category: "Repair",
			title: "Emergency Leak & Shingle Repair",
			tagline: "Flat-rate rapid leak stop for active leaks, blown-off shingles, and pipe boots.",
			price: 349,
			priceLabel: "$349",
			billingNote: "Flat-rate service · Same-week certified crew dispatch",
			badge: "Flat-Rate Service",
			planId: "plan_zY6wbWqsVCpkP",
			productId: "prod_nH4CxXttc2F7R",
			features: [
				"Replace up to 15 matching architectural shingles",
				"Reseal chimney flashing, valleys, and neoprene pipe boots",
				"Water-test verification & before/after photo proof",
				"2-year no-leak workmanship guarantee on repaired area",
			],
			ctaLabel: "Book $349 Flat-Rate Repair",
		},
		{
			id: "replacement",
			category: "Replacement",
			title: "Full Roof Replacement Deposit",
			tagline: "Lock your build date, order Class 4 impact-resistant shingles, and save your card on file.",
			price: 500,
			priceLabel: "$500",
			billingNote: "Project deposit · Remaining balance invoiced upon walkthrough",
			badge: "Deposit → Final Invoice",
			planId: "plan_YRLcH94ZLH45R",
			productId: "prod_41HEQvDeCekKV",
			features: [
				"Locks crew schedule & locks material pricing for 45 days",
				"GAF Timberline HDZ® or Class 4 Impact-Resistant options",
				"Card-on-file setup intent for effortless final balance billing",
				"Financing (Klarna, Affirm, Afterpay, Splitit) surfaces automatically at checkout",
			],
			ctaLabel: "Pay $500 Project Deposit",
		},
	] satisfies RoofingServiceConfig[],
	financingPartners: [
		{ name: "Klarna", detail: "Pay in 4 or monthly installments" },
		{ name: "Affirm", detail: "3 to 36 month fixed-rate plans" },
		{ name: "Afterpay", detail: "4 interest-free biweekly payments" },
		{ name: "Splitit", detail: "Use existing credit card with 0% interest" },
	],
	serviceArea: {
		regionTitle: "Greater Dallas–Fort Worth & North Texas",
		summary:
			"Locally dispatched crews within 45 miles of Plano, TX. Same-day emergency tarping after hail and wind events.",
		cities: [
			"Plano",
			"Frisco",
			"McKinney",
			"Dallas",
			"Richardson",
			"Allen",
			"Carrollton",
			"Irving",
			"Garland",
			"Prosper",
			"Flower Mound",
			"Fort Worth",
		],
		coveredZips: [
			"75023",
			"75024",
			"75025",
			"75034",
			"75035",
			"75070",
			"75071",
			"75074",
			"75075",
			"75080",
			"75081",
			"75093",
			"75201",
			"75204",
			"75206",
			"75230",
			"76092",
			"76102",
		],
	},
	certifications: [
		"GAF Master Elite® Contractor (Top 2% US)",
		"Owens Corning Preferred Contractor",
		"BBB A+ Accredited Business",
		"HAAG Certified Storm Inspector",
	],
	reviews: [
		{
			author: "Marcus & Elena R.",
			location: "Frisco, TX",
			rating: 5,
			service: "Full Roof Replacement",
			quote:
				"Booked the $149 drone inspection on Monday, paid our $500 deposit with Apple Pay right on their site, and our crew finished the full replacement in one day. Paying the final Whop invoice after walkthrough was seamless.",
		},
		{
			author: "David K.",
			location: "Plano, TX",
			rating: 5,
			service: "Emergency Leak Repair",
			quote:
				"After a midnight hailstorm soaked our ceiling, I booked the $349 flat-rate repair online. Transparent pricing with zero pushy sales pitch—they sealed two cracked pipe boots and sent thermal photos the same afternoon.",
		},
		{
			author: "Sarah T.",
			location: "McKinney, TX",
			rating: 5,
			service: "21-Point Inspection + Insurance Claim",
			quote:
				"Their 21-point drone photo report got our insurance adjuster to approve a full replacement on the first visit. Financing options showed up automatically at checkout so we didn't drain our savings.",
		},
	],
} as const;
