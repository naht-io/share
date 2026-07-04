import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/page.tsx"),
  route("s/", "routes/s/page.tsx"),
  route("s/:id", "routes/s/[id]/page.tsx"),
] satisfies RouteConfig;
