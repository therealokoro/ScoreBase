import { oc } from "@orpc/contract"
import { UpdateAccountInfoSchema, UpdateAccountPasswordSchema } from "~~/shared/validators/actors"

const updateInfo = oc.input(UpdateAccountInfoSchema).errors({
  NOT_FOUND: { message: "Couldn't find an account with matching info" },
  CONFLICT: { message: "One or more info is currently being used by another person" }
})

const updatePassword = oc.input(UpdateAccountPasswordSchema).errors({
  NOT_FOUND: { message: "Couldn't find an account with matching info" },
  INCORRECT_PASSWORD: { message: "Incorrect password entered" }
})

export const accountContract = {
  updateInfo,
  updatePassword
}
