import { expect, test } from "@playwright/test";

test("dashboard and workout logger render", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "Dashboard", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Today’s workout", exact: true })).toBeVisible();

  await page.goto("/workout/today");
  await expect(page.getByRole("heading", { name: "Workout", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /Incline DB Press Chest/ })).toBeVisible();
});
