import { formatDisplayName } from "./formatDisplayName"

describe("formatDisplayName", () => {
  it("returns full name when provided", () => {
    expect(formatDisplayName("Jane Doe", "jane@example.com")).toBe("Jane Doe")
  })

  it("returns email local part when full name is empty", () => {
    expect(formatDisplayName("", "jane@example.com")).toBe("jane")
    expect(formatDisplayName(null, "admin@test.org")).toBe("admin")
    expect(formatDisplayName(undefined, "user@co.io")).toBe("user")
  })

  it("trims full name", () => {
    expect(formatDisplayName("  Bob  ", "bob@example.com")).toBe("Bob")
  })

  it("returns full email when no @ in email", () => {
    expect(formatDisplayName("", "no-at")).toBe("no-at")
  })
})
