/* This file contains reusable queries for teacher operations */
import { db } from "@nuxthub/db";
import { eq, not } from "drizzle-orm";

import { user } from "../db/schema";

const classInclude = { class: { columns: { id: true, name: true } } } as const;

/** Find a teacher by id and include their classes */
export const fetchSingleTeacher = async (id: string) => {
  return await db.query.user.findFirst({
    where: eq(user.id, id),
    with: { ...classInclude },
  });
};

/** List all teachers and include their classes */
export const listAllTeachers = async () => {
  return await db.query.user.findMany({
    where: not(eq(user.role, "admin")),
    with: { ...classInclude },
  });
};
