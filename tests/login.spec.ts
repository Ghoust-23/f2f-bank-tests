import { test, expect } from "@playwright/test";

test.describe("Login", () => {
  const user = {
    email: "usertest@example.com",
    password: "Password123!",
  };

  test("успешная авторизация пользователя", async ({ page }) => {
    await page.goto("http://localhost/login");

    await page.getByPlaceholder("Type your email").fill(user.email);
    await page.getByPlaceholder("Type your password").fill(user.password);

    await page.getByRole("button", { name: "Login" }).click();

    await expect(page).toHaveURL("http://localhost/");
  });

  test("авторизация с пустыми обязательными полями", async ({ page }) => {
    await page.goto("http://localhost/login");

    const emailInput = page.getByPlaceholder("Type your email");
    const passwordInput = page.getByPlaceholder("Type your password");

    await page.getByRole("button", { name: "Login" }).click();

    const isEmailValid = await emailInput.evaluate(
      (input: HTMLInputElement) => input.validity.valid,
    );

    const isPasswordValid = await passwordInput.evaluate(
      (input: HTMLInputElement) => input.validity.valid,
    );

    expect(isEmailValid).toBe(false);
    expect(isPasswordValid).toBe(false);

    const validationMessage = await emailInput.evaluate(
      (input: HTMLInputElement) => input.validationMessage,
    );

    expect(validationMessage).not.toBe("");

    await expect(page).toHaveURL(/\/login\/?$/);
  });

  test("авторизация с неверным паролем", async ({ page }) => {
    await page.goto("http://localhost/login");

    await page.getByPlaceholder("Type your email").fill(user.email);

    await page.getByPlaceholder("Type your password").fill("WrongPassword123!");

    await page.getByRole("button", { name: "Login" }).click();

    await expect(page.getByText("Login failed", { exact: true })).toBeVisible();

    await expect(page).toHaveURL(/\/login\/?$/);
  });

  test("авторизация с незарегистрированным Email", async ({ page }) => {
    const unregisteredEmail = `notregistered-${Date.now()}@example.com`;

    await page.goto("http://localhost/login");

    await page.getByPlaceholder("Type your email").fill(unregisteredEmail);

    await page.getByPlaceholder("Type your password").fill("Password123!");

    await page.getByRole("button", { name: "Login" }).click();

    await expect(page.getByText("Login failed", { exact: true })).toBeVisible();

    await expect(page).toHaveURL(/\/login\/?$/);
  });

  test("авторизация с невалидным Email", async ({ page }) => {
    await page.goto("http://localhost/login");

    const emailInput = page.getByPlaceholder("Type your email");

    await emailInput.fill("test");

    await page.getByPlaceholder("Type your password").fill("Password123!");

    await page.getByRole("button", { name: "Login" }).click();

    const isEmailValid = await emailInput.evaluate(
      (input: HTMLInputElement) => input.validity.valid,
    );

    const validationMessage = await emailInput.evaluate(
      (input: HTMLInputElement) => input.validationMessage,
    );

    expect(isEmailValid).toBe(false);
    expect(validationMessage).not.toBe("");

    await expect(page).toHaveURL(/\/login\/?$/);
  });

  test("авторизация с пустым Password", async ({ page }) => {
    await page.goto("http://localhost/login");

    await page.getByPlaceholder("Type your email").fill(user.email);

    const passwordInput = page.getByPlaceholder("Type your password");

    await page.getByRole("button", { name: "Login" }).click();

    const isPasswordValid = await passwordInput.evaluate(
      (input: HTMLInputElement) => input.validity.valid,
    );

    const validationMessage = await passwordInput.evaluate(
      (input: HTMLInputElement) => input.validationMessage,
    );

    expect(isPasswordValid).toBe(false);
    expect(validationMessage).not.toBe("");

    await expect(page).toHaveURL(/\/login\/?$/);
  });

  test.afterEach(async ({ page }) => {
    const logoutButton = page.locator("button").filter({
      has: page.locator('svg path[d="M9.5 11.5L17.5 11.5"]'),
    });

    if (await logoutButton.isVisible()) {
      await logoutButton.click();

      await expect(page).toHaveURL(/\/login\/?$/);
    }
  });
});
