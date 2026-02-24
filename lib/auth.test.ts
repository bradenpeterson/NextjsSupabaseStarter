import { getUser } from "./auth"

const mockGetUser = jest.fn()

jest.mock("@/lib/supabase/server", () => ({
  createClient: () =>
    Promise.resolve({
      auth: { getUser: () => mockGetUser() },
    }),
}))

describe("getUser", () => {
  beforeEach(() => {
    mockGetUser.mockReset()
  })

  it("returns null when session is missing (AuthSessionMissingError)", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { name: "AuthSessionMissingError", message: "Auth session missing" },
    })
    await expect(getUser()).resolves.toBeNull()
  })

  it("returns null when error message includes auth session missing", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { name: "OtherError", message: "Auth session missing" },
    })
    await expect(getUser()).resolves.toBeNull()
  })

  it("returns user when getUser succeeds", async () => {
    const fakeUser = { id: "user-1", email: "test@example.com" }
    mockGetUser.mockResolvedValue({ data: { user: fakeUser }, error: null })
    await expect(getUser()).resolves.toEqual(fakeUser)
  })

  it("throws when getUser returns a non-session error", async () => {
    const err = new Error("Network error")
    mockGetUser.mockResolvedValue({ data: { user: null }, error: err })
    await expect(getUser()).rejects.toThrow("Network error")
  })
})
