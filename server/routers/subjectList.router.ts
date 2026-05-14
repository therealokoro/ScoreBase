import { db } from "@nuxthub/db";
import { implement } from "@orpc/server";
import { eq } from "drizzle-orm";

import { SubjectListContract } from "../contracts/subjectList.contract";
import { subjectLists } from "../db/schema";
import { fetchSingleSubjectList, listAllSubjectLists } from "../queries/subjectList.query";

const os = implement(SubjectListContract);

const listSubjectLists = os.list.handler(async () => await listAllSubjectLists());

const getOneSubjectList = os.getOne.handler(async ({ input, errors }) => {
  const preset = await fetchSingleSubjectList(input.id);
  if (!preset) throw errors.NOT_FOUND();
  return preset;
});

const createSubjectList = os.create.handler(async ({ input, errors }) => {
  // Check for duplicate subject list preset
  const existingSubjectList = await fetchSingleSubjectList(input.name, "name");
  if (existingSubjectList) throw errors.CONFLICT();

  const [newPreset] = await db.insert(subjectLists).values(input).returning();

  return newPreset!;
});

const removeClassSubject = os.delete.handler(async ({ input, errors }) => {
  const existingPreset = await fetchSingleSubjectList(input.id);
  if (!existingPreset) throw errors.NOT_FOUND();

  await db.delete(subjectLists).where(eq(subjectLists.id, input.id));
  return { success: true };
});

export const subjectListRouter = {
  list: listSubjectLists,
  getOne: getOneSubjectList,
  create: createSubjectList,
  delete: removeClassSubject,
};
