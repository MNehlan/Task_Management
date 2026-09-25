import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MemberList from "../../src/components/MemberList";

describe("MemberList", () => {
  const members = [
    {
      _id: "user-1",
      name: "John Doe",
      email: "john@example.com",
      role: "manager",
    },
    {
      _id: "user-2",
      name: "Jane Smith",
      email: "jane@example.com",
      role: "member",
    },
  ];

  it("should display No members yet when the list is empty", () => {
    render(
      <MemberList
        members={[]}
        canManage={false}
        ownerId="user-1"
        onRemove={() => {}}
      />,
    );

    expect(screen.getByText("No members yet.")).toBeInTheDocument();
  });

  it("should render all members", () => {
    render(
      <MemberList
        members={members}
        canManage={false}
        ownerId="user-1"
        onRemove={() => {}}
      />,
    );

    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();

    expect(screen.getByText("john@example.com")).toBeInTheDocument();
    expect(screen.getByText("jane@example.com")).toBeInTheDocument();
  });

  it("should display each member role", () => {
    render(
      <MemberList
        members={members}
        canManage={false}
        ownerId="user-1"
        onRemove={() => {}}
      />,
    );

    expect(screen.getByText("manager")).toBeInTheDocument();
    expect(screen.getByText("member")).toBeInTheDocument();
  });

  it("should display the correct initials", () => {
    render(
      <MemberList
        members={members}
        canManage={false}
        ownerId="user-1"
        onRemove={() => {}}
      />,
    );

    expect(screen.getByText("JD")).toBeInTheDocument();
    expect(screen.getByText("JS")).toBeInTheDocument();
  });

  it("should display ? when a member has no name", () => {
    const memberWithoutName = {
      _id: "user-3",
      name: "",
      email: "unknown@example.com",
      role: "member",
    };

    render(
      <MemberList
        members={[memberWithoutName]}
        canManage={false}
        ownerId="user-1"
        onRemove={() => {}}
      />,
    );

    expect(screen.getByText("?")).toBeInTheDocument();
  });

  it("should mark the owner with Owner label", () => {
    render(
      <MemberList
        members={members}
        canManage={false}
        ownerId="user-1"
        onRemove={() => {}}
      />,
    );

    expect(screen.getByText("(Owner)")).toBeInTheDocument();
  });

  it("should not mark non-owner members as owner", () => {
    render(
      <MemberList
        members={members}
        canManage={false}
        ownerId="user-1"
        onRemove={() => {}}
      />,
    );

    const ownerLabels = screen.getAllByText("(Owner)");

    expect(ownerLabels).toHaveLength(1);
  });

  it("should not show Remove buttons when user cannot manage", () => {
    render(
      <MemberList
        members={members}
        canManage={false}
        ownerId="user-1"
        onRemove={() => {}}
      />,
    );

    expect(
      screen.queryByRole("button", { name: "Remove" }),
    ).not.toBeInTheDocument();
  });

  it("should show Remove button for manageable non-owner members", () => {
    render(
      <MemberList
        members={members}
        canManage={true}
        ownerId="user-1"
        onRemove={() => {}}
      />,
    );

    expect(screen.getByRole("button", { name: "Remove" })).toBeInTheDocument();
  });

  it("should not show Remove button for the owner", () => {
    render(
      <MemberList
        members={members}
        canManage={true}
        ownerId="user-1"
        onRemove={() => {}}
      />,
    );

    const removeButtons = screen.getAllByRole("button", {
      name: "Remove",
    });

    expect(removeButtons).toHaveLength(1);
  });

  it("should call onRemove with the member id", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();

    render(
      <MemberList
        members={members}
        canManage={true}
        ownerId="user-1"
        onRemove={onRemove}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Remove" }));

    expect(onRemove).toHaveBeenCalledWith("user-2");
  });
});
