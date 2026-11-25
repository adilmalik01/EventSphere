from pathlib import Path

from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
from pptx.util import Emu, Inches, Pt

INK = RGBColor(0x1C, 0x19, 0x15)
CREAM = RGBColor(0xFA, 0xF7, 0xF2)
PAPER = RGBColor(0xF3, 0xEE, 0xE6)
CLAY = RGBColor(0xB8, 0x43, 0x2F)
MUTED = RGBColor(0x6D, 0x65, 0x5C)
LINE = RGBColor(0xE3, 0xDA, 0xCD)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
PINE = RGBColor(0x1E, 0x46, 0x38)

W = Inches(13.333)
H = Inches(7.5)
ROOT = Path(__file__).resolve().parents[1]
IMAGES = Path(__file__).resolve().parent / "images"


def set_run(run, text, size, bold=False, color=INK, font="Calibri"):
    run.text = text
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.color.rgb = color
    run.font.name = font


def add_text(slide, text, x, y, w, h, size=18, bold=False, color=INK, font="Calibri", align=PP_ALIGN.LEFT, anchor=MSO_ANCHOR.TOP):
    box = slide.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    frame = box.text_frame
    frame.word_wrap = True
    frame.auto_size = None
    frame.margin_left = Emu(0)
    frame.margin_right = Emu(0)
    try:
        frame._txBody.bodyPr.set("anchor", {MSO_ANCHOR.TOP: "t", MSO_ANCHOR.MIDDLE: "ctr", MSO_ANCHOR.BOTTOM: "b"}[anchor])
    except Exception:
        pass
    paragraph = frame.paragraphs[0]
    paragraph.alignment = align
    set_run(paragraph.add_run(), text, size, bold, color, font)
    return box


def rect(slide, x, y, w, h, fill):
    shape = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(x), Inches(y), Inches(w), Inches(h))
    shape.fill.solid()
    shape.fill.fore_color.rgb = fill
    shape.line.fill.background()
    return shape


def background(slide, color=PAPER):
    fill = slide.background.fill
    fill.solid()
    fill.fore_color.rgb = color


def bullets(slide, items, x, y, w, h, size=18, color=INK):
    box = slide.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    frame = box.text_frame
    frame.word_wrap = True
    for index, item in enumerate(items):
        paragraph = frame.paragraphs[0] if index == 0 else frame.add_paragraph()
        paragraph.alignment = PP_ALIGN.LEFT
        paragraph.space_after = Pt(10)
        set_run(paragraph.add_run(), item, size, False, color)
    return box


def footer(slide, number, total):
    add_text(slide, "EventSphere Management", 0.6, 7.05, 6, 0.3, 11, color=MUTED)
    add_text(slide, f"{number}  /  {total}", 11.2, 7.05, 1.5, 0.3, 11, color=MUTED, align=PP_ALIGN.RIGHT)


def new_slide(prs, color=PAPER):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    background(slide, color)
    return slide


def build():
    prs = Presentation()
    prs.slide_width = W
    prs.slide_height = H
    prs.core_properties.title = "EventSphere Management"
    prs.core_properties.subject = "MERN eProject"
    total = 14

    slide = new_slide(prs, INK)
    rect(slide, 0, 0, 0.18, 7.5, CLAY)
    add_text(slide, "EPROJECT  ·  MERN STACK", 0.8, 1.3, 8, 0.4, 14, True, CREAM)
    add_text(slide, "EventSphere", 0.75, 1.8, 10, 1.3, 66, True, CREAM, "Georgia")
    add_text(slide, "A management system for expos, summits,\nand ticketed gatherings.", 0.8, 3.4, 8, 1.2, 24, False, RGBColor(0xE7, 0xDF, 0xD4), "Georgia")
    add_text(slide, "MongoDB   ·   Express   ·   React   ·   Node.js", 0.8, 6.4, 8, 0.4, 16, False, RGBColor(0xC4, 0xB8, 0xA8))

    slide = new_slide(prs)
    rect(slide, 0, 0, 13.333, 0.12, CLAY)
    add_text(slide, "What this covers", 0.7, 0.45, 8, 0.7, 36, True, INK, "Georgia")
    columns = [
        ("01", "Problem", "Why a shared sheet fails once tickets, booths, and a door are involved."),
        ("02", "Product", "Four roles, one program, and the flows between them."),
        ("03", "Build", "MERN architecture, the collections, and how a booking is saved."),
        ("04", "Proof", "How to sign in, what to click, and the cases already exercised."),
    ]
    for index, (num, title, copy) in enumerate(columns):
        x = 0.7 + (index % 2) * 6.2
        y = 1.7 + (index // 2) * 2.3
        rect(slide, x, y, 5.7, 2.0, CREAM)
        add_text(slide, num, x + 0.3, y + 0.25, 1.2, 0.4, 14, True, CLAY)
        add_text(slide, title, x + 0.3, y + 0.65, 5, 0.5, 26, True, INK, "Georgia")
        add_text(slide, copy, x + 0.3, y + 1.2, 5, 0.6, 14, False, MUTED)
    footer(slide, 2, total)

    slide = new_slide(prs)
    rect(slide, 0, 0, 13.333, 0.12, CLAY)
    add_text(slide, "The problem", 0.7, 0.4, 8, 0.7, 36, True, INK, "Georgia")
    bullets(
        slide,
        [
            "An event lives in three places: a poster, a booth spreadsheet, and a guest list.",
            "Nobody can tell which events are public and which are still a draft.",
            "A booth price gets negotiated in chat, so two exhibitors pay different rates for the same size.",
            "At the door, staff search a sheet for a name. A second arrival with the same name gets through.",
            "After the night, there is no record of who came, and no place for a review.",
        ],
        0.7,
        1.5,
        11.8,
        5,
        22,
    )
    footer(slide, 3, total)

    slide = new_slide(prs)
    rect(slide, 0, 0, 13.333, 0.12, CLAY)
    add_text(slide, "What EventSphere does", 0.7, 0.4, 10, 0.7, 36, True, INK, "Georgia")
    aims = [
        ("One program", "Drafts stay private. The public site shows only approved and completed events."),
        ("Fixed booths", "3×3, 3×6, and 6×6 have published prices. The exhibitor does not type a fee."),
        ("A real pass", "A booking gets a code. The door checks that code once."),
        ("A role each", "Admin, organizer, exhibitor, and attendee see a different desk."),
    ]
    for index, (title, copy) in enumerate(aims):
        y = 1.45 + index * 1.25
        rect(slide, 0.7, y, 0.12, 0.95, CLAY if index % 2 == 0 else PINE)
        add_text(slide, title, 1.15, y, 4, 0.4, 22, True, INK, "Georgia")
        add_text(slide, copy, 5.2, y + 0.05, 7.3, 0.8, 18, False, MUTED)
    footer(slide, 4, total)

    slide = new_slide(prs, INK)
    add_text(slide, "Four desks", 0.7, 0.4, 8, 0.7, 36, True, CREAM, "Georgia")
    roles = [
        ("Admin", "Approves the public program, categories, and suspensions."),
        ("Organizer", "Writes the event, the sessions, and the booth decisions."),
        ("Exhibitor", "Asks for a stand on an approved floor."),
        ("Attendee", "Buys a pass, saves sessions, reviews after the end."),
    ]
    for index, (title, copy) in enumerate(roles):
        x = 0.7 + index * 3.1
        rect(slide, x, 1.7, 2.9, 4.4, RGBColor(0x2A, 0x26, 0x22))
        add_text(slide, f"0{index + 1}", x + 0.25, 1.95, 2, 0.4, 14, True, CLAY)
        add_text(slide, title, x + 0.25, 2.5, 2.4, 1.2, 26, True, CREAM, "Georgia")
        add_text(slide, copy, x + 0.25, 4.1, 2.4, 1.6, 15, False, RGBColor(0xD9, 0xD0, 0xC4))
    footer(slide, 5, total)
    # footer used muted on dark; override by painting cream text already via last add - the helper uses MUTED.
    # Leave it; muted is still readable on ink.

    slide = new_slide(prs)
    rect(slide, 0, 0, 13.333, 0.12, CLAY)
    add_text(slide, "Modules", 0.7, 0.4, 8, 0.6, 36, True, INK, "Georgia")
    modules = [
        "Sign in and profile",
        "Categories",
        "Events and approval",
        "Ticket types",
        "Bookings and cancel",
        "Sessions and agenda",
        "Booth requests",
        "Door check-in",
        "Reviews",
        "Notices",
        "Role dashboards",
        "Sample data seed",
    ]
    for index, name in enumerate(modules):
        col = index % 3
        row = index // 3
        x = 0.7 + col * 4.1
        y = 1.5 + row * 1.25
        rect(slide, x, y, 3.85, 1.05, CREAM)
        add_text(slide, name, x + 0.25, y + 0.28, 3.4, 0.5, 18, True, INK)
    footer(slide, 6, total)

    slide = new_slide(prs)
    rect(slide, 0, 0, 13.333, 0.12, CLAY)
    add_text(slide, "Technology", 0.7, 0.4, 8, 0.6, 36, True, INK, "Georgia")
    stack = [
        ("MongoDB", "Document collections for users, events, tickets, bookings, sessions, booths, and reviews."),
        ("Express", "REST API, JWT checks, role guards, and validation on every write."),
        ("React", "TypeScript interface with a public site and a desk for each role."),
        ("Node.js", "Runs the API. Vite serves the interface in development and proxies /api."),
    ]
    for index, (title, copy) in enumerate(stack):
        y = 1.4 + index * 1.3
        add_text(slide, title, 0.7, y, 3, 0.5, 24, True, CLAY, "Georgia")
        add_text(slide, copy, 3.8, y, 8.6, 0.9, 18, False, INK)
    footer(slide, 7, total)

    slide = new_slide(prs)
    rect(slide, 0, 0, 13.333, 0.12, CLAY)
    add_text(slide, "Architecture", 0.7, 0.4, 10, 0.6, 36, True, INK, "Georgia")
    boxes = [
        (0.7, "Browser", "React pages\nTailwind layout"),
        (4.5, "API", "Express routes\nJWT middleware"),
        (8.3, "Database", "Mongoose models\nMongoDB"),
    ]
    for x, title, copy in boxes:
        rect(slide, x, 2.1, 3.4, 2.4, INK)
        add_text(slide, title, x + 0.3, 2.3, 2.8, 0.5, 22, True, CREAM, "Georgia")
        add_text(slide, copy, x + 0.3, 3.0, 2.8, 1.1, 16, False, RGBColor(0xE7, 0xDF, 0xD4))
    add_text(slide, "→", 4.05, 2.9, 0.5, 0.5, 28, True, CLAY, "Georgia")
    add_text(slide, "→", 7.85, 2.9, 0.5, 0.5, 28, True, CLAY, "Georgia")
    add_text(
        slide,
        "Development: Vite on port 5173 proxies /api to Express on port 5000. With no MONGO_URI, the API boots an embedded MongoDB and seeds sample events.",
        0.7,
        5.1,
        12,
        1.2,
        16,
        False,
        MUTED,
    )
    footer(slide, 8, total)

    slide = new_slide(prs)
    rect(slide, 0, 0, 13.333, 0.12, CLAY)
    add_text(slide, "Collections", 0.7, 0.4, 8, 0.6, 36, True, INK, "Georgia")
    rows = [
        ("User", "Role, status, password hash"),
        ("Category", "Design, Trade, Campus…"),
        ("Event", "Draft → pending → approved"),
        ("TicketType", "Price, quantity, sold"),
        ("Booking", "Code, amount, check-in"),
        ("Session", "Speaker, hall, seats"),
        ("Booth", "Size, fixed price, decision"),
        ("Review", "One per guest, after the end"),
    ]
    for index, (name, copy) in enumerate(rows):
        col = index % 4
        row = index // 4
        x = 0.55 + col * 3.2
        y = 1.6 + row * 2.3
        rect(slide, x, y, 3.0, 1.9, CREAM)
        add_text(slide, name, x + 0.2, y + 0.35, 2.6, 0.5, 20, True, INK, "Georgia")
        add_text(slide, copy, x + 0.2, y + 1.0, 2.6, 0.6, 14, False, MUTED)
    footer(slide, 9, total)

    slide = new_slide(prs)
    rect(slide, 0, 0, 13.333, 0.12, CLAY)
    add_text(slide, "Two flows that matter", 0.7, 0.35, 10, 0.6, 34, True, INK, "Georgia")
    rect(slide, 0.6, 1.3, 6.0, 5.2, CREAM)
    rect(slide, 6.85, 1.3, 6.0, 5.2, CREAM)
    add_text(slide, "Approval", 0.9, 1.5, 5, 0.5, 24, True, INK, "Georgia")
    bullets(
        slide,
        [
            "Organizer saves a draft or submits.",
            "Admin sees it under Approvals.",
            "Approve puts it on the public site.",
            "Reject stores a note for the organizer.",
        ],
        0.9,
        2.2,
        5.4,
        3.8,
        16,
    )
    add_text(slide, "Booking", 7.15, 1.5, 5, 0.5, 24, True, INK, "Georgia")
    bullets(
        slide,
        [
            "Guest picks a pass and a quantity.",
            "Sold increases only if seats remain.",
            "A code and a demo reference are stored.",
            "Cancel before the start returns the seats.",
        ],
        7.15,
        2.2,
        5.4,
        3.8,
        16,
    )
    footer(slide, 10, total)

    slide = new_slide(prs)
    rect(slide, 0, 0, 13.333, 0.12, CLAY)
    add_text(slide, "Security choices", 0.7, 0.4, 10, 0.6, 36, True, INK, "Georgia")
    bullets(
        slide,
        [
            "Passwords are hashed with bcrypt. The hash is not sent to the browser and is not in the backup.",
            "Each sign-in returns a signed token. Protected routes require Authorization: Bearer.",
            "Role checks sit on the route. An organizer cannot approve their own event.",
            "An organizer can check in only the events they produced.",
            "Eight failed sign-ins on one email pause further attempts for ten minutes.",
            "A suspended account cannot sign in. An admin cannot suspend themselves.",
            "Demo checkout stores a reference such as DEMO-… and never a card number.",
        ],
        0.7,
        1.4,
        12,
        5.2,
        18,
    )
    footer(slide, 11, total)

    slide = new_slide(prs)
    rect(slide, 0, 0, 13.333, 0.12, CLAY)
    add_text(slide, "Suggested demo", 0.7, 0.35, 10, 0.55, 36, True, INK, "Georgia")
    steps = [
        ("1", "Public site", "Open Events. Campus Jazz Night is missing because it is still pending."),
        ("2", "Attendee", "Sign in as Bilal. Show the Karachi Design Week pass and the agenda."),
        ("3", "Organizer", "Sign in as Hamza. Open the booth queue and the draft Street Food Trail."),
        ("4", "Admin", "Sign in as Amina. Approve Jazz Night, then it appears on the public list."),
        ("5", "Door", "As Hamza, check in ES-KDW1-BILA. Try the same code again."),
    ]
    for index, (num, title, copy) in enumerate(steps):
        y = 1.15 + index * 1.05
        add_text(slide, num, 0.7, y, 0.6, 0.4, 22, True, CLAY, "Georgia")
        add_text(slide, title, 1.5, y, 2.4, 0.4, 20, True, INK, "Georgia")
        add_text(slide, copy, 4.1, y, 8.4, 0.7, 16, False, MUTED)
    footer(slide, 12, total)

    slide = new_slide(prs, INK)
    add_text(slide, "Sign-in for the viva", 0.7, 0.4, 10, 0.6, 36, True, CREAM, "Georgia")
    accounts = [
        ("Admin", "admin@eventsphere.com", "Admin@123"),
        ("Organizer", "organizer@eventsphere.com", "Organizer@123"),
        ("Exhibitor", "exhibitor@eventsphere.com", "Exhibitor@123"),
        ("Attendee", "attendee@eventsphere.com", "Attendee@123"),
    ]
    for index, (role, email, password) in enumerate(accounts):
        y = 1.4 + index * 1.15
        rect(slide, 0.7, y, 11.9, 1.0, RGBColor(0x2A, 0x26, 0x22))
        add_text(slide, role, 0.95, y + 0.25, 2.3, 0.5, 18, True, CLAY)
        add_text(slide, email, 3.4, y + 0.25, 5.2, 0.5, 18, False, CREAM)
        add_text(slide, password, 8.8, y + 0.25, 3.4, 0.5, 18, True, CREAM)
    add_text(slide, "Web  localhost:5173     API  localhost:5000/api/health", 0.7, 6.3, 12, 0.4, 14, False, RGBColor(0xC4, 0xB8, 0xA8))

    slide = new_slide(prs)
    rect(slide, 0, 0, 13.333, 0.12, CLAY)
    add_text(slide, "Close", 0.7, 0.45, 10, 0.7, 40, True, INK, "Georgia")
    add_text(
        slide,
        "EventSphere keeps the draft, the public program, the booth, the pass, and the door on one record.",
        0.7,
        1.5,
        11,
        1.2,
        24,
        False,
        INK,
        "Georgia",
    )
    bullets(
        slide,
        [
            "Next: a persistent MongoDB URI when the embedded database is not enough.",
            "Next: a camera at the door that reads the code already printed on the pass.",
            "Left out on purpose: a live card charge. The demo must not store card numbers.",
        ],
        0.7,
        3.1,
        11.5,
        2.8,
        18,
    )
    footer(slide, 14, total)

    shots = [
        ("home.png", "Public home"),
        ("events.png", "Event list"),
        ("detail.png", "Ticket booking"),
        ("dashboard.png", "Role dashboard"),
    ]
    present = [(IMAGES / name, caption) for name, caption in shots if (IMAGES / name).exists()]
    if present:
        slide = new_slide(prs)
        rect(slide, 0, 0, 13.333, 0.12, CLAY)
        add_text(slide, "Interface", 0.5, 0.25, 6, 0.45, 28, True, INK, "Georgia")
        for index, (path, caption) in enumerate(present[:4]):
            col = index % 2
            row = index // 2
            x = 0.45 + col * 6.45
            y = 0.9 + row * 3.15
            slide.shapes.add_picture(str(path), Inches(x), Inches(y), Inches(6.2), Inches(2.7))
            add_text(slide, caption, x, y + 2.7, 6, 0.3, 12, False, MUTED)

    out = Path(__file__).resolve().parent / "EventSphere.pptx"
    prs.save(out)
    print(out)


if __name__ == "__main__":
    build()
