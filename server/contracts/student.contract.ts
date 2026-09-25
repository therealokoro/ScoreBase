import { oc } from "@orpc/contract"
import { z } from "zod"
import {
  StudentSchema,
  UpsertStudentSchema,
  UpdateStudentSchema
} from "~~/shared/validators/academic"

const list = oc.output(z.array(StudentSchema))

const getOne = oc
  .input(StudentSchema.pick({ id: true }))
  .output(StudentSchema)
  .errors({ NOT_FOUND: { message: "The student was not found" } })

const create = oc
  .input(UpsertStudentSchema)
  .output(StudentSchema.omit({ class: true }))
  .errors({
    CONFLICT: { message: "A student with that ID already exists" },
    BAD_REQUEST: { message: "A student ID is required when auto-generation is disabled" }
  })

const update = oc
  .input(UpdateStudentSchema)
  // .output(StudentSchema)
  .errors({
    NOT_FOUND: { message: "The student was not found" },
    CONFLICT: { message: "A student currently exists with this same info" },
    FORBIDDEN: { message: "You are not allowed to do that" }
  })

const remove = oc
  .input(z.object({ id: z.string() }))
  .output(z.object({ success: z.boolean() }))
  .errors({
    NOT_FOUND: { message: "The student was not found" },
    PRECONDITION_FAILED: { message: "Cannot delete student with associated results" }
  })

const query = oc
  .input(
    z.object({
      page: z.number().int().min(0).default(0),
      pageSize: z.number().int().min(1).max(100).default(10),
      search: z.string().trim().max(100).optional(),
      classId: z.string().optional()
    })
  )
  .output(
    z.object({
      data: StudentSchema.array(),
      total: z.number(),
      pageCount: z.number()
    })
  )

export const studentContract = {
  list,
  getOne,
  create,
  update,
  query,
  delete: remove
}
