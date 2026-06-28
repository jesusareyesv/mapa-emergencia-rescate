import { render, screen } from "@testing-library/react";
import Page from "./page";

describe("Home page", () => {
  it("renders the admin panel heading in Spanish", () => {
    render(<Page />);
    expect(screen.getByRole("heading", { name: "Panel de administración" })).toBeInTheDocument();
  });
});
