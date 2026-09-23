import { test, expect } from "@playwright/test";

test.describe("Transactions", () => {
  const user = {
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

  test("успешный перевод и отображение транзакции в истории", async ({
    page,
  }) => {
    const transaction = {
      phone: "+7 999 123-45-67",
      amount: "15",
      purpose: `Test payment ${Date.now()}`,
    };

    await page.getByText("Transactions", { exact: true }).click();

    await page.getByRole("button", { name: "Add balance" }).click();
    await page.getByPlaceholder("Enter sum").fill("100");
    await page.getByRole("button", { name: "Add", exact: true }).click();

    await page.goto("http://localhost/");

    await page.getByPlaceholder("+7 999 123-45-67").fill(transaction.phone);

    await page.getByPlaceholder("0.00").fill(transaction.amount);

    await page
      .getByPlaceholder("e.g. debt repayment")
      .fill(transaction.purpose);

    await page.getByRole("button", { name: "Send", exact: true }).click();

    await page.getByText("Transactions", { exact: true }).click();

    const firstRow = page.locator("tbody tr").first();

    await expect(firstRow).toBeVisible();

    await expect(firstRow.locator("td").nth(2)).toHaveText("completed");

    await expect(firstRow.locator("td").nth(3)).toHaveText("withdrawal");

    await expect(firstRow.locator("td").nth(4)).toHaveText(transaction.amount);
  });

  test("перевод с номером телефона менее 10 цифр", async ({ page }) => {
    const phoneInput = page.getByPlaceholder("+7 999 123-45-67");

    await phoneInput.fill("+123456789");
    await phoneInput.blur();

    await expect(
      page.getByText("Phone must contain 10–15 digits", {
        exact: true,
      }),
    ).toBeVisible();
  });

  test("перевод с номером телефона более 15 цифр", async ({ page }) => {
    const phoneInput = page.getByPlaceholder("+7 999 123-45-67");

    await phoneInput.fill("+1234567890123456");
    await phoneInput.blur();

    await expect(
      page.getByText("Phone must contain 10–15 digits", {
        exact: true,
      }),
    ).toBeVisible();
  });

  test('перевод с номером телефона без символа "+"', async ({ page }) => {
    const phoneInput = page.getByPlaceholder("+7 999 123-45-67");

    await phoneInput.fill("79991234567");
    await phoneInput.blur();

    await expect(
      page.getByText(
        "Must start with + and country code. Example: +7 999 123-45-67",
        {
          exact: true,
        },
      ),
    ).toBeVisible();
  });

  test("проверка допустимой длины номера телефона", async ({ page }) => {
    const phoneInput = page.getByPlaceholder("+7 999 123-45-67");

    await phoneInput.fill("+1234567890");

    await expect(
      page.getByText("Phone must contain 10–15 digits", {
        exact: true,
      }),
    ).not.toBeVisible();

    await phoneInput.fill("+123456789012345");

    await expect(
      page.getByText("Phone must contain 10–15 digits", {
        exact: true,
      }),
    ).not.toBeVisible();
  });

  test("перевод с нулевой суммой", async ({ page }) => {
    await page.getByPlaceholder("+7 999 123-45-67").fill("+79991234567");

    await page.getByPlaceholder("0.00").fill("0");

    await page.getByPlaceholder("e.g. debt repayment").fill("Test payment");

    await page.getByRole("button", { name: "Send", exact: true }).click();

    await expect(
      page.getByText("Amount must be greater than zero", {
        exact: true,
      }),
    ).toBeVisible();
  });

  test("перевод с отрицательной суммой", async ({ page }) => {
    await page.getByPlaceholder("+7 999 123-45-67").fill("+79991234567");

    await page.getByPlaceholder("0.00").fill("-1");

    await page.getByPlaceholder("e.g. debt repayment").fill("Test payment");

    await page.getByRole("button", { name: "Send", exact: true }).click();

    await expect(
      page.getByText("Amount must be greater than zero", {
        exact: true,
      }),
    ).toBeVisible();
  });

  test("перевод при недостаточном балансе", async ({ page }) => {
    const balanceText = await page.locator("h2.header__link").textContent();

    const balance = Number(balanceText?.replace("Balance:", "").trim());

    const amount = balance + 1;

    await page.getByPlaceholder("+7 999 123-45-67").fill("+79991234567");

    await page.getByPlaceholder("0.00").fill(amount.toString());

    await page.getByPlaceholder("e.g. debt repayment").fill("Test payment");

    await page.getByRole("button", { name: "Send", exact: true }).click();

    await expect(page.locator("h2.header__link")).toHaveText(
      `Balance: ${balance}`,
    );
  });

  test("перевод на сумму, равную текущему балансу", async ({ page }) => {
    await page.getByText("Transactions", { exact: true }).click();

    await page.getByRole("button", { name: "Add balance" }).click();
    await page.getByPlaceholder("Enter sum").fill("100");
    await page.getByRole("button", { name: "Add", exact: true }).click();

    await page.goto("http://localhost/");

    const balanceLocator = page.locator("h2.header__link");

    const balanceText = await balanceLocator.textContent();

    const balance = Number(balanceText?.replace("Balance:", "").trim());

    expect(balance).toBeGreaterThan(0);

    await page.getByPlaceholder("+7 999 123-45-67").fill("+79991234567");

    await page.getByPlaceholder("0.00").fill(balance.toString());

    await page.getByPlaceholder("e.g. debt repayment").fill("Test payment");

    await page.getByRole("button", { name: "Send", exact: true }).click();

    await expect(balanceLocator).toHaveText(/Balance:\s*0(?:\.00)?/);
  });

  test("успешное пополнение баланса на 100", async ({ page }) => {
    const balanceLocator = page.locator("h2.header__link");

    const balanceTextBefore = await balanceLocator.textContent();

    const balanceBefore = Number(
      balanceTextBefore?.replace("Balance:", "").trim(),
    );

    await page.getByText("Transactions", { exact: true }).click();

    await page.getByRole("button", { name: "Add balance" }).click();
    await page.getByPlaceholder("Enter sum").fill("100");
    await page.getByRole("button", { name: "Add", exact: true }).click();

    await page.goto("http://localhost/");

    await expect(balanceLocator).toHaveText(`Balance: ${balanceBefore + 100}`);

    await page.getByText("Transactions", { exact: true }).click();

    const firstRow = page.locator("tbody tr").first();

    await expect(firstRow).toBeVisible();
    await expect(firstRow.locator("td").nth(2)).toHaveText("completed");
    await expect(firstRow.locator("td").nth(3)).toHaveText("deposit");
    await expect(firstRow.locator("td").nth(4)).toHaveText("100");
  });

  test("пополнение баланса на 0", async ({ page }) => {
    await page.getByText("Transactions", { exact: true }).click();

    await page.getByRole("button", { name: "Add balance" }).click();

    const sumInput = page.getByPlaceholder("Enter sum");

    await sumInput.fill("0");
    await page.getByRole("button", { name: "Add", exact: true }).click();

    await expect(sumInput).toBeVisible();
    await expect(sumInput).toHaveValue("0");
    await expect(
      page.getByRole("button", { name: "Add", exact: true }),
    ).toBeVisible();
  });

  test("пополнение баланса на отрицательную сумму", async ({ page }) => {
    await page.getByText("Transactions", { exact: true }).click();

    await page.getByRole("button", { name: "Add balance" }).click();

    const sumInput = page.getByPlaceholder("Enter sum");

    await sumInput.fill("-1");
    await page.getByRole("button", { name: "Add", exact: true }).click();

    await expect(sumInput).toBeVisible();
    await expect(sumInput).toHaveValue("-1");
    await expect(
      page.getByRole("button", { name: "Add", exact: true }),
    ).toBeVisible();
  });
  test("пополнение баланса на дробную сумму", async ({ page }) => {
    const balanceLocator = page.locator("h2.header__link");

    const balanceTextBefore = await balanceLocator.textContent();

    const balanceBefore = Number(
      balanceTextBefore?.replace("Balance:", "").trim(),
    );

    await page.getByText("Transactions", { exact: true }).click();

    await page.getByRole("button", { name: "Add balance" }).click();
    await page.getByPlaceholder("Enter sum").fill("10.55");
    await page.getByRole("button", { name: "Add", exact: true }).click();

    await page.getByText("Main", { exact: true }).click();

    const balanceTextAfter = await balanceLocator.textContent();

    const balanceAfter = Number(
      balanceTextAfter?.replace("Balance:", "").trim(),
    );

    expect(balanceAfter).toBeCloseTo(balanceBefore + 10.55, 2);

    await page.getByText("Transactions", { exact: true }).click();

    const firstRow = page.locator("tbody tr").first();

    await expect(firstRow).toBeVisible();
    await expect(firstRow.locator("td").nth(2)).toHaveText("completed");
    await expect(firstRow.locator("td").nth(3)).toHaveText("deposit");
    await expect(firstRow.locator("td").nth(4)).toHaveText("10.55");
  });
});
