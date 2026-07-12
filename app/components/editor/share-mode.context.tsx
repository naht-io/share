import { createContext, useContext } from "react";

import type { ShareMode } from "~/core/share";

export const ShareModeContext = createContext<ShareMode>({ mode: "edit" });

export function useShareMode(): ShareMode {
  return useContext(ShareModeContext);
}
