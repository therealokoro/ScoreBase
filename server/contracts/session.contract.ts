import { oc } from "@orpc/contract";
import { z } from "zod";
import {
  AcademicSessionSchema,
  CreateAcademicSessionSchema,
  UpdateAcademicSessionSchema,
} from "~~/shared/validators/academic";

export const list = oc.output(z.array(AcademicSessionSchema));

export const getOne = oc
  .input(AcademicSessionSchema.pick({ id: true }))
  .output(AcademicSessionSchema)
  .errors({ NOT_FOUND: { message: "The session was not found" } });

export const create = oc
  .input(CreateAcademicSessionSchema)
  .output(AcademicSessionSchema)
  .errors({ CONFLICT: { message: "A session already exists with that name" } });

export const update = oc
  .input(UpdateAcademicSessionSchema)
  .output(AcademicSessionSchema)
  .errors({
    NOT_FOUND: { message: "The session was not found" },
    CONFLICT: { message: "A session already exists with that name" },
  });

export const remove = oc
  .input(z.object({ id: z.string() }))
  .output(z.object({ success: z.boolean() }))
  .errors({
    NOT_FOUND: { message: "The session was not found" },
    PRECONDITION_FAILED: { message: "Cannot delete session with associated terms" },
  });

export const academicSessionContract = {
  list,
  getOne,
  create,
  update,
  delete: remove,
};
