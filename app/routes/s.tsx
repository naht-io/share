import type { Content } from "@tiptap/react";
import { formatDistanceToNow } from "date-fns";
import { NavLink } from "react-router";

import { Editor } from "~/components/Editor";
import type { Route } from "./+types/s";

type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export async function loader(): Promise<{
  data: { content: Json; created_at: string; expires_at: string } | null;
}> {
  throw new Error("Not implemented");
}

export default function SharePage({ loaderData }: Route.ComponentProps) {
  const share = loaderData.data;

  return (
    <div className="flex h-screen items-center justify-center p-4">
      {share && (
        <div className="w-full max-w-prose space-y-4">
          <main className="border border-zinc-300 dark:border-zinc-700">
            <Editor editable={false} content={share.content as Content} />
          </main>
          <aside>
            <div className="flex flex-col justify-between gap-4 font-mono text-xs text-zinc-900 sm:flex-row dark:text-zinc-200">
              <div>
                <div title={share.expires_at} className="font-bold">
                  Expires {formatDistanceToNow(share.expires_at, { addSuffix: true })}
                </div>
                <div title={share.created_at}>
                  Created {formatDistanceToNow(share.created_at, { addSuffix: true })}
                </div>
              </div>
              <div className="text-right">
                <div>Created with ./?share</div>
                <NavLink to="/" className="underline" end>
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
