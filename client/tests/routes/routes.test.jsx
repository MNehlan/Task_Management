import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";

import PublicRoute from "../../src/routes/PublicRoute.jsx";
import ProtectedRoute from "../../src/routes/ProtectedRoute.jsx";
import AdminProtectedRoute from "../../src/routes/AdminProtectedRoute.jsx";

describe("PublicRoute", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders public content when no token exists", () => {
    render(
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<div>Public Page</div>} />
          </Route>

          <Route path="/dashboard" element={<div>Dashboard Page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Public Page")).toBeInTheDocument();
  });

  it("redirects to dashboard when a token exists", () => {
    localStorage.setItem("token", "fake-token");

    render(
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<div>Public Page</div>} />
          </Route>

          <Route path="/dashboard" element={<div>Dashboard Page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Dashboard Page")).toBeInTheDocument();
    expect(screen.queryByText("Public Page")).not.toBeInTheDocument();
  });
});

describe("ProtectedRoute", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders protected content when a token exists", () => {
    localStorage.setItem("token", "fake-token");

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<div>Protected Page</div>} />
          </Route>

          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Protected Page")).toBeInTheDocument();
  });

  it("redirects to login when no token exists", () => {
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<div>Protected Page</div>} />
          </Route>

          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Login Page")).toBeInTheDocument();
    expect(screen.queryByText("Protected Page")).not.toBeInTheDocument();
  });
});

describe("AdminProtectedRoute", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders admin content when user is an admin", () => {
    localStorage.setItem("user", JSON.stringify({ role: "admin" }));

    render(
      <MemoryRouter initialEntries={["/admin/dashboard"]}>
        <Routes>
          <Route element={<AdminProtectedRoute />}>
            <Route path="/admin/dashboard" element={<div>Admin Page</div>} />
          </Route>

          <Route path="/dashboard" element={<div>Dashboard Page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Admin Page")).toBeInTheDocument();
  });

  it("redirects non-admin users to dashboard", () => {
    localStorage.setItem("user", JSON.stringify({ role: "user" }));

    render(
      <MemoryRouter initialEntries={["/admin/dashboard"]}>
        <Routes>
          <Route element={<AdminProtectedRoute />}>
            <Route path="/admin/dashboard" element={<div>Admin Page</div>} />
          </Route>

          <Route path="/dashboard" element={<div>Dashboard Page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Dashboard Page")).toBeInTheDocument();
    expect(screen.queryByText("Admin Page")).not.toBeInTheDocument();
  });

  it("redirects when no user exists", () => {
    render(
      <MemoryRouter initialEntries={["/admin/dashboard"]}>
        <Routes>
          <Route element={<AdminProtectedRoute />}>
            <Route path="/admin/dashboard" element={<div>Admin Page</div>} />
          </Route>

          <Route path="/dashboard" element={<div>Dashboard Page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Dashboard Page")).toBeInTheDocument();
    expect(screen.queryByText("Admin Page")).not.toBeInTheDocument();
  });
});
