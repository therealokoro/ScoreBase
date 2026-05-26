import { oc } from "@orpc/contract"
import { z } from "zod"
import {
  TeacherSchema,
  UpsertTeacherSchema,
  UpdateTeacherSchema
} from "~~/shared/validators/actors"

const list = oc.output(z.array(z.any()))

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

export const teacherContract = {
  list,
  getOne,
  create,
  update,
  delete: remove
}
