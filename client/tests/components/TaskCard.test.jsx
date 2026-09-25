import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TaskCard from "../../src/components/TaskCard";

describe("TaskCard", () => {
  const task = {
    id: "task-1",
    title: "Build authentication",
    description: "Implement login and registration",
    priority: "High",
    status: "Todo",
    assignedTo: {
      name: "John",
    },
    deadline: "2026-09-30T00:00:00.000Z",
  };

  it("should render the task title", () => {
    render(
      <TaskCard
        task={task}
        canManage={false}
        onStatusChange={() => {}}
        onEdit={() => {}}
        onDelete={() => {}}
      />,
    );

    expect(screen.getByText("Build authentication")).toBeInTheDocument();
  });

  it("should render the task description", () => {
    render(
      <TaskCard
        task={task}
        canManage={false}
        onStatusChange={() => {}}
        onEdit={() => {}}
        onDelete={() => {}}
      />,
    );

    expect(
      screen.getByText("Implement login and registration"),
    ).toBeInTheDocument();
  });

  it("should render the task priority", () => {
    render(
      <TaskCard
        task={task}
        canManage={false}
        onStatusChange={() => {}}
        onEdit={() => {}}
        onDelete={() => {}}
      />,
    );

    expect(screen.getByText("High")).toBeInTheDocument();
  });

  it("should render the assigned user", () => {
    render(
      <TaskCard
        task={task}
        canManage={false}
        onStatusChange={() => {}}
        onEdit={() => {}}
        onDelete={() => {}}
      />,
    );

    expect(screen.getByText("John")).toBeInTheDocument();
  });

  it("should display Unassigned when no user is assigned", () => {
    const unassignedTask = {
      ...task,
      assignedTo: null,
    };

    render(
      <TaskCard
        task={unassignedTask}
        canManage={false}
        onStatusChange={() => {}}
        onEdit={() => {}}
        onDelete={() => {}}
      />,
    );

    expect(screen.getByText("Unassigned")).toBeInTheDocument();
  });

  it("should display the deadline", () => {
    render(
      <TaskCard
        task={task}
        canManage={false}
        onStatusChange={() => {}}
        onEdit={() => {}}
        onDelete={() => {}}
      />,
    );

    expect(screen.getByText("30 Sept 2026")).toBeInTheDocument();
  });

  it("should display a dash when no deadline exists", () => {
    const taskWithoutDeadline = {
      ...task,
      deadline: null,
    };

    render(
      <TaskCard
        task={taskWithoutDeadline}
        canManage={false}
        onStatusChange={() => {}}
        onEdit={() => {}}
        onDelete={() => {}}
      />,
    );

    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("should show only member status options when the user cannot manage", () => {
    render(
      <TaskCard
        task={task}
        canManage={false}
        onStatusChange={() => {}}
        onEdit={() => {}}
        onDelete={() => {}}
      />,
    );

    const select = screen.getByRole("combobox");

    expect(select).toHaveValue("Todo");

    expect(screen.getByRole("option", { name: "Todo" })).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "In Progress" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Review" })).toBeInTheDocument();

    expect(
      screen.queryByRole("option", { name: "Completed" }),
    ).not.toBeInTheDocument();
  });

  it("should show all status options when the user can manage", () => {
    render(
      <TaskCard
        task={task}
        canManage={true}
        onStatusChange={() => {}}
        onEdit={() => {}}
        onDelete={() => {}}
      />,
    );

    expect(screen.getByRole("option", { name: "Todo" })).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "In Progress" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Review" })).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Completed" }),
    ).toBeInTheDocument();
  });

  it("should call onStatusChange when the status changes", async () => {
    const user = userEvent.setup();
    const onStatusChange = vi.fn();

    render(
      <TaskCard
        task={task}
        canManage={false}
        onStatusChange={onStatusChange}
        onEdit={() => {}}
        onDelete={() => {}}
      />,
    );

    await user.selectOptions(screen.getByRole("combobox"), "In Progress");

    expect(onStatusChange).toHaveBeenCalledWith("task-1", "In Progress");
  });

  it("should show Edit and Delete buttons when user can manage", () => {
    render(
      <TaskCard
        task={task}
        canManage={true}
        onStatusChange={() => {}}
        onEdit={() => {}}
        onDelete={() => {}}
      />,
    );

    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
  });

  it("should not show Edit and Delete buttons when user cannot manage", () => {
    render(
      <TaskCard
        task={task}
        canManage={false}
        onStatusChange={() => {}}
        onEdit={() => {}}
        onDelete={() => {}}
      />,
    );

    expect(
      screen.queryByRole("button", { name: "Edit" }),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByRole("button", { name: "Delete" }),
    ).not.toBeInTheDocument();
  });

  it("should call onEdit with the task when Edit is clicked", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();

    render(
      <TaskCard
        task={task}
        canManage={true}
        onStatusChange={() => {}}
        onEdit={onEdit}
        onDelete={() => {}}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Edit" }));

    expect(onEdit).toHaveBeenCalledWith(task);
  });

  it("should call onDelete with the task id when Delete is clicked", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();

    render(
      <TaskCard
        task={task}
        canManage={true}
        onStatusChange={() => {}}
        onEdit={() => {}}
        onDelete={onDelete}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(onDelete).toHaveBeenCalledWith("task-1");
  });

  it("should disable the status select when the task is completed", () => {
    const completedTask = {
      ...task,
      status: "Completed",
    };

    render(
      <TaskCard
        task={completedTask}
        canManage={true}
        onStatusChange={() => {}}
        onEdit={() => {}}
        onDelete={() => {}}
      />,
    );

    const select = screen.getByRole("combobox");

    expect(select).toBeDisabled();
    expect(select).toHaveValue("Completed");
  });

  it("should not show Edit button when the task is completed", () => {
    const completedTask = {
      ...task,
      status: "Completed",
    };

    render(
      <TaskCard
        task={completedTask}
        canManage={true}
        onStatusChange={() => {}}
        onEdit={() => {}}
        onDelete={() => {}}
      />,
    );

    expect(
      screen.queryByRole("button", { name: "Edit" }),
    ).not.toBeInTheDocument();

    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
  });

  it("should render only Completed option for a completed task", () => {
    const completedTask = {
      ...task,
      status: "Completed",
    };

    render(
      <TaskCard
        task={completedTask}
        canManage={true}
        onStatusChange={() => {}}
        onEdit={() => {}}
        onDelete={() => {}}
      />,
    );

    expect(
      screen.getByRole("option", { name: "Completed" }),
    ).toBeInTheDocument();

    expect(
      screen.queryByRole("option", { name: "Todo" }),
    ).not.toBeInTheDocument();
  });
});
