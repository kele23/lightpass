import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Lightpass Full Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Go to the home page
    await page.goto('/');
  });

  test('should complete a full race lifecycle', async ({ page }) => {
    // 1. Login
    const username = process.env.VITE_TEST_USERNAME!;
    const password = process.env.VITE_TEST_PASSWORD!;

    await page.goto('/login');
    await page.getByTestId('login-username').fill(username);
    await page.getByTestId('login-password').fill(password);
    await page.getByTestId('login-submit').click();

    // Wait for redirect to /entry
    await expect(page).toHaveURL(/\/entry/);
    await expect(page.getByTestId('select-race-title')).toBeVisible();

    // 2. Create a new Race
    const raceName = `Test Race ${Date.now()}`;
    await page.getByTestId('new-race-name').fill(raceName);
    await page.getByTestId('new-race-submit').click();

    // Wait for redirect to /race
    await expect(page).toHaveURL(/\/race/);
    await expect(page.getByTestId('race-title')).toBeVisible();

    // 3. Create PS (Gare) manually
    await page.getByTestId('new-ps-name').fill('PS Manual');
    await page.getByTestId('new-ps-start').fill('2026-05-01T10:00');
    await page.getByTestId('new-ps-gap').fill('30');
    await page.getByTestId('new-ps-order').selectOption('asc');
    await page.getByTestId('new-ps-submit').click();

    // Verify PS created in table
    await expect(page.getByTestId('pss-table')).toContainText('PS Manual');

    // 4. Upload PS via CSV
    const pssCsvPath = path.resolve(__dirname, 'data/pss.csv');
    await page.getByTestId('upload-race-file').setInputFiles(pssCsvPath);
    await page.getByTestId('upload-race-submit').click();

    // Verify CSV PS created
    await expect(page.getByTestId('pss-table')).toContainText('PS1');
    await expect(page.getByTestId('pss-table')).toContainText('PS2');

    // 5. Navigate to Runners
    await page.getByTestId('nav-runners').click();
    await expect(page).toHaveURL(/\/runners/);
    await expect(page.getByTestId('runners-title')).toBeVisible();

    // 6. Create Runner manually
    await page.getByTestId('new-runner-name').fill('Runner Test');
    await page.getByTestId('new-runner-number').fill('999');
    await page.getByTestId('new-runner-category').fill('Elite');
    await page.getByTestId('new-runner-team').fill('Test Team');
    await page.getByTestId('new-runner-fci').fill('FCI999');
    await page.getByTestId('new-runner-uci').fill('UCI999');
    await page.getByTestId('new-runner-soc').fill('Test Soc');
    await page.getByTestId('new-runner-naz').fill('ITA');
    await page.getByTestId('new-runner-submit').click();

    await expect(page.getByTestId('runners-table')).toContainText('Runner Test');

    // 7. Upload Runners via CSV
    const runnersCsvPath = path.resolve(__dirname, 'data/runners.csv');
    await page.getByTestId('upload-runners-file').setInputFiles(runnersCsvPath);
    await page.getByTestId('upload-runners-submit').click();

    await expect(page.getByTestId('runners-table')).toContainText('Mario Rossi');
    await expect(page.getByTestId('runners-table')).toContainText('Luigi Bianchi');

    // 8. Go to Dashboard (Start)
    await page.getByTestId('nav-start').click();
    await expect(page).toHaveURL(/\/start/);
    await expect(page.getByTestId('dashboard-title')).toBeVisible();

    // Select PS
    await page.getByTestId('select-ps-input').selectOption({ label: 'PS1' });

    // 9. Simulate Time Arrival (Passaggio)
    await page.keyboard.press('Alt++');

    // Wait for the time to appear in the "Passages" table
    await expect(page.getByTestId('passages-table').locator('tbody tr')).toBeVisible();

    // 10. Assign Time to Runner
    await page.getByTestId('passages-table').getByTestId('table-row').first().getByTestId('edit-button').click();

    // Fill runner number
    await page.getByTestId('assign-runner-input').fill('101');
    await page.getByTestId('assign-submit').click();

    // Verify take created
    await expect(page.getByTestId('takes-table')).toContainText('101');

    // 11. Add another time and assign to another runner
    await page.keyboard.press('Alt++');
    await expect(page.getByTestId('passages-table').getByTestId('table-row').first()).toBeVisible();
    await page.getByTestId('passages-table').getByTestId('table-row').first().getByTestId('edit-button').click();
    await page.getByTestId('assign-runner-input').fill('102');
    await page.getByTestId('assign-submit').click();

    // 12. Add a retired runner
    await page.getByTestId('retired-runner-input').fill('103');
    await page.getByTestId('retired-runner-submit').click();

    // Verify retired in retired section
    await page.getByTestId('nav-retired').click();
    await expect(page).toHaveURL(/\/retired/);
    await expect(page.getByTestId('retired-takes-table')).toContainText('103');

    // Go back to Dashboard to continue the flow
    await page.getByTestId('nav-start').click();
    await expect(page).toHaveURL(/\/start/);
    // Re-select PS to see takes
    await page.getByTestId('select-ps-input').first().selectOption({ label: 'PS1' });

    // 13. Edit Penalty
    await page
      .getByTestId('takes-table')
      .getByTestId('table-row')
      .filter({ hasText: '101' })
      .getByTestId('edit-button')
      .click();
    await page.getByTestId('penalty-input').fill('5.5');
    await page.locator('dialog').filter({ hasText: 'Edit Penalty' }).getByTestId('modal-ok-button').click();

    // 14. Check Results
    await page.getByTestId('nav-results').click();
    await expect(page).toHaveURL(/\/results/);
    await expect(page.getByTestId('global-score-title')).toBeVisible();
    await expect(page.getByTestId('global-score-table')).toContainText('Mario Rossi');

    // 15. Live Results
    await page.getByTestId('live-view-button').click();
    await expect(page.getByTestId('live-results-title')).toBeVisible();

    // 16. Delete Race
    await page.getByTestId('back-button').click(); // Go back from Live Results to Results page
    await expect(page).toHaveURL(/\/results/);
    await page.getByTestId('delete-race-button').click();
    await page.getByTestId('modal-ok-button').click();

    // Wait for redirect to /entry and check that the race is gone (or at least we are back at selection)
    await expect(page).toHaveURL(/\/entry/);
    await expect(page.getByTestId('select-race-title')).toBeVisible();
  });
});
