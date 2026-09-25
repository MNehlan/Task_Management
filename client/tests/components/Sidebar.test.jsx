import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Sidebar from '../../src/components/Sidebar';

describe('Sidebar', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const renderSidebar = (initialPath = '/dashboard') => {
    return render(
      <MemoryRouter initialEntries={[initialPath]}>
        <Sidebar />
      </MemoryRouter>,
    );
  };

  it('should render the main navigation links', () => {
    renderSidebar();

    expect(screen.getByText('Navigation')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Dashboard/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Workspaces/ })).toBeInTheDocument();
  });

  it('should link Dashboard to the dashboard route', () => {
    renderSidebar();

    expect(
      screen.getByRole('link', { name: /Dashboard/ }),
    ).toHaveAttribute('href', '/dashboard');
  });

  it('should link Workspaces to the workspaces route', () => {
    renderSidebar();

    expect(
      screen.getByRole('link', { name: /Workspaces/ }),
    ).toHaveAttribute('href', '/workspaces');
  });

  it('should not show the admin panel for a non-admin user', () => {
    localStorage.setItem(
      'user',
      JSON.stringify({
        name: 'John Doe',
        role: 'member',
      }),
    );

    renderSidebar();

    expect(screen.queryByText('Admin Panel')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: /Manage Users/ }),
    ).not.toBeInTheDocument();
  });

  it('should show the admin panel for an admin user', () => {
    localStorage.setItem(
      'user',
      JSON.stringify({
        name: 'Admin User',
        role: 'admin',
      }),
    );

    renderSidebar();

    expect(screen.getByText('Admin Panel')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /System Overview/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Manage Users/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Manage Workspaces/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Manage Tasks/ }),
    ).toBeInTheDocument();
  });

  it('should link admin navigation to the correct routes', () => {
    localStorage.setItem(
      'user',
      JSON.stringify({
        name: 'Admin User',
        role: 'admin',
      }),
    );

    renderSidebar();

    expect(
      screen.getByRole('link', { name: /System Overview/ }),
    ).toHaveAttribute('href', '/admin/dashboard');

    expect(
      screen.getByRole('link', { name: /Manage Users/ }),
    ).toHaveAttribute('href', '/admin/users');

    expect(
      screen.getByRole('link', { name: /Manage Workspaces/ }),
    ).toHaveAttribute('href', '/admin/workspaces');

    expect(
      screen.getByRole('link', { name: /Manage Tasks/ }),
    ).toHaveAttribute('href', '/admin/tasks');
  });

  it('should render the dashboard link as active on the dashboard route', () => {
    renderSidebar('/dashboard');

    const dashboardLink = screen.getByRole('link', {
      name: /Dashboard/,
    });

    expect(dashboardLink.className).toContain('bg-violet-600/20');
  });

  it('should not render the dashboard link as active on another route', () => {
    renderSidebar('/workspaces');

    const dashboardLink = screen.getByRole('link', {
      name: /Dashboard/,
    });

    expect(dashboardLink.className).not.toContain('bg-violet-600/20');
  });

  it('should render the workspaces link as active on the workspaces route', () => {
    renderSidebar('/workspaces');

    const workspacesLink = screen.getByRole('link', {
      name: /Workspaces/,
    });

    expect(workspacesLink.className).toContain('bg-violet-600/20');
  });

  it('should render the active admin link correctly', () => {
    localStorage.setItem(
      'user',
      JSON.stringify({
        name: 'Admin User',
        role: 'admin',
      }),
    );

    renderSidebar('/admin/tasks');

    const tasksLink = screen.getByRole('link', {
      name: /Manage Tasks/,
    });

    expect(tasksLink.className).toContain('bg-violet-600/20');
  });
});