import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CreateWorkspaceForm from "../../src/components/CreateWorkspaceForm";

describe("CreateWorkspaceForm", () => {
  const form = {
    name: "",
    description: "",
  };

  const setForm = vi.fn();
  const onSubmit = vi.fn();

  const renderForm = (props = {}) => {
    return render(
      <CreateWorkspaceForm
        form={form}
        setForm={setForm}
        onSubmit={onSubmit}
        loading={false}
        error=""
        {...props}
      />,
    );
  };

  it("should render the form fields", () => {
    renderForm();

    expect(screen.getByPlaceholderText("Workspace name")).toBeInTheDocument();

    expect(
      screen.getByPlaceholderText("Short description (optional)"),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: "Create Workspace" }),
    ).toBeInTheDocument();
  });

  it("should display the current form values", () => {
    render(
      <CreateWorkspaceForm
        form={{
          name: "Development",
          description: "Development workspace",
        }}
        setForm={setForm}
        onSubmit={onSubmit}
        loading={false}
        error=""
      />,
    );

    expect(screen.getByPlaceholderText("Workspace name")).toHaveValue(
      "Development",
    );

    expect(
      screen.getByPlaceholderText("Short description (optional)"),
    ).toHaveValue("Development workspace");
  });

  it("should call setForm when the workspace name changes", async () => {
    const user = userEvent.setup();

    renderForm();

    const nameInput = screen.getByPlaceholderText("Workspace name");

    await user.type(nameInput, "Development");

    expect(setForm).toHaveBeenCalled();
  });

  it("should call setForm when the description changes", async () => {
    const user = userEvent.setup();

    renderForm();

    const descriptionInput = screen.getByPlaceholderText(
      "Short description (optional)",
    );

    await user.type(descriptionInput, "Development workspace");

    expect(setForm).toHaveBeenCalled();
  });

  it("should call onSubmit when the form is submitted", () => {
    renderForm();

    const formElement = screen
      .getByRole("button", {
        name: "Create Workspace",
      })
      .closest("form");

    fireEvent.submit(formElement);

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("should display the error message when error exists", () => {
    renderForm({
      error: "Workspace name already exists",
    });

    expect(
      screen.getByText("Workspace name already exists"),
    ).toBeInTheDocument();
  });

  it("should not display an error message when error is empty", () => {
    renderForm();

    expect(
      screen.queryByText("Workspace name already exists"),
    ).not.toBeInTheDocument();
  });

  it("should show Creating... when loading", () => {
    renderForm({
      loading: true,
    });

    expect(
      screen.getByRole("button", { name: "Creating..." }),
    ).toBeInTheDocument();
  });

  it("should disable the submit button while loading", () => {
    renderForm({
      loading: true,
    });

    expect(screen.getByRole("button", { name: "Creating..." })).toBeDisabled();
  });

  it("should enable the submit button when not loading", () => {
    renderForm({
      loading: false,
    });

    expect(
      screen.getByRole("button", { name: "Create Workspace" }),
    ).not.toBeDisabled();
  });

  it("should require the workspace name", () => {
    renderForm();

    const nameInput = screen.getByPlaceholderText("Workspace name");

    expect(nameInput).toBeRequired();
  });

  it("should allow the description to be empty", () => {
    renderForm();

    const descriptionInput = screen.getByPlaceholderText(
      "Short description (optional)",
    );

    expect(descriptionInput).not.toBeRequired();
  });
});
