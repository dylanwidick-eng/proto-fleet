import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import MonthCalendar from "@/protoFleet/features/agent/components/automations/MonthCalendar";
import { paletteFor } from "@/protoFleet/features/agent/lib/palette";
import type { Weekday, Workflow } from "@/protoFleet/features/agent/types";

const pushToastMock = vi.hoisted(() => vi.fn());

vi.mock("@/shared/features/toaster", () => ({
  pushToast: pushToastMock,
  STATUSES: { queued: "queued", loading: "loading", success: "success", error: "error" },
}));

const makeSchedule = (overrides: Partial<Workflow> & { id: string }): Workflow => ({
  name: overrides.id,
  triggerType: "schedule",
  whenText: "Mon–Fri, 2:00–5:00 PM",
  schedule: { days: ["Mon", "Tue", "Wed", "Thu", "Fri"], startTime: "14:00", endTime: "17:00" },
  thenText: "Do the thing",
  scope: "all",
  sourceItemId: null,
  site: "all",
  cat: "Settings",
  createdAt: 0,
  lastFiredAt: null,
  fireCount: 0,
  paused: false,
  ...overrides,
});

const onDays = (id: string, days: Weekday[], startTime = "14:00"): Workflow =>
  makeSchedule({ id, schedule: { days, startTime, endTime: "17:00" } });

// Fixed month: July 2026. July 1st is a Wednesday, so the Monday-start grid
// runs June 29 (Mon) … August 2 (Sun) = 35 cells.
const JULY_2026 = new Date(2026, 6, 1);
const TODAY = new Date(2026, 6, 17); // a Friday inside the month

beforeEach(() => {
  pushToastMock.mockClear();
});

describe("MonthCalendar", () => {
  it("renders a Monday-start padded month grid (35 cells for July 2026)", () => {
    render(<MonthCalendar anchor={JULY_2026} schedules={[]} today={TODAY} />);

    const headers = screen.getAllByText(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)$/);
    expect(headers.map((h) => h.textContent)).toEqual(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]);

    expect(screen.getAllByTestId(/^month-cell-/)).toHaveLength(35);
    expect(screen.getByTestId("month-cell-2026-06-29")).toHaveAttribute("data-in-month", "false");
    expect(screen.getByTestId("month-cell-2026-07-01")).toHaveAttribute("data-in-month", "true");
    expect(screen.getByTestId("month-cell-2026-08-02")).toHaveAttribute("data-in-month", "false");
  });

  it("marks only today's cell with the filled date dot", () => {
    render(<MonthCalendar anchor={JULY_2026} schedules={[]} today={TODAY} />);

    const dot = screen.getByTestId("month-today-dot");
    expect(dot).toHaveTextContent("17");
    expect(within(screen.getByTestId("month-cell-2026-07-17")).getByTestId("month-today-dot")).toBe(dot);
  });

  it("places pills on every matching weekday, including past days and out-of-month padding cells", () => {
    render(<MonthCalendar anchor={JULY_2026} schedules={[onDays("wf_mon", ["Mon"])]} today={TODAY} />);

    // All five Mondays in the grid — the out-of-month June 29 included.
    for (const iso of ["2026-06-29", "2026-07-06", "2026-07-13", "2026-07-20", "2026-07-27"]) {
      expect(screen.getByTestId(`month-pill-${iso}-wf_mon`)).toBeInTheDocument();
    }
    expect(screen.getAllByTestId(/^month-pill-/)).toHaveLength(5);
  });

  it("caps cells at 3 pills and routes '+N more' to the day-detail toast stub", () => {
    const schedules = ["wf_a", "wf_b", "wf_c", "wf_d", "wf_e"].map((id) => onDays(id, ["Mon"]));
    render(<MonthCalendar anchor={JULY_2026} schedules={schedules} today={TODAY} />);

    const cell = within(screen.getByTestId("month-cell-2026-07-06"));
    expect(cell.getAllByTestId(/^month-pill-/)).toHaveLength(3);

    fireEvent.click(cell.getByRole("button", { name: "+2 more" }));
    expect(pushToastMock).toHaveBeenCalledWith({
      message: "See all automations on 2026-07-06 — coming next",
      status: "success",
    });
  });

  it("keeps the 24h pill-time quirk: leading zero stripped, no 12-hour conversion", () => {
    render(
      <MonthCalendar
        anchor={JULY_2026}
        schedules={[onDays("wf_morning", ["Tue"], "09:00"), onDays("wf_afternoon", ["Tue"], "14:00")]}
        today={TODAY}
      />,
    );

    const cell = within(screen.getByTestId("month-cell-2026-07-07"));
    expect(cell.getByTestId("month-pill-2026-07-07-wf_morning")).toHaveTextContent("9:00");
    expect(cell.getByTestId("month-pill-2026-07-07-wf_afternoon")).toHaveTextContent("14:00");
  });

  it("colors pills via the stable id hash palette, identically across cells", () => {
    render(<MonthCalendar anchor={JULY_2026} schedules={[onDays("wf_mon", ["Mon"])]} today={TODAY} />);

    const palette = paletteFor("wf_mon");
    const first = screen.getByTestId("month-pill-2026-07-06-wf_mon");
    const second = screen.getByTestId("month-pill-2026-07-13-wf_mon");
    expect(first).toHaveClass(palette.bg, palette.text);
    expect(second).toHaveClass(palette.bg, palette.text);
  });

  it("dims paused workflows to opacity-45 and keeps active ones full strength", () => {
    render(
      <MonthCalendar
        anchor={JULY_2026}
        schedules={[onDays("wf_active", ["Wed"]), makeSchedule({ id: "wf_paused", paused: true })]}
        today={TODAY}
      />,
    );

    expect(screen.getByTestId("month-pill-2026-07-01-wf_paused")).toHaveClass("opacity-45");
    expect(screen.getByTestId("month-pill-2026-07-01-wf_active")).not.toHaveClass("opacity-45");
  });

  it("routes pill clicks to the edit toast stub (no edit surface exists yet)", () => {
    render(
      <MonthCalendar anchor={JULY_2026} schedules={[makeSchedule({ id: "wf_x", name: "ERCOT DR" })]} today={TODAY} />,
    );

    fireEvent.click(screen.getByTestId("month-pill-2026-07-01-wf_x"));
    expect(pushToastMock).toHaveBeenCalledWith({
      message: "Edit ERCOT DR — detail surface coming next",
      status: "success",
    });
  });
});
