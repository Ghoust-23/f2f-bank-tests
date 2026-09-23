import { test, expect } from "@playwright/test";

test.describe("Registration", () => {
  test("успешная регистрация нового пользователя", async ({ page }) => {
    const uniqueEmail = `user-${Date.now()}@example.com`;

    await page.goto("http://localhost/login");

    await page.getByRole("link", { name: "Register page" }).click();

    await page.getByPlaceholder("Type your name", { exact: true }).fill("Ivan");

    await page
      .getByPlaceholder("Type your surname", { exact: true })
      .fill("Ivanov");

    await page
      .getByPlaceholder("Type your email", { exact: true })
      .fill(uniqueEmail);

    await page
      .getByPlaceholder("Type your message...", { exact: true })
      .fill("Password123!");

    await page.getByRole("button", { name: "Register" }).click();

    await expect(
      page.getByText("Registration successful! Please log in.", {
        exact: true,
      }),
    ).toBeVisible();

    await expect(page).toHaveURL(/\/login\/?$/);
  });

  test("регистрация с уже существующим Email", async ({ page }) => {
    const existingEmail = "usertest@example.com";

    await page.goto("http://localhost/register");

    await page.getByPlaceholder("Type your name", { exact: true }).fill("Ivan");

    await page
      .getByPlaceholder("Type your surname", { exact: true })
      .fill("Ivanov");

    await page
      .getByPlaceholder("Type your email", { exact: true })
      .fill(existingEmail);

    await page
      .getByPlaceholder("Type your message...", { exact: true })
      .fill("Password123!");

    await page.getByRole("button", { name: "Register" }).click();

    await expect(
      page.getByText("User with this email already exists", {
        exact: true,
      }),
    ).toBeVisible();

    await expect(page).toHaveURL(/\/register\/?$/);
  });

  test("регистрация с невалидным Email", async ({ page }) => {
    await page.goto("http://localhost/register");

    await page.getByPlaceholder("Type your name", { exact: true }).fill("Ivan");

    await page
      .getByPlaceholder("Type your surname", { exact: true })
      .fill("Ivanov");

    const emailInput = page.getByPlaceholder("Type your email", {
      exact: true,
    });

    await emailInput.fill("test");

    await page
      .getByPlaceholder("Type your message...", { exact: true })
      .fill("Password123!");

    await page.getByRole("button", { name: "Register" }).click();

    const isEmailValid = await emailInput.evaluate(
      (input: HTMLInputElement) => input.validity.valid,
    );

    const validationMessage = await emailInput.evaluate(
      (input: HTMLInputElement) => input.validationMessage,
    );

    expect(isEmailValid).toBe(false);
    expect(validationMessage).not.toBe("");

    await expect(page).toHaveURL(/\/register\/?$/);
  });

  test("регистрация с пустыми обязательными полями", async ({ page }) => {
    await page.goto("http://localhost/register");

    const nameInput = page.getByPlaceholder("Type your name", {
      exact: true,
    });

    const surnameInput = page.getByPlaceholder("Type your surname", {
      exact: true,
    });

    const emailInput = page.getByPlaceholder("Type your email", {
      exact: true,
    });

    const passwordInput = page.getByPlaceholder("Type your message...", {
      exact: true,
    });

    await page.getByRole("button", { name: "Register" }).click();

    const isNameValid = await nameInput.evaluate(
      (input: HTMLInputElement) => input.validity.valid,
    );

    const isSurnameValid = await surnameInput.evaluate(
      (input: HTMLInputElement) => input.validity.valid,
    );

    const isEmailValid = await emailInput.evaluate(
      (input: HTMLInputElement) => input.validity.valid,
    );

    const isPasswordValid = await passwordInput.evaluate(
      (input: HTMLInputElement) => input.validity.valid,
    );

    expect(isNameValid).toBe(false);
    expect(isSurnameValid).toBe(false);
    expect(isEmailValid).toBe(false);
    expect(isPasswordValid).toBe(false);

    const validationMessage = await nameInput.evaluate(
      (input: HTMLInputElement) => input.validationMessage,
    );

    expect(validationMessage).not.toBe("");

    await expect(page).toHaveURL(/\/register\/?$/);
  });
});
