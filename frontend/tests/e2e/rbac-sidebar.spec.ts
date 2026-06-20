import { test, expect } from '@playwright/test';

async function mockAuthenticatedUser(
  page: import('@playwright/test').Page,
  role: 'ADMIN' | 'MEDICO',
  permissions: string[]
) {
  await page.addInitScript(() => {
    window.localStorage.setItem('access_token', 'e2e.fake.access.token');
  });

  await page.route('**/api/auth/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 1,
        username: role === 'ADMIN' ? 'admin' : 'dr.carlos',
        email: role === 'ADMIN' ? 'admin@oftalmologia.local' : 'carlos.medico@oftalmologia.local',
        nombres: role === 'ADMIN' ? 'Administrador' : 'Carlos',
        apellidos: role === 'ADMIN' ? 'Sistema' : 'Mendoza',
        nombre_completo: role === 'ADMIN' ? 'Administrador Sistema' : 'Carlos Mendoza',
        tipo_usuario: role,
        estado: 'ACTIVO',
      }),
    });
  });

  await page.route('**/api/auth/permissions', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ permissions }),
    });
  });
}

test('sidebar shows IAM items for admin role', async ({ page }) => {
  await mockAuthenticatedUser(page, 'ADMIN', [
    'dashboard.ver',
    'users.ver',
    'roles.listar',
    'permisos.listar',
  ]);

  await page.goto('/dashboard/inicio');
  const sidebarNav = page.locator('nav[aria-label="Menú principal"]');
  await expect(sidebarNav.getByRole('link', { name: 'Usuarios', exact: true })).toBeVisible();
  await expect(sidebarNav.getByRole('link', { name: 'Roles', exact: true })).toBeVisible();
  await expect(sidebarNav.getByRole('link', { name: 'Permisos', exact: true })).toBeVisible();
});

test('sidebar hides IAM items for medico role', async ({ page }) => {
  await mockAuthenticatedUser(page, 'MEDICO', [
    'dashboard.ver',
    'agenda.ver',
    'consultas.listar',
  ]);

  await page.goto('/dashboard/inicio');
  const sidebarNav = page.locator('nav[aria-label="Menú principal"]');
  await expect(sidebarNav.getByRole('link', { name: 'Usuarios', exact: true })).toHaveCount(0);
  await expect(sidebarNav.getByRole('link', { name: 'Roles', exact: true })).toHaveCount(0);
  await expect(sidebarNav.getByRole('link', { name: 'Permisos', exact: true })).toHaveCount(0);
  await expect(sidebarNav.getByRole('link', { name: 'Agenda médica', exact: true })).toBeVisible();
});
