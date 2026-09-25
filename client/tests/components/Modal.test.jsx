import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Modal from "../../src/components/Modal";

describe("Modal", () => {
  const onClose = vi.fn();

  it("should render nothing when modal is closed", () => {
    const { container } = render(
      <Modal isOpen={false} onClose={onClose} title="Test Modal">
        <p>Modal content</p>
      </Modal>,
    );

    expect(container.firstChild).toBeNull();
  });

  it("should render the modal when it is open", () => {
    render(
      <Modal isOpen={true} onClose={onClose} title="Test Modal">
        <p>Modal content</p>
      </Modal>,
    );

    expect(screen.getByText("Test Modal")).toBeInTheDocument();
    expect(screen.getByText("Modal content")).toBeInTheDocument();
  });

  it("should render the provided title", () => {
    render(
      <Modal isOpen={true} onClose={onClose} title="Create Workspace">
        <p>Content</p>
      </Modal>,
    );

    expect(
      screen.getByRole("heading", {
        name: "Create Workspace",
      }),
    ).toBeInTheDocument();
  });

  it("should render children inside the modal", () => {
    render(
      <Modal isOpen={true} onClose={onClose} title="Test Modal">
        <button>Save</button>
      </Modal>,
    );

    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  });

  it("should call onClose when the close button is clicked", async () => {
    const user = userEvent.setup();

    render(
      <Modal isOpen={true} onClose={onClose} title="Test Modal">
        <p>Content</p>
      </Modal>,
    );

    await user.click(screen.getByRole("button", { name: "×" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("should not close when the modal content is clicked", async () => {
    const user = userEvent.setup();

    render(
      <Modal isOpen={true} onClose={onClose} title="Test Modal">
        <p>Modal content</p>
      </Modal>,
    );

    await user.click(screen.getByText("Modal content"));

    expect(onClose).not.toHaveBeenCalled();
  });
});
