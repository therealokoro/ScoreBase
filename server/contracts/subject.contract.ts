import { oc } from "@orpc/contract"
import { z } from "zod"
import { SubjectSchema, UpsertSubjectSchema, UpdateSubjectSchema } from "~~/shared/validators/academic"

export const list = oc.output(z.array(SubjectSchema))

export const getOne = oc
  .input(SubjectSchema.pick({ id: true }))
  .output(SubjectSchema)
  .errors({ NOT_FOUND: { message: "The subject was not found" } })

export const create = oc
  .input(UpsertSubjectSchema)
  .output(SubjectSchema)
  .errors({ CONFLICT: { message: "A subject already exists with that name" } })

export const update = oc
  .input(UpdateSubjectSchema)
  .output(SubjectSchema)
  .errors({
    NOT_FOUND: { message: "The subject was not found" },
    CONFLICT: { message: "A subject already exists with that name" }
  })

export const remove = oc
  .input(z.object({ id: z.string() }))
  .output(z.object({ success: z.boolean() }))
  .errors({
    NOT_FOUND: { message: "The subject was not found" },
    PRECONDITION_FAILED: {
      message: "Cannot delete subject with associated results or class presets"
    }
  })

export const subjectContract = {
  list,
  getOne,
  create,
  update,
  delete: remove
}

// export listPresets = oc.output(schema)
