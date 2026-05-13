import { os } from "@orpc/server";

export const baseORPC = os.$context();

export const publicProcedure = baseORPC;
