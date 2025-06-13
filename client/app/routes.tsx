import { type RouteConfig, route, index } from "@react-router/dev/routes";

export default [
	index("routes/home.tsx"),
	route("login", "routes/login.tsx"),
	route("signup", "routes/signup.tsx"),

	// Dashboard routes
	route("dashboard", "routes/dashboard/index.tsx", [
		index("routes/dashboard/home.tsx"),
		route("profile", "routes/dashboard/profile.tsx"),
		route("jobs", "routes/dashboard/jobs.tsx"),
		route("settings", "routes/dashboard/settings.tsx"),
		route("search", "routes/dashboard/search.tsx"),
		route("suggestions", "routes/dashboard/recommendations.tsx"),
		route("chatHistory/:chatHistoryId", "routes/dashboard/chat-history.tsx"),
		// route("jobs", "routes/dashboard/jobs.tsx"),
	]),
] satisfies RouteConfig;
