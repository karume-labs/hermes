import { describe, expect, test } from "bun:test";
import { buildEmailHtml, escapeHtml } from "@api/features/shared/mail/index";
import { wantsEmail } from "@api/features/shared/mail/send-mail";

describe("email copy", () => {
  test("user text is escaped before it reaches the template", () => {
    expect(escapeHtml("<b>&</b>")).toBe("&lt;b&gt;&amp;&lt;/b&gt;");
  });

  test("a rendered message escapes its heading and paragraphs", () => {
    const html = buildEmailHtml({
      heading: "<script>alert(1)</script>",
      paragraphs: ["Hello <b>Ada</b>", "Your result is ready"],
      actionLabel: "Open Hermes Care",
      actionUrl: "https://app.example.test/",
      footerNote: "Sent by Hermes Care",
    });
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<b>Ada</b>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("https://app.example.test/");
  });

  test("only email and both preferences want email", () => {
    expect(wantsEmail("email")).toBe(true);
    expect(wantsEmail("both")).toBe(true);
    expect(wantsEmail("in_app")).toBe(false);
  });
});
