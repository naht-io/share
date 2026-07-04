import type { Content } from "@tiptap/react";
import { formatDistanceToNow } from "date-fns";
import { and, eq, gt } from "drizzle-orm";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router";

import { Editor } from "~/components/Editor";
import { db } from "~/db/index.server";
import { shareTable } from "~/db/schema.server";

import type { Route } from "./+types/s";
import { Button } from "~/components/Button";
import { CheckIcon, CopyIcon } from "lucide-react";

export function meta() {
  return [{ title: "./share" }];
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

  return {
    data: {
      content: share.content,
      createdAt: share.createdAt.toISOString(),
      expiresAt: share.expiresAt.toISOString(),
      url: new URL(request.url).href,
    },
  };
}

export default function SharePage({ loaderData }: Route.ComponentProps) {
  const share = loaderData.data;

  return (
    <div className="flex h-screen items-center justify-center p-4">
      {share && (
        <div className="w-full max-w-prose space-y-4">
          <aside>
            <CopyLink url={share.url} />
          </aside>
          <main className="border border-zinc-300 dark:border-zinc-700 shadow-sm">
            <Editor editable={false} content={share.content as Content} />
          </main>
          <aside>
            <div className="flex flex-col justify-between gap-4 text-xs text-zinc-700 dark:text-zinc-300 sm:flex-row">
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
      )}
    </div>
  );
}

function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  const [canCopy, setCanCopy] = useState(false);

  useEffect(() => {
    setCanCopy(typeof navigator !== "undefined" && !!navigator.clipboard);
  }, []);

  async function copy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="flex justify-end items-center gap-1">
      <span className="text-zinc-900 dark:text-zinc-200 underline text-xs select-all">{url}</span>
      <Button
        size="icon-xs"
        variant="text"
        onPress={copy}
        isDisabled={!canCopy}
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
