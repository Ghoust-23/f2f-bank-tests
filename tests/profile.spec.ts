import { test, expect } from "@playwright/test";

test.describe("Profile", () => {
  const user = {
    name: "Ivan",
    surname: "Ivanov",
    email: "usertest@example.com",
    password: "Password123!",
  };

  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost/login");

    await page.getByPlaceholder("Type your email").fill(user.email);
    await page.getByPlaceholder("Type your password").fill(user.password);
    await page.getByRole("button", { name: "Login" }).click();

    await expect(page).toHaveURL("http://localhost/");
  });

  test("отображение данных текущего пользователя в профиле", async ({
    page,
  }) => {
    await page.getByText("Profile", { exact: true }).click();

    await expect(
      page.getByText(`Name: ${user.name}`, { exact: true }),
    ).toBeVisible();

    await expect(
      page.getByText(`Surname: ${user.surname}`, { exact: true }),
    ).toBeVisible();

    await expect(
      page.getByText(`Email: ${user.email}`, { exact: true }),
    ).toBeVisible();
  });
});
