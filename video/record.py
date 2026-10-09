#!/usr/bin/env python3
"""Record the 2-minute demo video of the new-organizer flow and write public/demo.mp4.

Usage: python3 video/record.py [base_url] [--out public/demo.mp4]
  base_url defaults to the live site; the script opens it with ?reset=1, so the demo starts empty.

Drives the shots of the vault note "demo video script for {create volunteer portal prototype …}" at a human pace:
a synthetic cursor (a dot injected into every page, moved with page.mouse), smooth scrolling, a caption bar at the
bottom (26 px), Playwright's video recording at 1600x900, then ffmpeg to H.264 (yuv420p, faststart).
Needs: python3 playwright (Chromium installed) and ffmpeg. The raw WebM stays in video/out/ (gitignored).
Prints the start second of every shot and the spoken word count, for the script note.
"""
import os
import re
import subprocess
import sys
import time
from pathlib import Path

from playwright.sync_api import Locator, Page, TimeoutError as PlaywrightTimeoutError, sync_playwright

ROOT = Path(__file__).resolve().parent.parent
args = [a for a in sys.argv[1:] if not a.startswith('--')]
BASE = args[0] if args else 'https://pauseai.github.io/volunteer-portal-prototype/'
OUT = Path(sys.argv[sys.argv.index('--out') + 1]) if '--out' in sys.argv else ROOT / 'public' / 'demo.mp4'
RAW_DIR = ROOT / 'video' / 'out'
COLLATERAL = 'https://pauseai.uk/tools/collateral'
FONTS = 'https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,600&display=swap'
SITE_LINE = re.sub(r'^https?://', '', BASE).rstrip('/')
TITLE = 'Pausetown info evening, 20 November'
W, H = 1600, 900

# Injected into every document: the cursor dot (follows the real mouse events) and the caption bar.
OVERLAY_JS = """
(() => {
  const install = () => {
    if (document.getElementById('__demo_cursor')) return;
    const dot = document.createElement('div');
    dot.id = '__demo_cursor';
    Object.assign(dot.style, {
      position: 'fixed', left: '0', top: '0', width: '22px', height: '22px', marginLeft: '-11px', marginTop: '-11px',
      borderRadius: '50%', background: 'rgba(32,27,42,0.82)', border: '2.5px solid #f5efe4',
      boxShadow: '0 1px 6px rgba(0,0,0,0.35)', zIndex: '2147483647', pointerEvents: 'none',
      transform: 'translate(-100px,-100px)', transition: 'transform 70ms linear',
    });
    document.body.appendChild(dot);
    let x = -100, y = -100;
    const place = (s) => { dot.style.transform = `translate(${x}px,${y}px) scale(${s})`; };
    document.addEventListener('mousemove', (e) => { x = e.clientX; y = e.clientY; place(1); }, true);
    document.addEventListener('mousedown', (e) => { x = e.clientX; y = e.clientY; place(0.7); }, true);
    document.addEventListener('mouseup', (e) => { x = e.clientX; y = e.clientY; place(1); }, true);

    const bar = document.createElement('div');
    bar.id = '__demo_caption';
    Object.assign(bar.style, {
      position: 'fixed', left: '0', right: '0', bottom: '0', zIndex: '2147483646', display: 'none',
      background: 'rgba(32,27,42,0.94)', color: '#f5efe4',
      font: '400 26px/1.35 "DM Sans", system-ui, sans-serif', padding: '18px 64px 22px', textAlign: 'center',
      pointerEvents: 'none',
    });
    const text = document.createElement('span');
    text.id = '__demo_caption_text';
    Object.assign(text.style, { display: 'inline-block', opacity: '0', transition: 'opacity 160ms ease' });
    bar.appendChild(text);
    document.body.appendChild(bar);
    if (!document.fonts.check('16px "DM Sans"')) {  // a foreign page: fetch the caption font (cached by now)
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = __FONTS__;
      document.head.appendChild(link);
    }
  };
  if (document.body) install(); else document.addEventListener('DOMContentLoaded', install);
})();
""".replace('__FONTS__', repr(FONTS))

CAPTION_JS = """([text, instant]) => {
  const bar = document.getElementById('__demo_caption'), span = document.getElementById('__demo_caption_text');
  if (!bar) return;
  bar.style.display = 'block';
  if (instant) { span.textContent = text; span.style.opacity = '1'; return; }
  span.style.opacity = '0';
  setTimeout(() => { span.textContent = text; span.style.opacity = '1'; }, 170);
}"""


class Demo:
    def __init__(self, page: Page):
        self.page = page
        self.x, self.y = W / 2, H / 2
        self.t0 = time.monotonic()
        self.shots: list[tuple[str, float]] = []
        self.words = 0
        self.current = ''

    # --- time -------------------------------------------------------------------------------------------------
    def now(self) -> float:
        return time.monotonic() - self.t0

    def hold(self, seconds: float) -> None:
        self.page.wait_for_timeout(int(seconds * 1000))

    def shot(self, name: str) -> None:
        self.shots.append((name, self.now()))

    # --- overlay ----------------------------------------------------------------------------------------------
    def caption(self, text: str, *, hold: float = 0) -> None:
        """Swap the caption text with a short fade; counts the words (every caption is a spoken line)."""
        self.words += len(text.split())
        self.current = text
        self.page.evaluate(CAPTION_JS, [text, False])
        self.hold(0.35 + hold)

    def after_navigation(self) -> None:
        """A full page load made a fresh overlay: wait for fonts, restore the caption and the dot's position."""
        self.page.wait_for_load_state('load')
        self.page.evaluate('document.fonts.ready')
        self.page.evaluate(CAPTION_JS, [self.current, True])
        self.page.mouse.move(self.x, self.y)

    # --- mouse ------------------------------------------------------------------------------------------------
    def move(self, x: float, y: float, duration: float | None = None) -> None:
        """Move the mouse (and so the dot) along an eased path, timed by the clock so the pace is exact."""
        dist = ((x - self.x) ** 2 + (y - self.y) ** 2) ** 0.5
        duration = duration if duration is not None else min(0.8, max(0.35, 0.25 + dist / 1600))
        sx, sy = self.x, self.y
        start = time.monotonic()
        while True:
            t = min(1.0, (time.monotonic() - start) / duration)
            e = t * t * (3 - 2 * t)  # ease in-out
            self.page.mouse.move(sx + (x - sx) * e, sy + (y - sy) * e)
            if t >= 1.0:
                break
            self.page.wait_for_timeout(12)
        self.x, self.y = x, y

    def bring_into_view(self, target: Locator) -> None:
        box = target.bounding_box()
        assert box, 'target not rendered'
        if box['y'] < 90 or box['y'] + box['height'] > H - 110:  # under the top bar or the caption bar
            target.evaluate("el => el.scrollIntoView({block: 'center', behavior: 'smooth'})")
            self.hold(0.8)

    def point(self, target: Locator, at: str = 'center') -> tuple[float, float]:
        """A point on the element: its center, its left or right end, or the page margin next to it (to park)."""
        self.bring_into_view(target)
        box = target.bounding_box()
        assert box, 'target not rendered'
        x = box['x'] + box['width'] / 2
        y = box['y'] + box['height'] / 2
        if at == 'left':
            x = box['x'] + min(60, box['width'] / 2)
        elif at == 'right':
            x = box['x'] + box['width'] - min(44, box['width'] / 2)
        elif at == 'margin':
            x, y = box['x'] - 30, box['y'] + min(box['height'] / 2, 140)
        return x, y

    def hover(self, target: Locator, at: str = 'center') -> None:
        self.move(*self.point(target, at))

    def click(self, target: Locator, at: str = 'center', settle: float = 0.5) -> None:
        self.hover(target, at)
        self.hold(0.2)
        self.page.mouse.down()
        self.hold(0.08)
        self.page.mouse.up()
        self.hold(settle)

    def type(self, text: str) -> None:
        self.page.keyboard.type(text, delay=50)

    def scroll(self, dy: int, settle: float = 0.9) -> None:
        self.page.evaluate("dy => window.scrollBy({top: dy, behavior: 'smooth'})", dy)
        self.hold(settle)


def record(base: str) -> tuple[Path, float, float, Demo, bool]:
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    for old in RAW_DIR.glob('*.webm'):
        old.unlink()
    env = {**os.environ, 'LANG': 'en_GB.UTF-8', 'LANGUAGE': 'en_GB', 'LC_ALL': 'en_GB.UTF-8'}  # dd/mm/yyyy date fields
    with sync_playwright() as p:
        browser = p.chromium.launch(env=env)
        context = browser.new_context(
            viewport={'width': W, 'height': H},
            record_video_dir=str(RAW_DIR),
            record_video_size={'width': W, 'height': H},
            locale='en-GB',
        )
        context.add_init_script(OVERLAY_JS)
        page = context.new_page()
        video_started = time.monotonic()
        tid = page.get_by_test_id

        # Warm-up, cut from the video: fonts, and the external tool's cache so its visit is quick.
        page.goto(base + '?reset=1', wait_until='networkidle')
        page.evaluate('document.fonts.ready')
        try:
            page.goto(COLLATERAL, wait_until='load', timeout=10_000)
        except PlaywrightTimeoutError:
            pass
        page.goto(base + '?reset=1', wait_until='networkidle')
        page.evaluate('document.fonts.ready')
        page.wait_for_function("document.fonts.check('16px \"DM Sans\"') && document.fonts.check('bold 40px \"Bricolage Grotesque\"')")
        d = Demo(page)
        page.mouse.move(d.x, d.y)
        d.hold(0.6)
        start_offset = time.monotonic() - video_started

        # 1 Cold open: the empty My projects
        d.shot('Cold open')
        d.caption("PauseAI's volunteer portal, a prototype: what Global gives a new local organizer.", hold=3.6)
        d.caption('No backlog. One suggestion: run your first info event.', hold=1.0)
        d.hover(tid('start-card'), at='left')
        d.hold(1.4)

        # 2 New project
        d.shot('New project')
        d.click(tid('new-project'))
        d.caption('New project: a title.')
        d.click(tid('project-title'), at='right', settle=0.2)
        d.type(TITLE)
        d.caption('Later, an assistant drafts the whole project from a line like this; for now, pick a template.', hold=3.3)

        # 3 Template picker
        d.shot('Template picker')
        d.click(tid('template-info-event'))
        d.caption('Info event is built, Protest coming soon.', hold=0.8)
        d.hover(tid('template-protest'))
        d.caption('Later, your chapter pushes campaign templates into this picker and tracks them.', hold=3.0)
        d.click(tid('create-project'), settle=0.7)

        # 4 The project with its guidance
        d.shot('The project')
        page.wait_for_function("document.querySelectorAll('[data-testid=step]').length === 6")
        d.caption('It arrives filled in. On top, how to do this well: the goal and what matters.', hold=0.8)
        d.hover(tid('guidance'), at='margin')
        d.hold(3.2)
        d.click(tid('guidance-toggle'), at='right', settle=0.5)
        d.caption('Collapsed, the six parts stay in view, each with an owner and a due date.', hold=1.0)
        location_owner = tid('step').filter(has_text='Location').get_by_test_id('step-owner')
        d.click(location_owner, at='right', settle=0.35)
        location_owner.select_option(label='Hannah Halt')
        d.hold(2.0)

        # 5 A part: Give a good talk
        d.shot('Give a good talk')
        d.click(tid('step-link').filter(has_text='Give a good talk'), at='left', settle=0.6)
        d.caption('Every part opens the same way: its own guidance — pitch structure, agreed positions, ten slides at most.', hold=0.6)
        d.hover(tid('guidance'), at='margin')
        d.hold(2.6)
        d.scroll(400, settle=0.9)
        d.caption('And its tasks to tick off.')
        d.click(tid('step').filter(has_text='Write the outline').get_by_test_id('step-done'), settle=0.3)
        d.hold(1.8)

        # 6 Promote the event, with the Collateral maker
        d.shot('Promote the event')
        d.scroll(-400, settle=0.7)
        d.click(page.get_by_role('navigation', name='Breadcrumb').get_by_role('link', name=TITLE), settle=0.7)
        d.click(tid('step-link').filter(has_text='Promote the event'), at='left', settle=0.6)
        promote_url = page.url
        d.caption('Promote the event links the tools we already have.', hold=0.6)
        d.hover(tid('guidance').get_by_role('link', name='Collateral maker'))
        d.hold(1.0)
        d.caption('The Instagram image comes from the Collateral maker: Event layout, your details, download.')
        visited = False
        try:  # the external page only if it comes quickly (Simon, 2026-10-09); otherwise rest on the link
            page.goto(COLLATERAL, wait_until='load', timeout=2500)
            visited = True
        except PlaywrightTimeoutError:
            page.goto(promote_url, wait_until='load')
        d.after_navigation()
        d.hold(3.2 if visited else 2.0)
        if visited:
            page.go_back(wait_until='load')
            d.after_navigation()
            d.hold(0.5)
        d.click(tid('guidance-toggle'), at='right', settle=0.5)
        d.caption('Flyers are optional; delete what you don’t need.')
        flyers = tid('step').filter(has_text='(optional) Print flyers')
        d.hover(flyers, at='left')
        d.hold(0.4)
        d.click(flyers.get_by_test_id('remove-item'), settle=0.3)
        d.hold(1.8)

        # 7 Resources
        d.shot('Resources')
        d.click(tid('tab-resources'), settle=0.5)
        d.caption('Resources holds the same templates, readable, plus a few curated guides, tools and chapter documents.', hold=0.5)
        d.scroll(820, settle=2.6)
        d.scroll(-820, settle=1.4)
        d.click(tid('resource-info-event'), at='left', settle=0.7)
        d.caption('Info event is exactly what the project gave you.', hold=0.8)
        d.hover(tid('use-template'), at='right')
        d.hold(1.2)
        d.caption('Later, a library: templates from every group, sorted by likes.', hold=2.8)

        # 8 Teams
        d.shot('Teams')
        d.click(tid('tab-teams'), settle=0.5)
        d.caption('Teams is how people join: your group on top, the rest of the chapter below.', hold=2.6)
        d.click(tid('city-search'), at='right', settle=0.2)
        d.type('Still')
        d.caption('Local groups by city, national teams, each with Apply.', hold=0.3)
        d.click(tid('apply-stillwater'), settle=0.3)
        d.hold(2.2)

        # 9 Close
        d.shot('Close')
        d.click(tid('tab-projects'), settle=0.5)
        d.caption('One path built end to end; the rest follows.', hold=2.2)
        d.caption(f'Try it yourself: {SITE_LINE}', hold=4.0)
        d.shot('End')
        duration = d.now()

        video = page.video
        assert video
        context.close()
        raw = Path(video.path())
        browser.close()
    return raw, start_offset, duration, d, visited


def convert(raw: Path, start: float, duration: float, out: Path) -> None:
    out.parent.mkdir(parents=True, exist_ok=True)
    vf = (
        f'trim=start={start:.3f}:end={start + duration:.3f},setpts=PTS-STARTPTS,'
        f'fade=t=in:st=0:d=0.4,fade=t=out:st={duration - 0.6:.3f}:d=0.6'
    )
    subprocess.run(
        ['ffmpeg', '-y', '-v', 'error', '-i', str(raw), '-vf', vf, '-an', '-r', '25',
         '-c:v', 'libx264', '-preset', 'slow', '-crf', '22', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', str(out)],
        check=True,
    )


if __name__ == '__main__':
    raw, start, duration, demo, visited = record(BASE)
    convert(raw, start, duration, OUT)
    print(f'{OUT} — {duration:.1f} s, {OUT.stat().st_size / 1e6:.1f} MB (raw {raw})')
    print(f'{demo.words} spoken words; Collateral maker {"shown live" if visited else "not shown (rested on the link)"}')
    for name, t in demo.shots:
        print(f'{t:6.1f}  {name}')
