import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import WorkspaceCard from "../../src/components/WorkspaceCard";

describe("WorkspaceCard", () => {
  const workspace = {
    name: "Development Team",
    description: "Workspace for development tasks",
    members: ["user1", "user2", "user3"],
  };

  it("should render the workspace name", () => {
    render(<WorkspaceCard workspace={workspace} onClick={() => {}} />);

    expect(screen.getByText("Development Team")).toBeInTheDocument();
  });

  it("should render workspace description", () => {
    render(<WorkspaceCard workspace={workspace} onClick={() => {}} />);

    expect(
      screen.getByText("Workspace for development tasks"),
    ).toBeInTheDocument();
  });

  it("should display the correct member count", () => {
    render(<WorkspaceCard workspace={workspace} onClick={() => {}} />);

    expect(screen.getByText("3 members")).toBeInTheDocument();
  });

  it("should display singular member when there is one member", () => {
    const singleMemberWorkspace = {
      ...workspace,
      members: ["user1"],
    };

    render(
      <WorkspaceCard workspace={singleMemberWorkspace} onClick={() => {}} />,
    );

    expect(screen.getByText("1 member")).toBeInTheDocument();
  });

  it("should display zero members when members are missing", () => {
    const workspaceWithoutMembers = {
      ...workspace,
      members: undefined,
    };

    render(
      <WorkspaceCard workspace={workspaceWithoutMembers} onClick={() => {}} />,
    );

    expect(screen.getByText("0 members")).toBeInTheDocument();
  });

  it("should display the fallback description when description is missing", () => {
    const workspaceWithoutDescription = {
      ...workspace,
      description: "",
    };

    render(
      <WorkspaceCard
        workspace={workspaceWithoutDescription}
        onClick={() => {}}
      />,
    );

    expect(screen.getByText("No description provided.")).toBeInTheDocument();
  });

  it("should generate the correct initials", () => {
    render(<WorkspaceCard workspace={workspace} onClick={() => {}} />);

    expect(screen.getByText("DT")).toBeInTheDocument();
  });

  it("should call onClick when the card is clicked", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(<WorkspaceCard workspace={workspace} onClick={onClick} />);

    await user.click(screen.getByText("Development Team"));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("should render the Open action", () => {
    render(<WorkspaceCard workspace={workspace} onClick={() => {}} />);

    expect(screen.getByText("Open →")).toBeInTheDocument();
  });
});
