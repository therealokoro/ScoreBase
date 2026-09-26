import { oc } from "@orpc/contract"
import { z } from "zod"
import { ClassWithSubjectListSchema } from "~~/shared/validators/academic"
import {
  TeacherSchema,
  UpsertTeacherSchema,
  UpdateTeacherSchema
} from "~~/shared/validators/actors"

const list = oc.output(z.array(z.any()))

/** Paginated teacher list for the teachers page (admins only). */
const query = oc
  .input(
    z.object({
      page: z.number().int().min(0).default(0),
      pageSize: z.number().int().min(1).max(100).default(10),
      search: z.string().trim().max(100).optional()
    })
  )
  .output(
    z.object({
      data: z.array(z.any()),
      total: z.number(),
      pageCount: z.number()
    })
  )

const getOne = oc
  .input(TeacherSchema.pick({ id: true }))
  .output(TeacherSchema)
  .errors({ NOT_FOUND: { message: "The teacher was not found" } })

const create = oc
  .input(UpsertTeacherSchema)
  .output(TeacherSchema)
  .errors({ CONFLICT: { message: "Teachers must have unique emails and phone numbers" } })

const update = oc.input(UpdateTeacherSchema).errors({
  NOT_FOUND: { message: "The teacher was not found" },
  CONFLICT: { message: "Teachers must have a unique email and phone number" }
})

const remove = oc
  .input(z.object({ id: z.string() }))
  .output(z.object({ success: z.boolean() }))
  .errors({
    NOT_FOUND: { message: "The teacher was not found" }
  })

const getClass = oc
  .input(z.object({ teacherId: z.string() }))
  .output(
    ClassWithSubjectListSchema.extend({
      count: z.object({
        students: z.string()
      })
    })
  )
  .errors({
    NOT_FOUND: { message: "The class you're looking for was not found" }
  })

export const teacherContract = {
  list,
  query,
  getOne,
  create,
  update,
  getClass,
  delete: remove
}
