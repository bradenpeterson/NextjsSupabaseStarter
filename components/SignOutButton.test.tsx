import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { SignOutButton } from "./SignOutButton"

const mockPush = jest.fn()
const mockSignOut = jest.fn()

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}))

jest.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ signOut: mockSignOut }),
}))

describe("SignOutButton", () => {
  beforeEach(() => {
    mockPush.mockClear()
    mockSignOut.mockClear()
    mockSignOut.mockResolvedValue(undefined)
  })

  it("renders a button with Sign out text", () => {
    render(<SignOutButton />)
    expect(screen.getByRole("button", { name: /sign out/i })).toBeInTheDocument()
  })

  it("calls signOut and navigates to / when clicked", async () => {
    const user = userEvent.setup()
    render(<SignOutButton />)
    await user.click(screen.getByRole("button", { name: /sign out/i }))
    expect(mockSignOut).toHaveBeenCalledTimes(1)
    expect(mockPush).toHaveBeenCalledWith("/")
  })
})
