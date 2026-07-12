import type { Content } from "@tiptap/react";
import { formatDistanceToNow } from "date-fns";
import { and, count, desc, eq, gt } from "drizzle-orm";
import { CheckIcon, CopyIcon, SendIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState, type FormEvent } from "react";
import { Link, NavLink, redirect, useNavigation } from "react-router";

import paperBoat from "~/assets/paper-boat.png";
import { Button } from "~/components/Button";
import { Editor } from "~/components/editor/Editor";
import { Form } from "~/components/Form";
import { maxSubmissions } from "~/core/.server/forms";
import { getFormNodes, maxValueLength, type FormResults } from "~/core/forms";
import type { Json } from "~/core/json";
import { db } from "~/db/index.server";
import { shareTable, submissionTable } from "~/db/schema.server";

import type { Route } from "./+types/page";

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

type ShareForm =
  | { mode: "form"; hasFormNodes: boolean }
  | { mode: "results"; results: FormResults };

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

  const formNodes = getFormNodes(share.content);
  let form: ShareForm;
  if (url.searchParams.has("results") && formNodes.length > 0) {
    const rows = await db
      .select({ data: submissionTable.data })
      .from(submissionTable)
      .where(eq(submissionTable.shareId, id))
      .orderBy(desc(submissionTable.createdAt), desc(submissionTable.id));

    const results: FormResults = {};
    for (const node of formNodes) {
      results[node.id] = [];
      for (const { data } of rows) {
        if (data === null || typeof data !== "object" || Array.isArray(data)) continue;
        const value = data[node.id];
        if (typeof value === "string" && value.trim() !== "") {
          results[node.id].push(value);
        }
      }
    }
    form = { mode: "results", results };
  } else {
    // A `?results` link to a share without form nodes just renders the share.
    form = { mode: "form", hasFormNodes: formNodes.length > 0 };
  }

  // The copyable/canonical link is the share itself, not the results view.
  url.search = "";

  return {
    data: {
      content: share.content,
      createdAt: share.createdAt.toISOString(),
      expiresAt: share.expiresAt.toISOString(),
      url: url.href,
    },
    form,
  };
}

export async function action({ params, request }: Route.ActionArgs) {
  const { id } = params;
  if (!id) {
    throw new Response("ID is required", { status: 400 });
  }

  const [share] = await db
    .select({ content: shareTable.content })
    .from(shareTable)
    .where(and(eq(shareTable.id, id), gt(shareTable.expiresAt, new Date())))
    .limit(1);
  if (!share) {
    throw new Response(null, { status: 404 });
  }

  const formNodes = getFormNodes(share.content);
  if (formNodes.length === 0) {
    throw new Response("Share has no form fields", { status: 400 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    throw new Response("Invalid form data", { status: 400 });
  }

  const nodeIds = new Set(formNodes.map((node) => node.id));
  for (const key of formData.keys()) {
    if (!nodeIds.has(key)) {
      throw new Response("Unknown field", { status: 400 });
    }
  }

  const data: Record<string, string> = {};
  let hasValue = false;
  for (const node of formNodes) {
    const raw = formData.get(node.id);
    const value = typeof raw === "string" ? raw : "";
    if (value.length > maxValueLength) {
      throw new Response("Value too long", { status: 400 });
    }
    if (node.required && value.trim() === "") {
      throw new Response("Missing required field", { status: 400 });
    }
    if (value.trim() !== "") {
      hasValue = true;
    }
    data[node.id] = value;
  }
  // An all-empty submission carries no information; don't store the noise.
  if (!hasValue) {
    throw new Response("Empty submission", { status: 400 });
  }

  const [{ total }] = await db
    .select({ total: count() })
    .from(submissionTable)
    .where(eq(submissionTable.shareId, id));
  if (total >= maxSubmissions) {
    throw new Response("Submission limit reached", { status: 429 });
  }

  await db.insert(submissionTable).values({ shareId: id, data: data as Json });

  return redirect(`/s/${id}?results`);
}

export default function SharePage({ loaderData, params }: Route.ComponentProps) {
  const share = loaderData.data;
  const form = loaderData.form;
  const navigation = useNavigation();
  const [hasValue, setHasValue] = useState(false);
  const isSubmitting = navigation.state !== "idle";

  const content = (
    <main className="border border-zinc-300 dark:border-zinc-700 shadow-sm dark:shadow-black/50 bg-zinc-50 dark:bg-zinc-900">
      <Editor
        content={share.content as Content}
        basePath={`/s/${params.id}/files`}
        mode={
          form.mode === "results" ? { mode: "results", results: form.results } : { mode: "form" }
        }
      />
    </main>
  );

  // Mirrors the server's all-empty rejection: Submit stays disabled until at
  // least one field holds a non-blank value.
  function handleInput(event: FormEvent<HTMLFormElement>) {
    const values = [...new FormData(event.currentTarget).values()];
    setHasValue(values.some((value) => typeof value === "string" && value.trim() !== ""));
  }

  return (
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
        {form.mode === "form" && form.hasFormNodes ? (
          <Form method="post" className="space-y-4" onInput={handleInput}>
            {content}
            <div className="flex justify-end">
              <Button type="submit" isDisabled={isSubmitting || !hasValue}>
                Submit
                <SendIcon className="size-4" />
              </Button>
            </div>
          </Form>
        ) : (
          content
        )}
        {form.mode === "results" && (
          <div className="flex justify-end text-xs">
            <NavLink
              to={`/s/${params.id}`}
              className="underline text-zinc-900 dark:text-zinc-200"
              end
            >
              View form
            </NavLink>
          </div>
        )}
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
