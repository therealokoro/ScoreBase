import { oc } from "@orpc/contract";
import { z } from "zod";
import { ClassSchema, CreateClassSchema, UpdateClassSchema } from "~~/shared/validators/academic";

export const list = oc.output(z.array(ClassSchema));

export const getOne = oc
  .input(ClassSchema.pick({ id: true }))
  .output(ClassSchema)
  .errors({ NOT_FOUND: { message: "The class was not found" } });

export const create = oc
  .input(CreateClassSchema)
  .output(ClassSchema)
  .errors({ CONFLICT: { message: "A class already exists with that name" } });

export const update = oc
  .input(UpdateClassSchema)
  .output(ClassSchema)
  .errors({
    NOT_FOUND: { message: "The class was not found" },
    CONFLICT: { message: "A class already exists with that name" },
  });

export const remove = oc
  .input(z.object({ id: z.string() }))
  .output(z.object({ success: z.boolean() }))
  .errors({
    NOT_FOUND: { message: "The class was not found" },
    PRECONDITION_FAILED: { message: "Cannot delete class with associated students or results" },
  });

export const classContract = {
  list,
  getOne,
  create,
  update,
  delete: remove,
};
