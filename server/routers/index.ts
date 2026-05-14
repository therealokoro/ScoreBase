import type { RouterClient } from "@orpc/server";

import { baseORPC } from "../utils/orpc";
import { termRouter } from "./term.router";
import { academicSessionRouter } from "./session.router";
import { subjectRouter } from "./subject.router";
// import { classRouter } from "./class.router"
// import { classSubjectRouter } from "./subjectList.router"
// import { teacherRouter } from "./teacher.router"

export const apiRouter = {
  health: baseORPC.handler(() => ({ status: "ok", timestamp: Date.now() })),
  academicSession: academicSessionRouter,
  term: termRouter,
  subject: subjectRouter,
  // class: classRouter,
  // teacher: teacherRouter,
  // classSubject: classSubjectRouter
};

export type APIRouter = typeof apiRouter;
export type APIRouterClient = RouterClient<APIRouter>;
