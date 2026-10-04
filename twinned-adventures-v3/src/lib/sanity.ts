// Build-time only. Never import this module from a browser script.
export async function loadTour() {
	const {
		SANITY_PROJECT_ID: project,
		SANITY_DATASET: dataset,
		SANITY_API_TOKEN: token,
	} = import.meta.env;
	if (!project || !dataset || !token) return null;
	const query =
		'{"tour": *[_type=="tour"][0], "settings": *[_type=="siteSettings"][0], "faq": *[_type=="faq"]|order(order asc), "reviews": *[_type=="reviewSubmission" && status=="approved"]{name,country,rating,message,response,verified,experienceDate}}';
	const url = new URL(
		`https://${project}.api.sanity.io/v2025-02-19/data/query/${dataset}`,
	);
	url.searchParams.set("query", query);
	const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
	if (!r.ok) throw new Error("Unable to read Sanity content");
	return (await r.json()).result;
}
