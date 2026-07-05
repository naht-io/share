import {
  isRouteErrorResponse,
  Link,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";

import "@fontsource-variable/space-grotesk/wght.css";
import "@fontsource/space-mono/400.css";
import "./app.css";
import { BackgroundDither } from "./components/Background";

export function links() {
  return [
    {
      rel: "icon",
      href: "/favicon.svg",
      type: "image/svg+xml",
    },
  ];
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404 ? "The requested page could not be found." : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <div className="flex flex-col h-screen">
      <BackgroundDither />
      <div className="flex-auto flex items-center justify-center p-4 md:py-24">
        <main className="p-4 text-zinc-900 dark:text-zinc-100 space-y-2">
          <h1 className="text-zinc-950 dark:text-zinc-50 text-9xl proportional-nums">{message}</h1>
          <div>
            <p>{details}</p>
            {stack && (
              <pre className="w-full p-4 overflow-x-auto font-mono">
                <code>{stack}</code>
              </pre>
            )}
            <p>
              <Link to="/" className="underline">
                Turn back, go home.
              </Link>
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
