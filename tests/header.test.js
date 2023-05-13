const puppeteer = require("puppeteer");
const sessionFactory = require("./factories/session");
const userFactory = require("./factories/user");

let browser, page;

beforeEach(async () => {
  browser = await puppeteer.launch({
    headless: false,
  });

  page = await browser.newPage();
  await page.goto("localhost:3000");
});

afterEach(async () => {
  // await browser.close();
});

test("lets lunch browser", async () => {
  const text = await page.$eval("a.brand-logo", (el) => el.innerHTML);

  expect(text).toEqual("Blogster");
});

test("Clicking login starts oauth flow", async () => {
  await page.click(".right a");

  const url = await page.url();

  expect(url).toMatch(/accounts\.google\.com/);
});

test.only("Logout button", async () => {
  const user = await userFactory();
  console.log(user);
  const { session, sessionSig } = sessionFactory(user);

  await page.setCookie({ name: "session", value: session });
  await page.setCookie({ name: "session.sig", value: sessionSig });
  await page.goto("localhost:3000");

  await page.waitFor('a[href="/auth/logout"]');

  const text = await page.$eval('a[href="/auth/logout"]', (el) => el.innerHTML);

  expect(text).toEqual("Logout");
});
