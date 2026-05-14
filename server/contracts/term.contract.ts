import { oc } from "@orpc/contract";
import { z } from "zod";
import { TermSchema, CreateTermSchema, UpdateTermSchema } from "~~/shared/validators/academic";

export const list = oc.input(z.object({ sessionId: z.string() })).output(z.array(TermSchema));

export const getOne = oc
  .input(TermSchema.pick({ id: true }))
  .output(TermSchema)
  .errors({ NOT_FOUND: { message: "The term was not found" } });

export const create = oc
  .input(CreateTermSchema)
  .output(TermSchema)
  .errors({
    NOT_FOUND: { message: "The parent session was not found" },
    CONFLICT: { message: "A term with that name already exists in this session" },
  });

export const update = oc
  .input(UpdateTermSchema)
  .output(TermSchema)
  .errors({
    NOT_FOUND: { message: "The term was not found" },
    CONFLICT: { message: "A term with that name already exists in this session" },
  });

export const remove = oc
  .input(z.object({ id: z.string() }))
  .output(z.object({ success: z.boolean() }))
  .errors({
    NOT_FOUND: { message: "The term was not found" },
    PRECONDITION_FAILED: { message: "Cannot delete term with associated results" },
  });

export const termContract = {
  list,
  getOne,
  create,
  update,
  delete: remove,
};
