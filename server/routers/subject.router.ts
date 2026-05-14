import { db } from "@nuxthub/db";
import { implement } from "@orpc/server";
import { eq } from "drizzle-orm";

import { subjectContract } from "../contracts/subject.contract";
import { subjects } from "../db/schema";
import { fetchSingleSubject, listAllSubjects } from "../queries/subject.query";

const os = implement(subjectContract);

const listSubjects = os.list.handler(async () => await listAllSubjects());

const getSingleSubject = os.getOne.handler(async ({ input, errors }) => {
  const subject = await fetchSingleSubject(input.id);
  if (!subject) throw errors.NOT_FOUND();
  return subject;
});

const createSubject = os.create.handler(async ({ input, errors }) => {
  // Check for name conflict
  const existingSubject = await fetchSingleSubject(input.name, "name");
  if (existingSubject) throw errors.CONFLICT();

  const insertData = {
    name: input.name,
    code: input.code ?? null,
    tags: input.tags ? input.tags : [],
  };

  const [newSubject] = await db.insert(subjects).values(insertData).returning();
  return newSubject!;
});

const updateSubject = os.update.handler(async ({ input, errors }) => {
  const existingSubject = await fetchSingleSubject(input.id);
  if (!existingSubject) throw errors.NOT_FOUND();

  // Check name conflict if name changed
  if (input.name !== existingSubject.name) {
    const nameConflict = await fetchSingleSubject(input.name, "name");
    if (nameConflict) throw errors.CONFLICT();
  }

  const updateData: Record<string, unknown> = {
    name: input.name,
    code: input.code ?? null,
  };

  if (input.tags !== undefined) {
    updateData.tags = input.tags ? input.tags : [];
  }

  const [updatedSubject] = await db
    .update(subjects)
    .set(updateData)
    .where(eq(subjects.id, input.id))
    .returning();

  return updatedSubject!;
});

const removeSubject = os.delete.handler(async ({ input, errors }) => {
  const existingSubject = await fetchSingleSubject(input.id);
  if (!existingSubject) throw errors.NOT_FOUND();

  // TODO: Check for associated results/class presets
  // if (hasResultsOrPresets) throw errors.PRECONDITION_FAILED()

  await db.delete(subjects).where(eq(subjects.id, input.id));
  return { success: true };
});

export const subjectRouter = {
  list: listSubjects,
  getOne: getSingleSubject,
  create: createSubject,
  update: updateSubject,
  delete: removeSubject,
};
