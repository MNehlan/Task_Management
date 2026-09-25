import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Navbar from "../../src/components/Navbar";

const navigateMock = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");

  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

describe("Navbar", () => {
  beforeEach(() => {
    localStorage.clear();
    navigateMock.mockClear();
  });

  const renderNavbar = () => {
    return render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>,
    );
  };

  it("should render the TaskFlow logo", () => {
    renderNavbar();

    expect(screen.getByText("✅ TaskFlow")).toBeInTheDocument();
  });

  it("should display the logged-in user name", () => {
    localStorage.setItem(
      "user",
      JSON.stringify({
        name: "John Doe",
        role: "member",
      }),
    );

    renderNavbar();

    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });

  it("should display the correct user initials", () => {
    localStorage.setItem(
      "user",
      JSON.stringify({
        name: "John Doe",
        role: "member",
      }),
    );

    renderNavbar();

    expect(screen.getByText("JD")).toBeInTheDocument();
  });

  it("should display ? when no user exists", () => {
    renderNavbar();

    expect(screen.getByText("?")).toBeInTheDocument();
  });

  it("should display the Logout button", () => {
    renderNavbar();

    expect(screen.getByRole("button", { name: "Logout" })).toBeInTheDocument();
  });

  it("should remove token and user from localStorage when logging out", async () => {
    const user = userEvent.setup();

    localStorage.setItem("token", "test-token");
    localStorage.setItem(
      "user",
      JSON.stringify({
        name: "John Doe",
        role: "member",
      }),
    );

    renderNavbar();

    await user.click(screen.getByRole("button", { name: "Logout" }));

    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
  });

  it("should navigate to login after logout", async () => {
    const user = userEvent.setup();

    localStorage.setItem("token", "test-token");
    localStorage.setItem(
      "user",
      JSON.stringify({
        name: "John Doe",
        role: "member",
      }),
    );

    renderNavbar();

    await user.click(screen.getByRole("button", { name: "Logout" }));

    expect(navigateMock).toHaveBeenCalledWith("/login");
  });

  it("should show the mobile menu button", () => {
    renderNavbar();

    expect(screen.getByRole("button", { name: "☰" })).toBeInTheDocument();
  });

  it("should open the mobile navigation menu when clicked", async () => {
    const user = userEvent.setup();

    renderNavbar();

    await user.click(screen.getByRole("button", { name: "☰" }));

    expect(screen.getByText("Navigation")).toBeInTheDocument();

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Workspaces")).toBeInTheDocument();
  });

  it("should show admin navigation for an admin user", async () => {
    const user = userEvent.setup();

    localStorage.setItem(
      "user",
      JSON.stringify({
        name: "Admin User",
        role: "admin",
      }),
    );

    renderNavbar();

    await user.click(screen.getByRole("button", { name: "☰" }));

    expect(screen.getByText("Admin Panel")).toBeInTheDocument();
    expect(screen.getByText("System Overview")).toBeInTheDocument();
    expect(screen.getByText("Manage Users")).toBeInTheDocument();
    expect(screen.getByText("Manage Workspaces")).toBeInTheDocument();
    expect(screen.getByText("Manage Tasks")).toBeInTheDocument();
  });

  it("should not show admin navigation for a non-admin user", async () => {
    const user = userEvent.setup();

    localStorage.setItem(
      "user",
      JSON.stringify({
        name: "John Doe",
        role: "member",
      }),
    );

    renderNavbar();

    await user.click(screen.getByRole("button", { name: "☰" }));

    expect(screen.queryByText("Admin Panel")).not.toBeInTheDocument();
    expect(screen.queryByText("Manage Users")).not.toBeInTheDocument();
  });

  it("should close the mobile menu when a navigation link is clicked", async () => {
    const user = userEvent.setup();

    renderNavbar();

    await user.click(screen.getByRole("button", { name: "☰" }));

    const dashboardLink = screen.getByRole("link", { name: /Dashboard/ });

    await user.click(dashboardLink);

    expect(screen.queryByText("Navigation")).not.toBeInTheDocument();
  });

  it("should close the mobile menu when a navigation link is clicked", async () => {
    const user = userEvent.setup();

    renderNavbar();

    await user.click(screen.getByRole("button", { name: "☰" }));

    const dashboardLink = screen.getByRole("link", {
      name: /Dashboard/,
    });

    await user.click(dashboardLink);

    expect(screen.queryByText("Navigation")).not.toBeInTheDocument();
  });
});
