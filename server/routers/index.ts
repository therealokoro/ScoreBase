import type { RouterClient } from "@orpc/server"

import { baseORPC } from "../utils/orpc"
import { accountRouter } from "./account.router"
import { classRouter } from "./class.router"
import { dashboardRouter } from "./dashboard.router"
import { resultRouter } from "./results.router"
import { scoresheetRouter } from "./scoresheet.router"
import { academicSessionRouter } from "./session.router"
import { settingsRouter } from "./settings.router"
import { studentRouter } from "./student.router"
import { subjectRouter } from "./subject.router"
import { subjectListRouter } from "./subjectList.router"
import { subjectScoreRouter } from "./subjectScore.router"
import { teacherRouter } from "./teacher.router"
import { termRouter } from "./term.router"

export const apiRouter = {
  health: baseORPC.handler(() => ({ status: "API Working", timestamp: Date.now() })),
  dashboard: dashboardRouter,
  academicSession: academicSessionRouter,
  term: termRouter,
  subject: subjectRouter,
  subjectList: subjectListRouter,
  class: classRouter,
  student: studentRouter,
  teacher: teacherRouter,
  account: accountRouter,
  scoresheet: scoresheetRouter,
  subjectScore: subjectScoreRouter,
  result: resultRouter,
  settings: settingsRouter
}

export type APIRouter = typeof apiRouter
export type APIRouterClient = RouterClient<APIRouter>
