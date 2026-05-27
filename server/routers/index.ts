import type { RouterClient } from "@orpc/server"

import { baseORPC } from "../utils/orpc"
import { classRouter } from "./class.router"
import { academicSessionRouter } from "./session.router"
import { studentRouter } from "./student.router"
import { subjectRouter } from "./subject.router"
import { subjectListRouter } from "./subjectList.router"
import { teacherRouter } from "./teacher.router"
import { termRouter } from "./term.router"

export const apiRouter = {
  health: baseORPC.handler(() => ({ status: "API Working", timestamp: Date.now() })),
  academicSession: academicSessionRouter,
  term: termRouter,
  subject: subjectRouter,
  subjectList: subjectListRouter,
  class: classRouter,
  student: studentRouter,
  teacher: teacherRouter
}

export type APIRouter = typeof apiRouter
export type APIRouterClient = RouterClient<APIRouter>
