/* This file contains reusable queries for class operations */
import { db } from "@nuxthub/db";
import { eq } from "drizzle-orm";

import { classes } from "../db/schema";

const includeTeacher = { teacher: { columns: { id: true, name: true } } } as const;

/** Find a class by id or name and its teacher */
export const fetchSingleClass = async (payload: string, column: "id" | "name" = "id") => {
  return await db.query.classes.findFirst({
    where: eq(classes[column], payload),
    with: { ...includeTeacher },
  });
};

/** List all classes and include their teachers */
export const listAllClasses = async () => {
  return await db.query.classes.findMany({
    with: { ...includeTeacher },
  });
};
