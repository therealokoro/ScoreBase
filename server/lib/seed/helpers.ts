import { faker } from "@faker-js/faker"
import { nigerianFirstNames, nigerianLastNames, numberPrefixes } from "~~/server/lib/seed/data"

export function nigerianName() {
  const first = faker.helpers.arrayElement(nigerianFirstNames)
  const last = faker.helpers.arrayElement(nigerianLastNames)

  return `${first} ${last}`
}

export function nigerianPhone() {
  const prefix = faker.helpers.arrayElement(numberPrefixes)
  const rest = faker.string.numeric(7)

  return `${prefix}${rest}`
}

export function createUniqueGenerators() {
  const usedPhones = new Set<string>()
  const usedEmails = new Set<string>()

  function uniquePhone() {
    let phone: string

    do {
      phone = nigerianPhone()
    } while (usedPhones.has(phone))

    usedPhones.add(phone)

    return phone
  }

  function uniqueEmail(name: string) {
    const base = name.toLowerCase().replace(/\s+/g, ".")

    let email = `${base}@gmail.com`
    let i = 1

    while (usedEmails.has(email)) {
      email = `${base}${i}@gmail.com`
      i++
    }

    usedEmails.add(email)

    return email
  }

  return {
    uniquePhone,
    uniqueEmail
  }
}
