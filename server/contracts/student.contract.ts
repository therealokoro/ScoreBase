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
    CONFLICT: { message: "A student with that ID already exists" }
  })

const update = oc
  .input(UpdateStudentSchema)
  // .output(StudentSchema)
  .errors({
    NOT_FOUND: { message: "The student was not found" },
    CONFLICT: { message: "A student with that ID already exists" }
  })

const remove = oc
  .input(z.object({ id: z.string() }))
  .output(z.object({ success: z.boolean() }))
  .errors({
    NOT_FOUND: { message: "The student was not found" },
    PRECONDITION_FAILED: { message: "Cannot delete student with associated results" }
  })

export const studentContract = {
  list,
  getOne,
  create,
  update,
  delete: remove
}
