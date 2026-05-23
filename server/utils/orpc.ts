import { os } from "@orpc/server"

import { APiContext } from "../context"

export const baseORPC = os.$context<APiContext>()

export const publicProcedure = baseORPC
