const Page = require("./helpers/page");

let page;

beforeEach(async () => {
  page = await Page.build();
  await page.goto("localhost:3000");
});

afterEach(async () => {
  await page.close();
});

describe("When logged in", async () => {
  beforeEach(async () => {
    await page.login();
    await page.click("a.btn-floating");
  });

  test("Can see blog creation form", async () => {
    const text = await page.getElementContent("form label");

    expect(text).toEqual("Blog Title");
  });

  describe("When using invalid inputes", async () => {
    beforeEach(async () => {
      await page.click("button.teal");
    });

    test("The form shows error message", async () => {
      const titleError = await page.getElementContent("form .title .red-text");
      const contentError = await page.getElementContent(
        "form .content .red-text"
      );

      expect(titleError).toEqual("You must provide a value");
      expect(contentError).toEqual("You must provide a value");
    });
  });

  describe("When using valid inputes", async () => {
    beforeEach(async () => {
      await page.type(".title input", "My Title");
      await page.type(".content input", "My Content");
      await page.click("form button");
    });

    test("Submitting takes user to review screen", async () => {
      const title = await page.getElementContent("h5");
      expect(title).toEqual("Please confirm your entries");
    });

    test("Submitting than saving adds blog to index page ", async () => {
      await page.click("button.green");
      // When clicked AJAX request was sent
      // that's why we need to wait for page rendering
      await page.waitFor(".card");

      const title = await page.getElementContent(".card-title");
      const content = await page.getElementContent("p");

      expect(title).toEqual("My Title");
      expect(content).toEqual("My Content");
    });
  });
});

describe("When user not logged in", () => {
  test("User cannot create blog posts", async () => {
    const result = await page.evaluate(() => {
      return fetch("/api/blogs", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: "My Title",
          content: "My Content",
        }),
      }).then((res) => res.json());
    });

    expect(result).toEqual({ error: "You must log in!" });
  });

  test("User cannot retrive posts", async () => {
    const result = await page.evaluate(() => {
      return fetch("/api/blogs", {
        method: "GET",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
      }).then((res) => res.json());
    });

    expect(result).toEqual({ error: "You must log in!" });
  });
});
