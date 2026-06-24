export const resultStatus = ["draft", "submitted", "reviewed", "published"] as const
export type ResultStatus = (typeof resultStatus)[number]
