import type { Content } from "@tiptap/react";
import { formatDistanceToNow } from "date-fns";
import { and, eq, gt } from "drizzle-orm";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Link, NavLink } from "react-router";

import paperBoat from "~/assets/paper-boat.png";
import { Editor } from "~/components/Editor";
import { db } from "~/db/index.server";
import { shareTable } from "~/db/schema.server";

import type { Route } from "./+types/page";
import { Button } from "~/components/Button";
import { CheckIcon, CopyIcon } from "lucide-react";

export function meta({ loaderData }: Route.MetaArgs) {
  const share = loaderData.data;
  const description = `Someone shared something with you. Expires ${formatDistanceToNow(
    share.expiresAt,
    { addSuffix: true },
  )}.`;

  return [
    { title: "./share" },
    { name: "description", content: description },
    { property: "og:title", content: "./share" },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { property: "og:site_name", content: "./share" },
    { property: "og:url", content: share.url },
  ];
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const { id } = params;
  if (!id) {
    throw new Response("ID is required", { status: 400 });
  }

  const [share] = await db
    .select({
      content: shareTable.content,
      createdAt: shareTable.createdAt,
      expiresAt: shareTable.expiresAt,
    })
    .from(shareTable)
    .where(and(eq(shareTable.id, id), gt(shareTable.expiresAt, new Date())))
    .limit(1);
  if (!share) {
    throw new Response(null, { status: 404 });
  }

  const url = new URL(request.url);
  url.pathname = url.pathname.replace(/\.data$/, "");

  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0].trim();
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0].trim();
  if (forwardedProto) {
    url.protocol = forwardedProto;
  }
  if (forwardedHost) {
    // Clear the origin server's port first; the host setter keeps an existing
    // port when the new value has none.
    url.port = "";
    url.host = forwardedHost;
  }

  return {
    data: {
      content: share.content,
      createdAt: share.createdAt.toISOString(),
      expiresAt: share.expiresAt.toISOString(),
      url: url.href,
    },
  };
}

export default function SharePage({ loaderData, params }: Route.ComponentProps) {
  const share = loaderData.data;

  return (
    share && (
      <div className="grid w-full max-w-[calc(65ch+0.25rem*20)] grid-cols-1 gap-4 md:grid-cols-[auto_1fr]">
        <img
          src={paperBoat}
          alt=""
          className="w-16 md:w-32 justify-self-start md:sticky md:top-4 rounded-xs md:col-start-1 md:row-start-2"
        />
        <aside className="md:col-start-2 md:row-start-1">
          <CopyLink url={share.url} />
        </aside>
        <div className="min-w-0 space-y-4 md:col-start-2 md:row-start-2">
          <main className="border border-zinc-300 dark:border-zinc-700 shadow-sm dark:shadow-black/50 bg-zinc-50 dark:bg-zinc-900">
            <Editor
              editable={false}
              content={share.content as Content}
              fileDownloadBasePath={`/s/${params.id}/files`}
            />
          </main>
          <aside>
            <div className="flex justify-between gap-4 text-xs text-zinc-700 dark:text-zinc-300">
              <div>
                <div title={share.expiresAt} className="font-bold">
                  Expires {formatDistanceToNow(share.expiresAt, { addSuffix: true })}
                </div>
                <div title={share.createdAt}>
                  Created {formatDistanceToNow(share.createdAt, { addSuffix: true })}
                </div>
              </div>
              <div className="text-right">
                <div>
                  Created with{" "}
                  <Link
                    to="https://github.com/naht-io/share"
                    className="underline text-zinc-900 dark:text-zinc-200"
                  >
                    ./share
                  </Link>
                </div>
                <NavLink to="/" className="underline text-zinc-900 dark:text-zinc-200" end>
                  Share something else
                </NavLink>
              </div>
            </div>
          </aside>
        </div>
      </div>
    )
  );
}

function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
      } else {
        // Fallback for non-secure contexts (plain HTTP), where the
        // Clipboard API is unavailable
        const textarea = document.createElement("textarea");
        textarea.value = url;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        textarea.remove();
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Do nothing, clipboard not available
    }
  }

  return (
    <div className="flex justify-end items-center gap-1">
      <span className="text-zinc-900 dark:text-zinc-200 underline text-xs select-all">{url}</span>
      <Button
        size="icon-xs"
        variant="text"
        onPress={copy}
        aria-label="Copy link"
        className="grid place-items-center"
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={copied ? "check" : "copy"}
            className="col-start-1 row-start-1 flex"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.1 }}
          >
            {copied ? <CheckIcon className="size-4" /> : <CopyIcon className="size-4" />}
          </motion.span>
        </AnimatePresence>
      </Button>
    </div>
  );
}
