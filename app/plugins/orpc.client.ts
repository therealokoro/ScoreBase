import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { SimpleCsrfProtectionLinkPlugin } from "@orpc/client/plugins";
import type { RouterClient } from "@orpc/server";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import type { apiRouter } from "~~/server/routers";

export default defineNuxtPlugin(() => {
  const link = new RPCLink({
    url: `${window.location.origin}/rpc`,
    fetch(url, options) {
      return fetch(url, {
        ...options,
        credentials: "include",
      });
    },
    headers: useRequestHeaders(),
    plugins: [new SimpleCsrfProtectionLinkPlugin()],
  });

  const client = createORPCClient<RouterClient<typeof apiRouter>>(link);
  const orpc = createTanstackQueryUtils(client);

  return { provide: { orpc } };
});
