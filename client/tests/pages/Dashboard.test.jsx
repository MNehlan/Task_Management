import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import Dashboard from "../../src/pages/Dashboard";
import AdminDashboard from "../../src/pages/AdminDashboard";
import api from "../../src/api/api";

vi.mock("../../src/api/api");

describe("Dashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  const renderDashboard = () => {
    return render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>,
    );
  };

  it("shows loading state initially", () => {
    api.get.mockReturnValue(new Promise(() => {}));

    localStorage.setItem(
      "user",
      JSON.stringify({
        name: "John Doe",
        role: "user",
      }),
    );

    renderDashboard();

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("fetches and displays dashboard statistics", async () => {
    localStorage.setItem(
      "user",
      JSON.stringify({
        name: "John Doe",
        role: "user",
      }),
    );

    api.get.mockResolvedValue({
      data: {
        stats: {
          workspaces: 5,
          tasks: 20,
          todo: 0,
          inProgress: 0,
          review: 0,
          completed: 10,
        },
      },
    });

    renderDashboard();

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("/workspace/dashboard");
    });

    expect(
      await screen.findByText(
        (content) =>
          content.includes("Welcome back") && content.includes("John"),
      ),
    ).toBeInTheDocument();

    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("20")).toBeInTheDocument();

    expect(screen.getByText("Todo")).toBeInTheDocument();
    expect(screen.getByText("In Progress")).toBeInTheDocument();
    expect(screen.getByText("Review")).toBeInTheDocument();
    expect(screen.getByText("Completed")).toBeInTheDocument();

    expect(screen.getByText("10")).toBeInTheDocument();
  });

  it("shows Guest when no user is stored", async () => {
    api.get.mockResolvedValue({
      data: {
        stats: {
          workspaces: 0,
          tasks: 0,
          completed: 0,
          pending: 0,
          overdue: 0,
          members: 0,
        },
      },
    });

    renderDashboard();

    expect(
      await screen.findByText(
        (content) =>
          content.includes("Welcome back") && content.includes("Guest"),
      ),
    ).toBeInTheDocument();
  });

  it("shows API error when dashboard request fails", async () => {
    api.get.mockRejectedValue({
      response: {
        data: {
          message: "Unable to load dashboard",
        },
      },
    });

    renderDashboard();

    expect(
      await screen.findByText("Unable to load dashboard"),
    ).toBeInTheDocument();
  });
});

describe("AdminDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  const renderAdminDashboard = () => {
    return render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>,
    );
  };

  it("shows loading state initially", () => {
    api.get.mockReturnValue(new Promise(() => {}));

    renderAdminDashboard();

    expect(
      screen.getByText("Loading system statistics..."),
    ).toBeInTheDocument();
  });

  it("fetches and displays system statistics", async () => {
    api.get.mockResolvedValue({
      data: {
        stats: {
          users: 50,
          workspaces: 10,
          tasks: 100,
          todo: 20,
          inProgress: 15,
          review: 5,
          completed: 60,
        },
      },
    });

    renderAdminDashboard();

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("/admin");
    });

    expect(await screen.findByText("50")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("100")).toBeInTheDocument();
    expect(screen.getByText("20")).toBeInTheDocument();
    expect(screen.getByText("15")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("60")).toBeInTheDocument();
  });

  it("renders management links", async () => {
    api.get.mockResolvedValue({
      data: {
        stats: {
          users: 50,
          workspaces: 10,
          tasks: 100,
          todo: 20,
          inProgress: 15,
          review: 5,
          completed: 60,
        },
      },
    });

    renderAdminDashboard();

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("/admin");
    });

    const usersLink = await screen.findByRole("link", {
      name: /total users/i,
    });

    const workspacesLink = screen.getByRole("link", {
      name: /workspaces/i,
    });

    const tasksLink = screen.getByRole("link", {
      name: /total tasks/i,
    });

    expect(usersLink).toHaveAttribute("href", "/admin/users");

    expect(workspacesLink).toHaveAttribute("href", "/admin/workspaces");

    expect(tasksLink).toHaveAttribute("href", "/admin/tasks");
  });

  it("shows API error when admin dashboard request fails", async () => {
    api.get.mockRejectedValue({
      response: {
        data: {
          message: "Failed to load system statistics",
        },
      },
    });

    renderAdminDashboard();

    expect(
      await screen.findByText("Failed to load system statistics"),
    ).toBeInTheDocument();
  });
});
