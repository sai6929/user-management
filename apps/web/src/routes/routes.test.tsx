import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderRoutes } from '@/test/renderWithProviders';
import { routes } from './routes';

describe('routes', () => {
  it('renders the placeholder home page', async () => {
    renderRoutes(routes, '/');
    expect(
      await screen.findByRole('heading', { name: 'User Management Application' }),
    ).toBeInTheDocument();
  });

  it('renders the not-found page for unknown paths', async () => {
    renderRoutes(routes, '/does-not-exist');
    expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
  });
});
