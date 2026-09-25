import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import api from '../../src/api/api.js';

import ManageUsers from '../../src/pages/ManageUsers.jsx';
import ManageWorkspaces from '../../src/pages/ManageWorkspaces.jsx';
import ManageTasks from '../../src/pages/ManageTasks.jsx';

vi.mock('../../src/api/api.js', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../../src/components/Modal.jsx', () => ({
  default: ({ isOpen, title, children }) =>
    isOpen ? (
      <div role="dialog">
        <h2>{title}</h2>
        {children}
      </div>
    ) : null,
}));

describe('ManageUsers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    localStorage.setItem(
      'user',
      JSON.stringify({
        id: 'admin-1',
        role: 'admin',
      })
    );
  });

  const users = [
    {
      id: 'admin-1',
      name: 'Admin User',
      email: 'admin@example.com',
      role: 'admin',
      createdAt: '2026-01-15T00:00:00.000Z',
    },
    {
      id: 'user-1',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'member',
      createdAt: '2026-02-20T00:00:00.000Z',
    },
    {
      id: 'manager-1',
      name: 'Jane Manager',
      email: 'jane@example.com',
      role: 'manager',
      createdAt: '2026-03-10T00:00:00.000Z',
    },
  ];

  it('shows loading state while users are loading', () => {
    api.get.mockReturnValue(new Promise(() => {}));

    render(<ManageUsers />);

    expect(
      screen.getByText('Loading user database...')
    ).toBeInTheDocument();
  });

  it('loads and displays users', async () => {
    api.get.mockResolvedValue({
      data: {
        users,
      },
    });

    render(<ManageUsers />);

    expect(
      await screen.findByText('John Doe')
    ).toBeInTheDocument();

    expect(
      screen.getByText('Jane Manager')
    ).toBeInTheDocument();

    expect(
      screen.getByText('john@example.com')
    ).toBeInTheDocument();

    expect(api.get).toHaveBeenCalledWith('/admin/users');
  });

  it('marks the current user as You', async () => {
    api.get.mockResolvedValue({
      data: {
        users,
      },
    });

    render(<ManageUsers />);

    expect(
      await screen.findByText('Admin User')
    ).toBeInTheDocument();

    expect(
      screen.getByText('You')
    ).toBeInTheDocument();
  });

  it('disables role selection and delete action for the current user', async () => {
    api.get.mockResolvedValue({
      data: {
        users,
      },
    });

    render(<ManageUsers />);

    await screen.findByText('Admin User');

    const selects = screen.getAllByRole('combobox');

    expect(selects[0]).toBeDisabled();

    const deleteButtons = screen.getAllByRole('button', {
      name: 'Delete',
    });

    expect(deleteButtons).toHaveLength(2);
  });

  it('shows empty state when there are no users', async () => {
    api.get.mockResolvedValue({
      data: {
        users: [],
      },
    });

    render(<ManageUsers />);

    expect(
      await screen.findByText(
        'No users registered in the system yet.'
      )
    ).toBeInTheDocument();
  });

  it('shows fetch error when loading users fails', async () => {
    api.get.mockRejectedValue({
      response: {
        data: {
          message: 'Unable to fetch users',
        },
      },
    });

    render(<ManageUsers />);

    expect(
      await screen.findByText('Unable to fetch users')
    ).toBeInTheDocument();
  });

  it('changes a users role after confirmation', async () => {
    const user = userEvent.setup();

    vi.spyOn(window, 'confirm').mockReturnValue(true);

    api.get.mockResolvedValue({
      data: {
        users,
      },
    });

    api.patch.mockResolvedValue({
      data: {
        user: {
          ...users[1],
          role: 'manager',
        },
      },
    });

    render(<ManageUsers />);

    await screen.findByText('John Doe');

    const selects = screen.getAllByRole('combobox');

    await user.selectOptions(selects[1], 'manager');

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith(
        '/admin/users/user-1/role',
        {
          role: 'manager',
        }
      );
    });

    expect(
      screen.getAllByRole('combobox')[1]
    ).toHaveValue('manager');

    window.confirm.mockRestore();
  });

  it('does not change role when confirmation is cancelled', async () => {
    const user = userEvent.setup();

    vi.spyOn(window, 'confirm').mockReturnValue(false);

    api.get.mockResolvedValue({
      data: {
        users,
      },
    });

    render(<ManageUsers />);

    await screen.findByText('John Doe');

    const selects = screen.getAllByRole('combobox');

    await user.selectOptions(selects[1], 'admin');

    expect(api.patch).not.toHaveBeenCalled();

    window.confirm.mockRestore();
  });

  it('does not allow the current user role to be changed', async () => {
    const user = userEvent.setup();

    api.get.mockResolvedValue({
      data: {
        users,
      },
    });

    render(<ManageUsers />);

    await screen.findByText('Admin User');

    const selects = screen.getAllByRole('combobox');

    expect(selects[0]).toBeDisabled();

    await user.selectOptions(selects[0], 'manager');

    expect(api.patch).not.toHaveBeenCalled();
  });

  it('shows an alert when role update fails', async () => {
    const user = userEvent.setup();

    vi.spyOn(window, 'confirm').mockReturnValue(true);

    const alertSpy = vi
      .spyOn(window, 'alert')
      .mockImplementation(() => {});

    api.get.mockResolvedValue({
      data: {
        users,
      },
    });

    api.patch.mockRejectedValue({
      response: {
        data: {
          message: 'Role update failed',
        },
      },
    });

    render(<ManageUsers />);

    await screen.findByText('John Doe');

    await user.selectOptions(
      screen.getAllByRole('combobox')[1],
      'admin'
    );

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        'Role update failed'
      );
    });

    window.confirm.mockRestore();
    alertSpy.mockRestore();
  });

  it('deletes a user after confirmation', async () => {
    const user = userEvent.setup();

    vi.spyOn(window, 'confirm').mockReturnValue(true);

    api.get.mockResolvedValue({
      data: {
        users,
      },
    });

    api.delete.mockResolvedValue({
      data: {
        success: true,
      },
    });

    render(<ManageUsers />);

    await screen.findByText('John Doe');

    const deleteButtons = screen.getAllByRole('button', {
      name: 'Delete',
    });

    await user.click(deleteButtons[0]);

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith(
        '/admin/users/user-1'
      );
    });

    expect(
      screen.queryByText('John Doe')
    ).not.toBeInTheDocument();

    window.confirm.mockRestore();
  });

  it('does not delete a user when confirmation is cancelled', async () => {
    const user = userEvent.setup();

    vi.spyOn(window, 'confirm').mockReturnValue(false);

    api.get.mockResolvedValue({
      data: {
        users,
      },
    });

    render(<ManageUsers />);

    await screen.findByText('John Doe');

    const deleteButtons = screen.getAllByRole('button', {
      name: 'Delete',
    });

    await user.click(deleteButtons[0]);

    expect(api.delete).not.toHaveBeenCalled();

    expect(
      screen.getByText('John Doe')
    ).toBeInTheDocument();

    window.confirm.mockRestore();
  });

  it('shows an alert when deleting a user fails', async () => {
    const user = userEvent.setup();

    vi.spyOn(window, 'confirm').mockReturnValue(true);

    const alertSpy = vi
      .spyOn(window, 'alert')
      .mockImplementation(() => {});

    api.get.mockResolvedValue({
      data: {
        users,
      },
    });

    api.delete.mockRejectedValue({
      response: {
        data: {
          message: 'Delete user failed',
        },
      },
    });

    render(<ManageUsers />);

    await screen.findByText('John Doe');

    const deleteButtons = screen.getAllByRole('button', {
      name: 'Delete',
    });

    await user.click(deleteButtons[0]);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        'Delete user failed'
      );
    });

    window.confirm.mockRestore();
    alertSpy.mockRestore();
  });
});

describe('ManageWorkspaces', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  const workspaces = [
    {
      id: 'workspace-1',
      name: 'Engineering',
      owner: {
        name: 'John Doe',
        email: 'john@example.com',
      },
      memberCount: 5,
      taskCount: 12,
      createdAt: '2026-01-15T00:00:00.000Z',
    },
    {
      id: 'workspace-2',
      name: 'Marketing',
      owner: {
        name: 'Jane Doe',
        email: 'jane@example.com',
      },
      memberCount: 3,
      taskCount: 7,
      createdAt: '2026-02-20T00:00:00.000Z',
    },
  ];

  it('shows loading state while workspaces are loading', () => {
    api.get.mockReturnValue(new Promise(() => {}));

    render(<ManageWorkspaces />);

    expect(
      screen.getByText('Loading workspaces database...')
    ).toBeInTheDocument();
  });

  it('loads and displays workspaces', async () => {
    api.get.mockResolvedValue({
      data: {
        workspaces,
      },
    });

    render(<ManageWorkspaces />);

    expect(
      await screen.findByText('Engineering')
    ).toBeInTheDocument();

    expect(
      screen.getByText('Marketing')
    ).toBeInTheDocument();

    expect(
      screen.getByText('john@example.com')
    ).toBeInTheDocument();

    expect(api.get).toHaveBeenCalledWith(
      '/admin/workspaces'
    );
  });

  it('displays member and task counts', async () => {
    api.get.mockResolvedValue({
      data: {
        workspaces,
      },
    });

    render(<ManageWorkspaces />);

    await screen.findByText('Engineering');

    expect(
      screen.getByText('👥 5')
    ).toBeInTheDocument();

    expect(
      screen.getByText('📋 12')
    ).toBeInTheDocument();
  });

  it('shows empty state when there are no workspaces', async () => {
    api.get.mockResolvedValue({
      data: {
        workspaces: [],
      },
    });

    render(<ManageWorkspaces />);

    expect(
      await screen.findByText(
        'No workspaces currently exist in the system.'
      )
    ).toBeInTheDocument();
  });

  it('shows fetch error when loading workspaces fails', async () => {
    api.get.mockRejectedValue({
      response: {
        data: {
          message: 'Unable to fetch workspaces',
        },
      },
    });

    render(<ManageWorkspaces />);

    expect(
      await screen.findByText('Unable to fetch workspaces')
    ).toBeInTheDocument();
  });

  it('opens workspace details modal', async () => {
    const user = userEvent.setup();

    api.get.mockImplementation((url) => {
      if (url === '/admin/workspaces') {
        return Promise.resolve({
          data: {
            workspaces,
          },
        });
      }

      if (url === '/admin/workspaces/workspace-1') {
        return Promise.resolve({
          data: {
            workspace: {
              ...workspaces[0],
              description: 'Engineering workspace',
              owner: {
                name: 'John Doe',
                email: 'john@example.com',
              },
              members: [
                {
                  id: 'user-1',
                  name: 'Alice',
                  email: 'alice@example.com',
                  role: 'member',
                },
              ],
              tasks: [
                {
                  id: 'task-1',
                  title: 'Build API',
                  description: 'Build backend API',
                  status: 'In Progress',
                  priority: 'High',
                  assignedTo: {
                    name: 'Alice',
                  },
                },
              ],
            },
          },
        });
      }

      return Promise.reject(
        new Error(`Unexpected GET: ${url}`)
      );
    });

    render(<ManageWorkspaces />);

    await screen.findByText('Engineering');

    const viewButtons = screen.getAllByRole('button', {
      name: 'View',
    });

    await user.click(viewButtons[0]);

    expect(
      await screen.findByRole('heading', {
        name: 'Workspace: Engineering',
      })
    ).toBeInTheDocument();

    expect(
      screen.getByText('Engineering workspace')
    ).toBeInTheDocument();

    expect(
      screen.getAllByText('Alice')
    ).toHaveLength(2);

    expect(
      screen.getByText('Build API')
    ).toBeInTheDocument();

    expect(api.get).toHaveBeenCalledWith(
      '/admin/workspaces/workspace-1'
    );
  });

  it('shows alert when workspace details fail to load', async () => {
    const user = userEvent.setup();

    const alertSpy = vi
      .spyOn(window, 'alert')
      .mockImplementation(() => {});

    api.get.mockImplementation((url) => {
      if (url === '/admin/workspaces') {
        return Promise.resolve({
          data: {
            workspaces,
          },
        });
      }

      if (url === '/admin/workspaces/workspace-1') {
        return Promise.reject({
          response: {
            data: {
              message: 'Workspace details failed',
            },
          },
        });
      }

      return Promise.reject(
        new Error(`Unexpected GET: ${url}`)
      );
    });

    render(<ManageWorkspaces />);

    await screen.findByText('Engineering');

    await user.click(
      screen.getAllByRole('button', {
        name: 'View',
      })[0]
    );

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        'Workspace details failed'
      );
    });

    expect(
      screen.queryByRole('dialog')
    ).not.toBeInTheDocument();

    alertSpy.mockRestore();
  });

  it('deletes a workspace after confirmation', async () => {
    const user = userEvent.setup();

    vi.spyOn(window, 'confirm').mockReturnValue(true);

    api.get.mockResolvedValue({
      data: {
        workspaces,
      },
    });

    api.delete.mockResolvedValue({
      data: {
        success: true,
      },
    });

    render(<ManageWorkspaces />);

    await screen.findByText('Engineering');

    await user.click(
      screen.getAllByRole('button', {
        name: 'Delete',
      })[0]
    );

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith(
        '/workspace/workspace-1'
      );
    });

    expect(
      screen.queryByText('Engineering')
    ).not.toBeInTheDocument();

    window.confirm.mockRestore();
  });

  it('does not delete a workspace when confirmation is cancelled', async () => {
    const user = userEvent.setup();

    vi.spyOn(window, 'confirm').mockReturnValue(false);

    api.get.mockResolvedValue({
      data: {
        workspaces,
      },
    });

    render(<ManageWorkspaces />);

    await screen.findByText('Engineering');

    await user.click(
      screen.getAllByRole('button', {
        name: 'Delete',
      })[0]
    );

    expect(api.delete).not.toHaveBeenCalled();

    expect(
      screen.getAllByText('Engineering')
    ).toHaveLength(1);

    window.confirm.mockRestore();
  });

  it('shows an alert when deleting a workspace fails', async () => {
    const user = userEvent.setup();

    vi.spyOn(window, 'confirm').mockReturnValue(true);

    const alertSpy = vi
      .spyOn(window, 'alert')
      .mockImplementation(() => {});

    api.get.mockResolvedValue({
      data: {
        workspaces,
      },
    });

    api.delete.mockRejectedValue({
      response: {
        data: {
          message: 'Delete workspace failed',
        },
      },
    });

    render(<ManageWorkspaces />);

    await screen.findByText('Engineering');

    await user.click(
      screen.getAllByRole('button', {
        name: 'Delete',
      })[0]
    );

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        'Delete workspace failed'
      );
    });

    window.confirm.mockRestore();
    alertSpy.mockRestore();
  });
});

describe('ManageTasks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const tasks = [
    {
      id: 'task-1',
      title: 'Build API',
      description: 'Build backend API',
      workspace: {
        id: 'workspace-1',
        name: 'Engineering',
      },
      assignedTo: {
        name: 'John Doe',
      },
      priority: 'High',
      status: 'In Progress',
      deadline: '2026-09-30T00:00:00.000Z',
    },
    {
      id: 'task-2',
      title: 'Design Landing Page',
      description: 'Create landing page',
      workspace: {
        id: 'workspace-2',
        name: 'Marketing',
      },
      assignedTo: null,
      priority: 'Medium',
      status: 'Completed',
      deadline: null,
    },
    {
      id: 'task-3',
      title: 'Fix Login Bug',
      description: 'Fix authentication bug',
      workspace: {
        id: 'workspace-1',
        name: 'Engineering',
      },
      assignedTo: {
        name: 'Jane Doe',
      },
      priority: 'Low',
      status: 'Todo',
      deadline: '2026-10-05T00:00:00.000Z',
    },
  ];

  it('shows loading state while tasks are loading', () => {
    api.get.mockReturnValue(new Promise(() => {}));

    render(<ManageTasks />);

    expect(
      screen.getByText('Loading system tasks...')
    ).toBeInTheDocument();
  });

  it('loads and displays tasks', async () => {
    api.get.mockResolvedValue({
      data: {
        tasks,
      },
    });

    render(<ManageTasks />);

    expect(
      await screen.findByText('Build API')
    ).toBeInTheDocument();

    expect(
      screen.getByText('Design Landing Page')
    ).toBeInTheDocument();

    expect(
      screen.getByText('Fix Login Bug')
    ).toBeInTheDocument();

    expect(api.get).toHaveBeenCalledWith('/admin/tasks');
  });

  it('displays task workspace and assignee information', async () => {
    api.get.mockResolvedValue({
      data: {
        tasks,
      },
    });

    render(<ManageTasks />);

    await screen.findByText('Build API');

    expect(
      screen.getAllByText('Engineering')
    ).toHaveLength(3);

    expect(
      screen.getByText('John Doe')
    ).toBeInTheDocument();

    expect(
      screen.getByText('Unassigned')
    ).toBeInTheDocument();
  });

  it('shows empty filter state when there are no tasks', async () => {
    api.get.mockResolvedValue({
      data: {
        tasks: [],
      },
    });

    render(<ManageTasks />);

    expect(
      await screen.findByText(
        'No tasks match the active filter criteria.'
      )
    ).toBeInTheDocument();
  });

  it('shows fetch error when loading tasks fails', async () => {
    api.get.mockRejectedValue({
      response: {
        data: {
          message: 'Unable to fetch tasks',
        },
      },
    });

    render(<ManageTasks />);

    expect(
      await screen.findByText('Unable to fetch tasks')
    ).toBeInTheDocument();
  });

  it('filters tasks by search term', async () => {
    const user = userEvent.setup();

    api.get.mockResolvedValue({
      data: {
        tasks,
      },
    });

    render(<ManageTasks />);

    await screen.findByText('Build API');

    const searchInput = screen.getByPlaceholderText(
      'Search by title or description...'
    );

    await user.type(searchInput, 'login');

    expect(
      screen.getByText('Fix Login Bug')
    ).toBeInTheDocument();

    expect(
      screen.queryByText('Build API')
    ).not.toBeInTheDocument();

    expect(
      screen.queryByText('Design Landing Page')
    ).not.toBeInTheDocument();
  });

  it('filters tasks by status', async () => {
    const user = userEvent.setup();

    api.get.mockResolvedValue({
      data: {
        tasks,
      },
    });

    render(<ManageTasks />);

    await screen.findByText('Build API');

    const selects = screen.getAllByRole('combobox');

    await user.selectOptions(
      selects[1],
      'Completed'
    );

    expect(
      screen.getByText('Design Landing Page')
    ).toBeInTheDocument();

    expect(
      screen.queryByText('Build API')
    ).not.toBeInTheDocument();

    expect(
      screen.queryByText('Fix Login Bug')
    ).not.toBeInTheDocument();
  });

  it('filters tasks by priority', async () => {
    const user = userEvent.setup();

    api.get.mockResolvedValue({
      data: {
        tasks,
      },
    });

    render(<ManageTasks />);

    await screen.findByText('Build API');

    const selects = screen.getAllByRole('combobox');

    await user.selectOptions(
      selects[2],
      'High'
    );

    expect(
      screen.getByText('Build API')
    ).toBeInTheDocument();

    expect(
      screen.queryByText('Design Landing Page')
    ).not.toBeInTheDocument();

    expect(
      screen.queryByText('Fix Login Bug')
    ).not.toBeInTheDocument();
  });

  it('filters tasks by workspace', async () => {
    const user = userEvent.setup();

    api.get.mockResolvedValue({
      data: {
        tasks,
      },
    });

    render(<ManageTasks />);

    await screen.findByText('Build API');

    const selects = screen.getAllByRole('combobox');

    await user.selectOptions(
      selects[0],
      'workspace-1'
    );

    expect(
      screen.getByText('Build API')
    ).toBeInTheDocument();

    expect(
      screen.getByText('Fix Login Bug')
    ).toBeInTheDocument();

    expect(
      screen.queryByText('Design Landing Page')
    ).not.toBeInTheDocument();
  });

  it('opens task details modal', async () => {
    const user = userEvent.setup();

    api.get.mockImplementation((url) => {
      if (url === '/admin/tasks') {
        return Promise.resolve({
          data: {
            tasks,
          },
        });
      }

      if (url === '/admin/tasks/task-1') {
        return Promise.resolve({
          data: {
            task: {
              ...tasks[0],
              createdBy: {
                name: 'Admin User',
                email: 'admin@example.com',
              },
              assignedTo: {
                name: 'John Doe',
                email: 'john@example.com',
              },
              createdAt: '2026-09-01T10:00:00.000Z',
              updatedAt: '2026-09-15T10:00:00.000Z',
            },
          },
        });
      }

      return Promise.reject(
        new Error(`Unexpected GET: ${url}`)
      );
    });

    render(<ManageTasks />);

    await screen.findByText('Build API');

    await user.click(
      screen.getAllByRole('button', {
        name: 'View',
      })[0]
    );

    expect(
      await screen.findByRole('heading', {
        name: 'Task Details',
      })
    ).toBeInTheDocument();

    expect(
      screen.getByText('Build backend API')
    ).toBeInTheDocument();

    expect(
      screen.getByText('Admin User')
    ).toBeInTheDocument();

    expect(
      screen.getByText('john@example.com')
    ).toBeInTheDocument();

    expect(api.get).toHaveBeenCalledWith(
      '/admin/tasks/task-1'
    );
  });

  it('shows alert when task details fail to load', async () => {
    const user = userEvent.setup();

    const alertSpy = vi
      .spyOn(window, 'alert')
      .mockImplementation(() => {});

    api.get.mockImplementation((url) => {
      if (url === '/admin/tasks') {
        return Promise.resolve({
          data: {
            tasks,
          },
        });
      }

      if (url === '/admin/tasks/task-1') {
        return Promise.reject({
          response: {
            data: {
              message: 'Task details failed',
            },
          },
        });
      }

      return Promise.reject(
        new Error(`Unexpected GET: ${url}`)
      );
    });

    render(<ManageTasks />);

    await screen.findByText('Build API');

    await user.click(
      screen.getAllByRole('button', {
        name: 'View',
      })[0]
    );

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        'Task details failed'
      );
    });

    expect(
      screen.queryByRole('dialog')
    ).not.toBeInTheDocument();

    alertSpy.mockRestore();
  });

  it('deletes a task after confirmation', async () => {
    const user = userEvent.setup();

    vi.spyOn(window, 'confirm').mockReturnValue(true);

    api.get.mockResolvedValue({
      data: {
        tasks,
      },
    });

    api.delete.mockResolvedValue({
      data: {
        success: true,
      },
    });

    render(<ManageTasks />);

    await screen.findByText('Build API');

    await user.click(
      screen.getAllByRole('button', {
        name: 'Delete',
      })[0]
    );

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith(
        '/task/task-1'
      );
    });

    expect(
      screen.queryByText('Build API')
    ).not.toBeInTheDocument();

    window.confirm.mockRestore();
  });

  it('does not delete a task when confirmation is cancelled', async () => {
    const user = userEvent.setup();

    vi.spyOn(window, 'confirm').mockReturnValue(false);

    api.get.mockResolvedValue({
      data: {
        tasks,
      },
    });

    render(<ManageTasks />);

    await screen.findByText('Build API');

    await user.click(
      screen.getAllByRole('button', {
        name: 'Delete',
      })[0]
    );

    expect(api.delete).not.toHaveBeenCalled();

    expect(
      screen.getByText('Build API')
    ).toBeInTheDocument();

    window.confirm.mockRestore();
  });

  it('shows alert when deleting a task fails', async () => {
    const user = userEvent.setup();

    vi.spyOn(window, 'confirm').mockReturnValue(true);

    const alertSpy = vi
      .spyOn(window, 'alert')
      .mockImplementation(() => {});

    api.get.mockResolvedValue({
      data: {
        tasks,
      },
    });

    api.delete.mockRejectedValue({
      response: {
        data: {
          message: 'Delete task failed',
        },
      },
    });

    render(<ManageTasks />);

    await screen.findByText('Build API');

    await user.click(
      screen.getAllByRole('button', {
        name: 'Delete',
      })[0]
    );

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        'Delete task failed'
      );
    });

    window.confirm.mockRestore();
    alertSpy.mockRestore();
  });
});