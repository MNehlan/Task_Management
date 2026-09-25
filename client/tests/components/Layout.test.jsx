import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Layout from "../../src/components/Layout";
import api from "../../src/api/api.js";
import { reloadPage } from "../../src/utils/reloadPage.js";

const navigateMock = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");

  return {
    ...actual,
    useNavigate: () => navigateMock,
    Outlet: () => <div>Test Page Content</div>,
  };
});

vi.mock("../../src/api/api.js", () => ({
  default: {
    get: vi.fn(),
  },
}));

vi.mock("../../src/utils/reloadPage.js", () => ({
  reloadPage: vi.fn(),
}));

describe("Layout", () => {
  beforeEach(() => {
    localStorage.clear();
    navigateMock.mockClear();
    api.get.mockReset();
  });

  const mockUser = {
    name: "John Doe",
    email: "john@example.com",
    role: "member",
  };

  const renderLayout = () => {
    return render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Layout />
      </MemoryRouter>,
    );
  };

  it("should render the Navbar", () => {
    localStorage.setItem("user", JSON.stringify(mockUser));

    api.get.mockResolvedValue({
      data: {
        user: mockUser,
      },
    });

    renderLayout();

    expect(screen.getByText("✅ TaskFlow")).toBeInTheDocument();
  });

  it("should render the Sidebar", () => {
    localStorage.setItem("user", JSON.stringify(mockUser));

    api.get.mockResolvedValue({
      data: {
        user: mockUser,
      },
    });

    renderLayout();

    expect(screen.getByText("Navigation")).toBeInTheDocument();
  });

  it("should render the Outlet content", () => {
    localStorage.setItem("user", JSON.stringify(mockUser));

    api.get.mockResolvedValue({
      data: {
        user: mockUser,
      },
    });

    renderLayout();

    expect(screen.getByText("Test Page Content")).toBeInTheDocument();
  });

  it("should call the auth/me endpoint when mounted", async () => {
    localStorage.setItem("user", JSON.stringify(mockUser));

    api.get.mockResolvedValue({
      data: {
        user: mockUser,
      },
    });

    renderLayout();

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("/auth/me");
    });
  });

  it("should not update localStorage when the user data has not changed", async () => {
    localStorage.setItem("user", JSON.stringify(mockUser));

    api.get.mockResolvedValue({
      data: {
        user: mockUser,
      },
    });

    const setItemSpy = vi.spyOn(Storage.prototype, "setItem");

    renderLayout();

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("/auth/me");
    });

    expect(setItemSpy).not.toHaveBeenCalledWith(
      "user",
      JSON.stringify(mockUser),
    );
  });

  it("should update localStorage and reload when the server user data has changed", async () => {
    const localUser = {
      name: "John Doe",
      email: "john@example.com",
      role: "member",
    };

    const serverUser = {
      name: "John Updated",
      email: "john@example.com",
      role: "manager",
    };

    localStorage.setItem("user", JSON.stringify(localUser));

    api.get.mockResolvedValue({
      data: {
        user: serverUser,
      },
    });

    const setItemSpy = vi.spyOn(Storage.prototype, "setItem");

    renderLayout();

    await waitFor(() => {
      expect(setItemSpy).toHaveBeenCalledWith(
        "user",
        JSON.stringify(serverUser),
      );

      expect(reloadPage).toHaveBeenCalled();
    });
  });

  it("should remove authentication data and navigate to login when auth check fails", async () => {
    localStorage.setItem("token", "test-token");
    localStorage.setItem(
      "user",
      JSON.stringify({
        name: "John Doe",
        email: "john@example.com",
        role: "member",
      }),
    );

    api.get.mockRejectedValue(new Error("Unauthorized"));

    renderLayout();

    await waitFor(() => {
      expect(localStorage.getItem("token")).toBeNull();
      expect(localStorage.getItem("user")).toBeNull();
    });

    expect(navigateMock).toHaveBeenCalledWith("/login", {
      replace: true,
    });
  });
});
