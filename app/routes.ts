import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
  layout("routes/layout.tsx", [
    index("routes/page.tsx"),
    route("s/", "routes/s/page.ts"),
    route("s/:id", "routes/s/[id]/page.tsx"),
  ]),
  route("s/:id/files/:fileId", "routes/s/[id]/files/[fileId]/page.ts"),
] satisfies RouteConfig;
