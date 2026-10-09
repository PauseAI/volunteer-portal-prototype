#!/usr/bin/env python3
"""Drive the new-organizer flow at 1440x900 and screenshot every screen.

Usage: python3 scripts/walkthrough.py [base_url] [out_dir]
  base_url defaults to the local preview (npm run build && npm run preview): http://localhost:4173/volunteer-portal-prototype/
  out_dir defaults to /tmp/vpp-shots
Fails loudly (AssertionError) where the flow breaks; prints console errors at the end.
"""
import sys
from pathlib import Path

from playwright.sync_api import expect, sync_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:4173/volunteer-portal-prototype/"
OUT = Path(sys.argv[2] if len(sys.argv) > 2 else "/tmp/vpp-shots")
OUT.mkdir(parents=True, exist_ok=True)
TITLE = "Info evening at the Pausetown library"

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={"width": 1440, "height": 900})
    errors: list[str] = []
    page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
    page.on("pageerror", lambda e: errors.append(str(e)))
    n = 0

    def shot(name: str, full: bool = False) -> None:
        global n
        n += 1
        page.wait_for_timeout(250)
        page.screenshot(path=str(OUT / f"{n:02d}-{name}.png"), full_page=full)

    tid = page.get_by_test_id

    # cold open: banner + empty state
    page.goto(BASE + "?reset=1")
    page.wait_for_load_state("networkidle")
    page.evaluate("document.fonts.ready")
    expect(tid("banner")).to_be_visible()
    expect(tid("start-card")).to_be_visible()
    shot("empty-state")

    # New project -> title -> template
    tid("new-project").click()
    expect(tid("template-empty")).to_have_attribute("aria-checked", "true")
    shot("new-project")
    tid("project-title").fill(TITLE)
    tid("template-info-event").click()
    expect(tid("template-info-event")).to_have_attribute("aria-checked", "true")
    tid("template-protest").click(force=True)  # greyed out: must not take the selection
    expect(tid("template-info-event")).to_have_attribute("aria-checked", "true")
    shot("template-chosen")
    tid("browse-templates").click()
    expect(tid("template-library")).to_be_visible()
    shot("browse-templates", full=True)
    tid("create-project").click()

    # the project
    expect(page.get_by_test_id("item-title")).to_have_value(TITLE)
    expect(tid("step")).to_have_count(6)
    expect(tid("from-template")).to_be_visible()
    shot("project")
    shot("project-full", full=True)
    tid("guidance-toggle").click()
    expect(tid("guidance-toggle")).to_have_attribute("aria-expanded", "false")
    page.reload()
    expect(tid("guidance-toggle")).to_have_attribute("aria-expanded", "false")  # remembered per item
    shot("project-guidance-collapsed")

    # a sub-project, then a task
    tid("step-link").filter(has_text="Promote the event").click()
    expect(tid("guidance-toggle")).to_have_attribute("aria-expanded", "true")  # expanded by default
    expect(tid("step")).to_have_count(6)
    shot("sub-project")
    shot("sub-project-full", full=True)
    tid("step-link").filter(has_text="Post on Instagram").click()
    expect(tid("guidance")).to_contain_text("Collateral maker")
    shot("task")
    tid("owner-select").select_option(label="Priya Nair")
    tid("due-input").fill("2026-11-12")
    tid("done-checkbox").click()
    expect(tid("done-checkbox")).to_have_attribute("aria-checked", "true")
    shot("task-owner-due-done")

    # back up: add and remove an item
    page.get_by_role("navigation", name="Breadcrumb").get_by_role("link", name="Promote the event").click()
    expect(tid("step")).to_have_count(6)
    tid("add-item-input").fill("Ask the uni climate group to share it")
    tid("add-item").click()
    expect(tid("step")).to_have_count(7)
    row = tid("step").filter(has_text="(optional) Print flyers")
    row.hover()
    shot("sub-project-added-item-hover-remove")
    row.get_by_test_id("remove-item").click()
    expect(tid("step")).to_have_count(6)
    shot("sub-project-removed-item")

    # the project again, then its template on Resources
    page.get_by_role("navigation", name="Breadcrumb").get_by_role("link", name=TITLE).click()
    expect(tid("from-template")).to_be_visible()
    tid("guidance-toggle").click()  # expand again
    shot("project-progress")
    tid("from-template").click()
    expect(tid("use-template")).to_be_visible()
    shot("resource-template")
    shot("resource-template-full", full=True)
    tid("resource-step").filter(has_text="Promote the event").click()
    shot("resource-sub-template", full=True)

    # Resources tab
    tid("tab-resources").click()
    shot("resources")
    shot("resources-full", full=True)
    tid("resource-info-event").click()
    tid("use-template").click()
    expect(tid("template-info-event")).to_have_attribute("aria-checked", "true")  # preselected
    shot("new-project-preselected")

    # Teams
    tid("tab-teams").click()
    shot("teams")
    shot("teams-full", full=True)
    tid("city-search").fill("still")
    expect(tid("local-group")).to_have_count(1)
    tid("apply-stillwater").click()
    tid("apply-social-media").click()
    expect(tid("apply-social-media")).to_have_text("Applied")
    shot("teams-filtered-applied")

    # My projects with the project, banner dismissed
    tid("tab-projects").click()
    expect(tid("project-card")).to_have_count(1)
    shot("my-projects")
    tid("banner-dismiss").click()
    expect(tid("banner")).to_have_count(0)
    shot("my-projects-no-banner")

    # hidden reset
    tid("reset-demo").click()
    page.wait_for_load_state("networkidle")
    expect(tid("start-card")).to_be_visible()
    expect(tid("banner")).to_be_visible()
    shot("after-reset")

    browser.close()
    print(f"{n} screenshots in {OUT}")
    print("console errors:", errors or "none")
