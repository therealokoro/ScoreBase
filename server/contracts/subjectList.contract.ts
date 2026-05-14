import { oc } from "@orpc/contract";
import { z } from "zod";
import { SubjectListSchema, CreateSubjectListSchema } from "~~/shared/validators/academic";

export const list = oc.output(z.array(SubjectListSchema));

export const getOne = oc
  .input(SubjectListSchema.pick({ id: true }))
  .output(SubjectListSchema)
  .errors({ NOT_FOUND: { message: "The subject list was not found" } });

export const create = oc
  .input(CreateSubjectListSchema)
  .output(SubjectListSchema)
  .errors({ CONFLICT: { message: "A subject list with this name already exist" } });

export const remove = oc
  .input(SubjectListSchema.pick({ id: true }))
  .output(z.object({ success: z.boolean() }))
  .errors({ NOT_FOUND: { message: "The subject list was not found" } });

export const SubjectListContract = {
  list,
  getOne,
  create,
  delete: remove,
};
