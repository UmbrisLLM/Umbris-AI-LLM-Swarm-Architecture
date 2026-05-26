"use client";

import { useEffect } from "react";
import { useEngineStore } from "@/store/useEngineStore";

/**
 * Client-side provider that boots the engine on mount. Mount once at
 * the top of the React tree (inside RootLayout's <body>).
 */
export function EngineProvider({ children }: { children: React.ReactNode }) {
  const init = useEngineStore((s) => s.init);
  useEffect(() => {
    init();
  }, [init]);
  return <>{children}</>;
}
