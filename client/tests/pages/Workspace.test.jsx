import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import api from "../../src/api/api.js";

import Workspaces from "../../src/pages/Workspaces.jsx";
import TaskForm from "../../src/pages/TaskForm.jsx";
import WorkspaceDetails from "../../src/pages/WorkspaceDetails.jsx";

vi.mock("../../src/api/api.js", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

/*
 * Keep Workspace page tests focused on page behavior.
 * The child components already have their own tests.
 */
vi.mock("../../src/components/WorkspaceCard.jsx", () => ({
  default: ({ workspace, onClick }) => (
    <button onClick={onClick}>{workspace.name}</button>
  ),
}));

vi.mock("../../src/components/CreateWorkspaceForm.jsx", () => ({
  default: ({ form, setForm, onSubmit, loading, error }) => (
    <form onSubmit={onSubmit}>
      <input
        placeholder="Workspace name"
        value={form.name}
        onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
      />

      <input
        placeholder="Workspace description"
        value={form.description}
        onChange={(e) =>
          setForm((prev) => ({ ...prev, description: e.target.value }))
        }
      />

      {error && <div>{error}</div>}

      <button type="submit" disabled={loading}>
        {loading ? "Creating..." : "Create Workspace"}
      </button>
    </form>
  ),
}));

vi.mock("../../src/components/TaskCard.jsx", () => ({
  default: ({ task, onStatusChange, onEdit, onDelete }) => (
    <div>
      <span>{task.title}</span>

      <button onClick={() => onStatusChange(task.id, "Completed")}>
        Complete {task.title}
      </button>

      <button onClick={() => onEdit(task)}>Edit {task.title}</button>

      <button onClick={() => onDelete(task.id)}>Delete {task.title}</button>
    </div>
  ),
}));

vi.mock("../../src/components/MemberList.jsx", () => ({
  default: ({ members, canManage, onRemove }) => (
    <div>
      {members.map((member) => (
        <div key={member._id}>
          <span>{member.name}</span>

          {canManage && member._id !== "owner-1" && (
            <button onClick={() => onRemove(member._id)}>
              Remove {member.name}
            </button>
          )}
        </div>
      ))}
    </div>
  ),
}));

vi.mock("../../src/components/Modal.jsx", () => ({
  default: ({ isOpen, title, children }) =>
    isOpen ? (
      <div role="dialog">
        <h2>{title}</h2>
        {children}
      </div>
    ) : null,
}));

const renderWithRoute = (ui, initialEntry = "/") => {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>{ui}</MemoryRouter>,
  );
};

const renderWorkspaceDetails = () => {
  return render(
    <MemoryRouter initialEntries={["/workspaces/workspace-1"]}>
      <Routes>
        <Route path="/workspaces/:workspaceId" element={<WorkspaceDetails />} />
        <Route path="/workspaces" element={<div>Workspaces Page</div>} />
      </Routes>
    </MemoryRouter>,
  );
};

const baseWorkspace = {
  _id: "workspace-1",
  name: "Engineering",
  description: "Engineering workspace",
};

const baseTask = {
  id: "task-1",
  title: "Build API",
  description: "Build the API",
  priority: "High",
  status: "Todo",
  assignedTo: {
    id: "user-2",
  },
};

const baseMember = {
  _id: "user-2",
  name: "Jane",
  email: "jane@example.com",
};

describe("Workspaces", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("shows loading state while workspaces are loading", () => {
    api.get.mockReturnValue(new Promise(() => {}));

    renderWithRoute(<Workspaces />);

    expect(screen.getByText("Loading workspaces...")).toBeInTheDocument();
  });

  it("loads and displays workspaces", async () => {
    api.get.mockResolvedValue({
      data: {
        workspaces: [
          baseWorkspace,
          {
            ...baseWorkspace,
            _id: "workspace-2",
            name: "Marketing",
          },
        ],
      },
    });

    renderWithRoute(<Workspaces />);

    expect(await screen.findByText("Engineering")).toBeInTheDocument();
    expect(screen.getByText("Marketing")).toBeInTheDocument();

    expect(api.get).toHaveBeenCalledWith("/workspace");
  });

  it("shows the correct workspace count", async () => {
    api.get.mockResolvedValue({
      data: {
        workspaces: [
          baseWorkspace,
          {
            ...baseWorkspace,
            _id: "workspace-2",
            name: "Marketing",
          },
        ],
      },
    });

    renderWithRoute(<Workspaces />);

    expect(
      await screen.findByText("2 workspaces available"),
    ).toBeInTheDocument();
  });

  it("shows the empty state when there are no workspaces", async () => {
    api.get.mockResolvedValue({
      data: {
        workspaces: [],
      },
    });

    renderWithRoute(<Workspaces />);

    expect(await screen.findByText("No workspaces yet.")).toBeInTheDocument();

    expect(
      screen.getByText("You have not been added to any workspace yet."),
    ).toBeInTheDocument();
  });

  it("shows create workspace form for a manager", async () => {
    localStorage.setItem(
      "user",
      JSON.stringify({
        id: "manager-1",
        role: "manager",
      }),
    );

    api.get.mockResolvedValue({
      data: {
        workspaces: [],
      },
    });

    renderWithRoute(<Workspaces />);

    await screen.findByText("No workspaces yet.");

    expect(
      screen.getByRole("button", {
        name: "Create Workspace",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByText("Create your first workspace above to get started."),
    ).toBeInTheDocument();
  });

  it("does not show create workspace form for a normal user", async () => {
    localStorage.setItem(
      "user",
      JSON.stringify({
        id: "user-1",
        role: "user",
      }),
    );

    api.get.mockResolvedValue({
      data: {
        workspaces: [],
      },
    });

    renderWithRoute(<Workspaces />);

    await screen.findByText("No workspaces yet.");

    expect(
      screen.queryByRole("button", {
        name: "Create Workspace",
      }),
    ).not.toBeInTheDocument();

    expect(
      screen.getByText("You have not been added to any workspace yet."),
    ).toBeInTheDocument();
  });

  it("creates a workspace and adds it to the list", async () => {
    const user = userEvent.setup();

    localStorage.setItem(
      "user",
      JSON.stringify({
        id: "manager-1",
        role: "manager",
      }),
    );

    api.get.mockResolvedValue({
      data: {
        workspaces: [],
      },
    });

    api.post.mockResolvedValue({
      data: {
        workspace: {
          _id: "workspace-new",
          name: "New Workspace",
          description: "New description",
        },
      },
    });

    renderWithRoute(<Workspaces />);

    await screen.findByText("No workspaces yet.");

    await user.type(
      screen.getByPlaceholderText("Workspace name"),
      "New Workspace",
    );

    await user.type(
      screen.getByPlaceholderText("Workspace description"),
      "New description",
    );

    await user.click(
      screen.getByRole("button", {
        name: "Create Workspace",
      }),
    );

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/workspace/create", {
        name: "New Workspace",
        description: "New description",
      });
    });

    expect(await screen.findByText("New Workspace")).toBeInTheDocument();
  });

  it("shows create error when workspace creation fails", async () => {
    const user = userEvent.setup();

    localStorage.setItem(
      "user",
      JSON.stringify({
        id: "manager-1",
        role: "manager",
      }),
    );

    api.get.mockResolvedValue({
      data: {
        workspaces: [],
      },
    });

    api.post.mockRejectedValue({
      response: {
        data: {
          message: "Workspace name already exists",
        },
      },
    });

    renderWithRoute(<Workspaces />);

    await screen.findByText("No workspaces yet.");

    await user.type(screen.getByPlaceholderText("Workspace name"), "Existing");

    await user.click(
      screen.getByRole("button", {
        name: "Create Workspace",
      }),
    );

    expect(
      await screen.findByText("Workspace name already exists"),
    ).toBeInTheDocument();
  });

  it("shows fetch error when loading workspaces fails", async () => {
    api.get.mockRejectedValue({
      response: {
        data: {
          message: "Unable to load workspaces",
        },
      },
    });

    renderWithRoute(<Workspaces />);

    expect(
      await screen.findByText("Unable to load workspaces"),
    ).toBeInTheDocument();
  });
});

describe("TaskForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    localStorage.setItem(
      "user",
      JSON.stringify({
        id: "user-1",
        role: "manager",
      }),
    );
  });

  const renderTaskForm = (props = {}) => {
    const defaultProps = {
      members: [
        {
          _id: "user-1",
          name: "Current User",
          email: "current@example.com",
        },
        baseMember,
      ],
      setEditingTask: vi.fn(),
      editingTask: null,
      setTasks: vi.fn(),
      onClose: vi.fn(),
    };

    return render(
      <MemoryRouter initialEntries={["/workspaces/workspace-1"]}>
        <Routes>
          <Route
            path="/workspaces/:workspaceId"
            element={<TaskForm {...defaultProps} {...props} />}
          />
        </Routes>
      </MemoryRouter>,
    );
  };

  it("renders the create task form with default values", () => {
    renderTaskForm();

    expect(screen.getByPlaceholderText("Task title")).toHaveValue("");

    expect(screen.getByPlaceholderText("Task description")).toHaveValue("");

    expect(document.querySelector('select[name="priority"]')).toHaveValue(
      "Medium",
    );

    expect(document.querySelector('select[name="assignedTo"]')).toHaveValue("");

    expect(
      screen.getByRole("button", {
        name: "Create Task",
      }),
    ).toBeInTheDocument();
  });
  it("shows members except the current user in the assignee list", () => {
    renderTaskForm();

    expect(
      screen.getByRole("option", {
        name: "Jane",
      }),
    ).toBeInTheDocument();

    expect(
      screen.queryByRole("option", {
        name: "Current User",
      }),
    ).not.toBeInTheDocument();
  });

  it("creates a task", async () => {
    const user = userEvent.setup();
    const setTasks = vi.fn();
    const onClose = vi.fn();

    api.post.mockResolvedValue({
      data: {
        task: baseTask,
      },
    });

    renderTaskForm({
      setTasks,
      onClose,
    });

    await user.type(screen.getByPlaceholderText("Task title"), "Build API");

    await user.type(
      screen.getByPlaceholderText("Task description"),
      "Build the API",
    );

    await user.selectOptions(screen.getAllByRole("combobox")[0], "High");

    await user.selectOptions(screen.getAllByRole("combobox")[1], "user-2");

    await user.click(
      screen.getByRole("button", {
        name: "Create Task",
      }),
    );

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        "/task/create",
        expect.objectContaining({
          title: "Build API",
          description: "Build the API",
          priority: "High",
          workspaceId: "workspace-1",
          assignedTo: "user-2",
        }),
      );
    });

    expect(setTasks).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("creates an unassigned task when no member is selected", async () => {
    const user = userEvent.setup();

    api.post.mockResolvedValue({
      data: {
        task: baseTask,
      },
    });

    renderTaskForm();

    await user.type(
      screen.getByPlaceholderText("Task title"),
      "Unassigned Task",
    );

    await user.click(
      screen.getByRole("button", {
        name: "Create Task",
      }),
    );

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        "/task/create",
        expect.objectContaining({
          title: "Unassigned Task",
          workspaceId: "workspace-1",
          assignedTo: undefined,
        }),
      );
    });
  });

  it("shows create error when task creation fails", async () => {
    const user = userEvent.setup();

    api.post.mockRejectedValue({
      response: {
        data: {
          message: "Task creation failed",
        },
      },
    });

    renderTaskForm();

    await user.type(screen.getByPlaceholderText("Task title"), "Broken Task");

    await user.click(
      screen.getByRole("button", {
        name: "Create Task",
      }),
    );

    expect(await screen.findByText("Task creation failed")).toBeInTheDocument();
  });

  it("populates the form when editing a task", () => {
    renderTaskForm({
      editingTask: {
        id: "task-1",
        title: "Existing Task",
        description: "Existing description",
        priority: "High",
        deadline: "2026-09-30T00:00:00.000Z",
        assignedTo: {
          id: "user-2",
        },
      },
    });

    expect(screen.getByPlaceholderText("Task title")).toHaveValue(
      "Existing Task",
    );

    expect(screen.getByPlaceholderText("Task description")).toHaveValue(
      "Existing description",
    );

    expect(
      screen.getByRole("button", {
        name: "Update Task",
      }),
    ).toBeInTheDocument();

    expect(screen.getByDisplayValue("2026-09-30")).toBeInTheDocument();
  });

  it("updates an existing task", async () => {
    const user = userEvent.setup();
    const setTasks = vi.fn();
    const setEditingTask = vi.fn();
    const onClose = vi.fn();

    const editingTask = {
      id: "task-1",
      title: "Old Title",
      description: "Old description",
      priority: "Medium",
      deadline: "2026-09-30T00:00:00.000Z",
      assignedTo: {
        id: "user-2",
      },
    };

    const updatedTask = {
      ...baseTask,
      title: "Updated Title",
    };

    api.put.mockResolvedValue({
      data: {
        task: updatedTask,
      },
    });

    renderTaskForm({
      setTasks,
      setEditingTask,
      onClose,
      editingTask,
    });

    const titleInput = screen.getByPlaceholderText("Task title");

    await user.clear(titleInput);
    await user.type(titleInput, "Updated Title");

    await user.click(
      screen.getByRole("button", {
        name: "Update Task",
      }),
    );

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith(
        "/task/task-1",
        expect.objectContaining({
          title: "Updated Title",
          workspaceId: "workspace-1",
          assignedTo: "user-2",
        }),
      );
    });

    expect(setTasks).toHaveBeenCalled();
    expect(setEditingTask).toHaveBeenCalledWith(null);
    expect(onClose).toHaveBeenCalled();
  });

  it("shows update error when updating a task fails", async () => {
    const user = userEvent.setup();

    api.put.mockRejectedValue({
      response: {
        data: {
          message: "Task update failed",
        },
      },
    });

    renderTaskForm({
      editingTask: {
        id: "task-1",
        title: "Existing Task",
        description: "Existing description",
        priority: "Medium",
        deadline: "",
        assignedTo: {
          id: "user-2",
        },
      },
    });

    await user.click(
      screen.getByRole("button", {
        name: "Update Task",
      }),
    );

    expect(await screen.findByText("Task update failed")).toBeInTheDocument();
  });

  it("cancels editing and resets the form", async () => {
    const user = userEvent.setup();
    const setEditingTask = vi.fn();
    const onClose = vi.fn();

    renderTaskForm({
      setEditingTask,
      onClose,
      editingTask: {
        id: "task-1",
        title: "Existing Task",
        description: "Existing description",
        priority: "High",
        deadline: "",
        assignedTo: {
          id: "user-2",
        },
      },
    });

    expect(screen.getByPlaceholderText("Task title")).toHaveValue(
      "Existing Task",
    );

    await user.click(
      screen.getByRole("button", {
        name: "Cancel",
      }),
    );

    expect(setEditingTask).toHaveBeenCalledWith(null);
    expect(onClose).toHaveBeenCalled();

    expect(screen.getByPlaceholderText("Task title")).toHaveValue("");
  });
});

describe("WorkspaceDetails", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    localStorage.setItem(
      "user",
      JSON.stringify({
        id: "owner-1",
        role: "manager",
      }),
    );
  });

  const mockWorkspaceData = () => {
    api.get.mockImplementation((url) => {
      if (url === "/workspace/workspace-1") {
        return Promise.resolve({
          data: {
            workspace: {
              ...baseWorkspace,
              owner: "owner-1",
            },
          },
        });
      }

      if (url === "/workspace/workspace-1/members") {
        return Promise.resolve({
          data: {
            members: [
              {
                _id: "owner-1",
                name: "Owner",
                email: "owner@example.com",
              },
              baseMember,
            ],
          },
        });
      }

      if (url === "/task/workspace/workspace-1") {
        return Promise.resolve({
          data: {
            tasks: [baseTask],
          },
        });
      }

      return Promise.reject(new Error(`Unexpected GET: ${url}`));
    });
  };

  it("shows loading state while workspace data is loading", () => {
    api.get.mockReturnValue(new Promise(() => {}));

    renderWorkspaceDetails();

    expect(screen.getByText("Loading workspace...")).toBeInTheDocument();
  });

  it("loads workspace, members, and tasks", async () => {
    mockWorkspaceData();

    renderWorkspaceDetails();

    expect(
      await screen.findByRole("heading", {
        name: "Engineering",
      }),
    ).toBeInTheDocument();

    expect(screen.getByText("Engineering workspace")).toBeInTheDocument();
    expect(screen.getByText("Owner")).toBeInTheDocument();
    expect(screen.getByText("Jane")).toBeInTheDocument();
    expect(screen.getByText("Build API")).toBeInTheDocument();

    expect(api.get).toHaveBeenCalledWith("/workspace/workspace-1");

    expect(api.get).toHaveBeenCalledWith("/workspace/workspace-1/members");

    expect(api.get).toHaveBeenCalledWith("/task/workspace/workspace-1");
  });

  it("shows loading error when workspace data fails", async () => {
    api.get.mockRejectedValue({
      response: {
        data: {
          message: "Workspace not found",
        },
      },
    });

    renderWorkspaceDetails();

    expect(await screen.findByText("Workspace not found")).toBeInTheDocument();
  });

  it("shows management controls for the workspace owner", async () => {
    mockWorkspaceData();

    renderWorkspaceDetails();

    await screen.findByRole("heading", {
      name: "Engineering",
    });

    expect(
      screen.getByRole("button", {
        name: "Edit",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Delete",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "+ Add Member",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "+ New Task",
      }),
    ).toBeInTheDocument();
  });

  it("does not show management controls for a normal member", async () => {
    localStorage.setItem(
      "user",
      JSON.stringify({
        id: "user-2",
        role: "user",
      }),
    );

    mockWorkspaceData();

    renderWorkspaceDetails();

    await screen.findByRole("heading", {
      name: "Engineering",
    });

    expect(
      screen.queryByRole("button", {
        name: "Edit",
      }),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByRole("button", {
        name: "Delete",
      }),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByRole("button", {
        name: "+ Add Member",
      }),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByRole("button", {
        name: "+ New Task",
      }),
    ).not.toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Leave",
      }),
    ).toBeInTheDocument();
  });

  it("optimistically updates task status", async () => {
    const user = userEvent.setup();

    mockWorkspaceData();

    api.patch.mockResolvedValue({
      data: {
        task: {
          ...baseTask,
          status: "Completed",
        },
      },
    });

    renderWorkspaceDetails();

    await screen.findByText("Build API");

    await user.click(
      screen.getByRole("button", {
        name: "Complete Build API",
      }),
    );

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith("/task/task-1", {
        status: "Completed",
      });
    });
  });

  it("rolls back task status when status update fails", async () => {
    const user = userEvent.setup();
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});

    mockWorkspaceData();

    api.patch.mockRejectedValue({
      response: {
        data: {
          message: "Status update failed",
        },
      },
    });

    renderWorkspaceDetails();

    await screen.findByText("Build API");

    await user.click(
      screen.getByRole("button", {
        name: "Complete Build API",
      }),
    );

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith("Status update failed");
    });

    alertSpy.mockRestore();
  });

  it("opens the new task modal", async () => {
    const user = userEvent.setup();

    mockWorkspaceData();

    renderWorkspaceDetails();

    await screen.findByRole("heading", {
      name: "Engineering",
    });

    await user.click(
      screen.getByRole("button", {
        name: "+ New Task",
      }),
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();

    expect(
      screen.getByRole("heading", {
        name: "New Task",
      }),
    ).toBeInTheDocument();
  });

  it("opens the edit task modal", async () => {
    const user = userEvent.setup();

    mockWorkspaceData();

    renderWorkspaceDetails();

    await screen.findByText("Build API");

    await user.click(
      screen.getByRole("button", {
        name: "Edit Build API",
      }),
    );

    expect(
      screen.getByRole("heading", {
        name: "Edit Task",
      }),
    ).toBeInTheDocument();
  });

  it("deletes a task after confirmation", async () => {
    const user = userEvent.setup();

    vi.spyOn(window, "confirm").mockReturnValue(true);

    mockWorkspaceData();

    api.delete.mockResolvedValue({
      data: {
        success: true,
      },
    });

    renderWorkspaceDetails();

    await screen.findByText("Build API");

    await user.click(
      screen.getByRole("button", {
        name: "Delete Build API",
      }),
    );

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith("/task/task-1");
    });

    expect(screen.queryByText("Build API")).not.toBeInTheDocument();

    window.confirm.mockRestore();
  });

  it("does not delete a task when confirmation is cancelled", async () => {
    const user = userEvent.setup();

    vi.spyOn(window, "confirm").mockReturnValue(false);

    mockWorkspaceData();

    renderWorkspaceDetails();

    await screen.findByText("Build API");

    await user.click(
      screen.getByRole("button", {
        name: "Delete Build API",
      }),
    );

    expect(api.delete).not.toHaveBeenCalled();

    expect(screen.getByText("Build API")).toBeInTheDocument();

    window.confirm.mockRestore();
  });

  it("adds a member", async () => {
    const user = userEvent.setup();

    mockWorkspaceData();

    api.post.mockResolvedValue({
      data: {
        member: {
          _id: "user-3",
          name: "John",
          email: "john@example.com",
        },
      },
    });

    renderWorkspaceDetails();

    await screen.findByRole("heading", {
      name: "Engineering",
    });

    await user.click(
      screen.getByRole("button", {
        name: "+ Add Member",
      }),
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.type(
      screen.getByPlaceholderText("Enter member email"),
      "john@example.com",
    );

    await user.click(
      screen.getByRole("button", {
        name: "Add Member",
      }),
    );

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/workspace/workspace-1/members", {
        email: "john@example.com",
      });
    });

    expect(await screen.findByText("John")).toBeInTheDocument();
  });

  it("shows an error when adding a member fails", async () => {
    const user = userEvent.setup();

    mockWorkspaceData();

    api.post.mockRejectedValue({
      response: {
        data: {
          message: "User not found",
        },
      },
    });

    renderWorkspaceDetails();

    await screen.findByRole("heading", {
      name: "Engineering",
    });

    await user.click(
      screen.getByRole("button", {
        name: "+ Add Member",
      }),
    );

    await user.type(
      screen.getByPlaceholderText("Enter member email"),
      "missing@example.com",
    );

    await user.click(
      screen.getByRole("button", {
        name: "Add Member",
      }),
    );

    expect(await screen.findByText("User not found")).toBeInTheDocument();
  });

  it("removes a member after confirmation", async () => {
    const user = userEvent.setup();

    vi.spyOn(window, "confirm").mockReturnValue(true);

    mockWorkspaceData();

    api.delete.mockResolvedValue({
      data: {
        success: true,
      },
    });

    renderWorkspaceDetails();

    await screen.findByText("Jane");

    await user.click(
      screen.getByRole("button", {
        name: "Remove Jane",
      }),
    );

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith(
        "/workspace/workspace-1/members/user-2",
      );
    });

    expect(screen.queryByText("Jane")).not.toBeInTheDocument();

    window.confirm.mockRestore();
  });

  it("updates the workspace", async () => {
    const user = userEvent.setup();

    mockWorkspaceData();

    api.patch.mockResolvedValue({
      data: {
        workspace: {
          ...baseWorkspace,
          owner: "owner-1",
          name: "Updated Workspace",
          description: "Updated description",
        },
      },
    });

    renderWorkspaceDetails();

    await screen.findByRole("heading", {
      name: "Engineering",
    });

    await user.click(
      screen.getByRole("button", {
        name: "Edit",
      }),
    );

    expect(
      screen.getByRole("heading", {
        name: "Edit Workspace",
      }),
    ).toBeInTheDocument();

    const nameInput = screen.getByPlaceholderText("Workspace name");

    await user.clear(nameInput);
    await user.type(nameInput, "Updated Workspace");

    await user.click(
      screen.getByRole("button", {
        name: "Save Changes",
      }),
    );

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith("/workspace/workspace-1", {
        name: "Updated Workspace",
        description: "Engineering workspace",
      });
    });

    expect(
      await screen.findByRole("heading", {
        name: "Updated Workspace",
      }),
    ).toBeInTheDocument();
  });

  it("shows workspace update error", async () => {
    const user = userEvent.setup();

    mockWorkspaceData();

    api.patch.mockRejectedValue({
      response: {
        data: {
          message: "Update failed",
        },
      },
    });

    renderWorkspaceDetails();

    await screen.findByRole("heading", {
      name: "Engineering",
    });

    await user.click(
      screen.getByRole("button", {
        name: "Edit",
      }),
    );

    await user.click(
      screen.getByRole("button", {
        name: "Save Changes",
      }),
    );

    expect(await screen.findByText("Update failed")).toBeInTheDocument();
  });

  it("leaves the workspace after confirmation", async () => {
    const user = userEvent.setup();

    vi.spyOn(window, "confirm").mockReturnValue(true);

    mockWorkspaceData();

    api.delete.mockResolvedValue({
      data: {
        success: true,
      },
    });

    renderWorkspaceDetails();

    await screen.findByRole("heading", {
      name: "Engineering",
    });

    await user.click(
      screen.getByRole("button", {
        name: "Leave",
      }),
    );

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith("/workspace/workspace-1/leave");
    });

    expect(await screen.findByText("Workspaces Page")).toBeInTheDocument();

    window.confirm.mockRestore();
  });

  it("deletes the workspace after confirmation", async () => {
    const user = userEvent.setup();

    vi.spyOn(window, "confirm").mockReturnValue(true);

    mockWorkspaceData();

    api.delete.mockResolvedValue({
      data: {
        success: true,
      },
    });

    renderWorkspaceDetails();

    await screen.findByRole("heading", {
      name: "Engineering",
    });

    await user.click(
      screen.getByRole("button", {
        name: "Delete",
      }),
    );

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith("/workspace/workspace-1");
    });

    expect(await screen.findByText("Workspaces Page")).toBeInTheDocument();

    window.confirm.mockRestore();
  });
});
