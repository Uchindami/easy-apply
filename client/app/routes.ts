import {
    type RouteConfig,
    route,
    index,
    layout,
    prefix,
  } from "@react-router/dev/routes";

export default [
    index("routes/home.tsx"),
    route("login", "routes/login.tsx"),
    route("signup", "routes/signup.tsx"),

    // Dashboard routes
    route("dashboard", "routes/dashboard/index.tsx", [
        index("routes/dashboard/home.tsx"),
        route("profile", "routes/dashboard/profile.tsx"),
        route("settings", "routes/dashboard/settings.tsx"),
        route("search", "routes/dashboard/search.tsx"),
        route("suggestions", "routes/dashboard/suggestions.tsx"),
        route("chat/:chatId", "routes/dashboard/chat.tsx"),
        // route("jobs", "routes/dashboard/jobs.tsx"),
    ]),
] satisfies RouteConfig;
    