import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { App } from "../../src/app/App";

afterEach(cleanup);

describe("土台のスモークテスト", () => {
  it("/ で図鑑のプレースホルダーが出る", () => {
    window.history.pushState(null, "", "/");
    render(<App />);
    expect(screen.getByTestId("page-dex")).toBeTruthy();
  });

  it("存在しないパスで 404 表示と / へのリンクが出る", () => {
    window.history.pushState(null, "", "/foo");
    render(<App />);
    expect(screen.getByTestId("page-notfound")).toBeTruthy();
    expect(screen.getByText("図鑑へ戻る")).toBeTruthy();
  });
});
