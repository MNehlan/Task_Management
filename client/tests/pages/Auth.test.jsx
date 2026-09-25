import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import Login from "../../src/pages/Login";
import Register from "../../src/pages/Register";
import api from "../../src/api/api";

vi.mock("../../src/api/api");

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");

  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("Login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  const renderLogin = () => {
    return render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    );
  };

  it("renders login form", () => {
    renderLogin();

    expect(screen.getByText("Welcome back")).toBeInTheDocument();

    expect(screen.getByPlaceholderText("you@example.com")).toBeInTheDocument();

    expect(screen.getByPlaceholderText("••••••••")).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: /sign in/i }),
    ).toBeInTheDocument();
  });

  it("updates email and password fields", () => {
    renderLogin();

    const emailInput = screen.getByPlaceholderText("you@example.com");
    const passwordInput = screen.getByPlaceholderText("••••••••");

    fireEvent.change(emailInput, {
      target: { value: "john@example.com" },
    });

    fireEvent.change(passwordInput, {
      target: { value: "password123" },
    });

    expect(emailInput).toHaveValue("john@example.com");
    expect(passwordInput).toHaveValue("password123");
  });

  it("submits login and stores authentication data", async () => {
    api.post.mockResolvedValue({
      data: {
        token: "test-token",
        user: {
          id: "123",
          name: "John Doe",
          email: "john@example.com",
          role: "user",
        },
      },
    });

    renderLogin();

    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "john@example.com" },
    });

    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "password123" },
    });

    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/auth/login", {
        email: "john@example.com",
        password: "password123",
      });
    });

    expect(localStorage.getItem("token")).toBe("test-token");

    expect(JSON.parse(localStorage.getItem("user"))).toEqual({
      id: "123",
      name: "John Doe",
      email: "john@example.com",
      role: "user",
    });

    expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
  });

  it("shows API error when login fails", async () => {
    api.post.mockRejectedValue({
      response: {
        data: {
          message: "Invalid email or password",
        },
      },
    });

    renderLogin();

    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "wrong@example.com" },
    });

    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "wrongpassword" },
    });

    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(
      await screen.findByText("Invalid email or password"),
    ).toBeInTheDocument();

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("shows loading state while login request is pending", async () => {
    let resolveRequest;

    api.post.mockReturnValue(
      new Promise((resolve) => {
        resolveRequest = resolve;
      }),
    );

    renderLogin();

    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "john@example.com" },
    });

    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "password123" },
    });

    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(
      await screen.findByRole("button", { name: /signing in/i }),
    ).toBeInTheDocument();

    expect(screen.getByRole("button", { name: /signing in/i })).toBeDisabled();

    await act(async () => {
      resolveRequest({
        data: {
          token: "test-token",
          user: {
            id: "123",
            name: "John Doe",
            email: "john@example.com",
            role: "user",
          },
        },
      });
    });
  });
});

describe("Register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  const renderRegister = () => {
    return render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>,
    );
  };

  it("renders registration form", () => {
    renderRegister();

    expect(screen.getByText("Create your account")).toBeInTheDocument();

    expect(screen.getByPlaceholderText("John Doe")).toBeInTheDocument();

    expect(screen.getByPlaceholderText("you@example.com")).toBeInTheDocument();

    expect(screen.getByPlaceholderText("••••••••")).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: /create account/i }),
    ).toBeInTheDocument();
  });

  it("updates registration fields", () => {
    renderRegister();

    const nameInput = screen.getByPlaceholderText("John Doe");
    const emailInput = screen.getByPlaceholderText("you@example.com");
    const passwordInput = screen.getByPlaceholderText("••••••••");

    fireEvent.change(nameInput, {
      target: { value: "John Doe" },
    });

    fireEvent.change(emailInput, {
      target: { value: "john@example.com" },
    });

    fireEvent.change(passwordInput, {
      target: { value: "password123" },
    });

    expect(nameInput).toHaveValue("John Doe");
    expect(emailInput).toHaveValue("john@example.com");
    expect(passwordInput).toHaveValue("password123");
  });

  it("submits registration and stores authentication data", async () => {
    api.post.mockResolvedValue({
      data: {
        token: "register-token",
        user: {
          id: "123",
          name: "John Doe",
          email: "john@example.com",
          role: "user",
        },
      },
    });

    renderRegister();

    fireEvent.change(screen.getByPlaceholderText("John Doe"), {
      target: { value: "John Doe" },
    });

    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "john@example.com" },
    });

    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "password123" },
    });

    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/auth/register", {
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
      });
    });

    expect(localStorage.getItem("token")).toBe("register-token");

    expect(JSON.parse(localStorage.getItem("user"))).toEqual({
      id: "123",
      name: "John Doe",
      email: "john@example.com",
      role: "user",
    });

    expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
  });

  it("shows API error when registration fails", async () => {
    api.post.mockRejectedValue({
      response: {
        data: {
          message: "Email already exists",
        },
      },
    });

    renderRegister();

    fireEvent.change(screen.getByPlaceholderText("John Doe"), {
      target: { value: "John Doe" },
    });

    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "john@example.com" },
    });

    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "password123" },
    });

    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByText("Email already exists")).toBeInTheDocument();

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("shows loading state while registration request is pending", async () => {
    let resolveRequest;

    api.post.mockReturnValue(
      new Promise((resolve) => {
        resolveRequest = resolve;
      }),
    );

    renderRegister();

    fireEvent.change(screen.getByPlaceholderText("John Doe"), {
      target: { value: "John Doe" },
    });

    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "john@example.com" },
    });

    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "password123" },
    });

    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    expect(
      await screen.findByRole("button", { name: /creating account/i }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: /creating account/i }),
    ).toBeDisabled();

    await act(async () => {
      resolveRequest({
        data: {
          token: "register-token",
          user: {
            id: "123",
            name: "John Doe",
            email: "john@example.com",
            role: "user",
          },
        },
      });
    });
  });
});