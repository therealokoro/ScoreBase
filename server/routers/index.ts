import type { RouterClient } from "@orpc/server";

import { baseORPC } from "../utils/orpc";
// import { classRouter } from "./class.router"
import { academicSessionRouter } from "./session.router";
// import { subjectRouter } from "./subject.router"
// import { classSubjectRouter } from "./subjectList.router"
// import { teacherRouter } from "./teacher.router"
// import { termRouter } from "./term.router"

export const apiRouter = {
  health: baseORPC.handler(() => ({ status: "ok", timestamp: Date.now() })),
  academicSession: academicSessionRouter,
  // term: termRouter,
  // class: classRouter,
  // teacher: teacherRouter,
  // subject: subjectRouter,
  // classSubject: classSubjectRouter
};

export type APIRouter = typeof apiRouter;
export type APIRouterClient = RouterClient<APIRouter>;
