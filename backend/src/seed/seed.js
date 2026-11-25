const fs = require("fs");
const path = require("path");
const {
  User,
  Category,
  Event,
  TicketType,
  Booking,
  Session,
  SessionRegistration,
  Booth,
  Review,
  Notification,
} = require("../models");

function at(days, hours = 10, minutes = 0) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hours, minutes, 0, 0);
  return date;
}

async function writeBackup() {
  const collections = {
    users: User,
    categories: Category,
    events: Event,
    tickets: TicketType,
    bookings: Booking,
    sessions: Session,
    sessionRegistrations: SessionRegistration,
    booths: Booth,
    reviews: Review,
    notifications: Notification,
  };
  const dump = { exportedAt: new Date().toISOString(), note: "Password hashes are excluded." };
  for (const [key, model] of Object.entries(collections)) {
    dump[key] = await model.find().select("-password").lean();
  }
  const dir = path.join(__dirname, "../../../docs/database");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "eventsphere-backup.json"), JSON.stringify(dump, null, 2));
}

async function makeEvent(payload, tickets) {
  const event = await Event.create(payload);
  const saved = [];
  for (const ticket of tickets) {
    saved.push(await TicketType.create({ sold: 0, ...ticket, event: event._id }));
  }
  return { event, tickets: saved };
}

async function seed({ force = false } = {}) {
  if (force) {
    await Promise.all(
      [User, Category, Event, TicketType, Booking, Session, SessionRegistration, Booth, Review, Notification].map((model) =>
        model.deleteMany({})
      )
    );
  } else if (await User.countDocuments()) {
    return { seeded: false };
  }

  const admin = await User.create({
    name: "Amina Shah",
    email: "admin@eventsphere.com",
    password: "Admin@123",
    role: "admin",
    phone: "0300-1112233",
    company: "EventSphere",
    bio: "Reviews new events and keeps the public program accurate.",
  });
  const hamza = await User.create({
    name: "Hamza Qureshi",
    email: "organizer@eventsphere.com",
    password: "Organizer@123",
    role: "organizer",
    phone: "0321-5550198",
    company: "Northline Events",
    bio: "Produces design weeks, expos, and founder summits.",
  });
  const hira = await User.create({
    name: "Hira Latif",
    email: "organizer2@eventsphere.com",
    password: "Organizer@123",
    role: "organizer",
    phone: "0333-4102288",
    company: "Fieldnote",
    bio: "Runs research forums and campus programs.",
  });
  const sara = await User.create({
    name: "Sara Iqbal",
    email: "exhibitor@eventsphere.com",
    password: "Exhibitor@123",
    role: "exhibitor",
    phone: "0345-7781200",
    company: "Loom & Co.",
    bio: "Shows handwoven textiles to trade buyers.",
  });
  const danish = await User.create({
    name: "Danish Ali",
    email: "exhibitor2@eventsphere.com",
    password: "Exhibitor@123",
    role: "exhibitor",
    phone: "0308-6621144",
    company: "Pixel Press",
    bio: "Independent print studio looking for fair floors.",
  });
  const bilal = await User.create({
    name: "Bilal Ahmed",
    email: "attendee@eventsphere.com",
    password: "Attendee@123",
    role: "attendee",
    phone: "0312-9004411",
    company: "",
    bio: "Goes for the talks, stays for the floor.",
  });
  const hania = await User.create({
    name: "Hania Raza",
    email: "attendee2@eventsphere.com",
    password: "Attendee@123",
    role: "attendee",
    phone: "0302-1187633",
    company: "Habib University",
  });

  const design = await Category.create({ name: "Design", description: "Exhibitions, critiques, and studio weeks." });
  const business = await Category.create({ name: "Business", description: "Summits for founders and operators." });
  const trade = await Category.create({ name: "Trade", description: "Expos and buyer-seller floors." });
  const campus = await Category.create({ name: "Campus", description: "Nights and gatherings for students." });
  const technology = await Category.create({ name: "Technology", description: "Forums for product and research teams." });

  const designWeek = await makeEvent(
    {
      code: "kdw",
      title: "Karachi Design Week",
      slug: "karachi-design-week",
      summary: "Four halls of studios, material talks, and a public critique.",
      description:
        "Karachi Design Week gathers independent studios, material suppliers, and students on one floor. Mornings are programmed talks. Afternoons are open for booth visits and portfolio reviews. The closing critique is free for anyone holding a ticket.",
      category: design._id,
      organizer: hamza._id,
      city: "Karachi",
      venue: "Expo Centre, Hall 2",
      startDate: at(18, 10),
      endDate: at(21, 18),
      capacity: 630,
      tone: "clay",
      highlights: ["40 studios", "Material library", "Closing critique"],
      status: "approved",
    },
    [
      { name: "General", price: 2000, quantity: 400 },
      { name: "Student", price: 800, quantity: 150 },
      { name: "Delegate", price: 9000, quantity: 80 },
    ]
  );

  const summit = await makeEvent(
    {
      code: "nfs",
      title: "North Founders Summit",
      slug: "north-founders-summit",
      summary: "A one-day working summit for operators who are already shipping.",
      description:
        "North Founders Summit is a small room on purpose. Speakers stay after their sessions, and the afternoon is office hours rather than a second keynote. Delegate passes include lunch with a named table host.",
      category: business._id,
      organizer: hamza._id,
      city: "Lahore",
      venue: "Alhamra Hall 3",
      startDate: at(40, 9),
      endDate: at(40, 18),
      capacity: 220,
      tone: "ink",
      highlights: ["Office hours", "Hosted lunch", "220 seats"],
      status: "approved",
    },
    [
      { name: "Operator", price: 7500, quantity: 180 },
      { name: "Table host", price: 18000, quantity: 40 },
    ]
  );

  const textile = await makeEvent(
    {
      code: "textile",
      title: "Textile Expo Pakistan",
      slug: "textile-expo-pakistan",
      summary: "Buyer meetings, mill tours on paper, and booths from loom to dye.",
      description:
        "Textile Expo Pakistan is a trade floor for mills, independent labels, and buyers. Booth sizes are fixed so a first-time exhibitor can price a stand without a sales call. Public tickets include the aisle; buyer meetings are booked inside each booth.",
      category: trade._id,
      organizer: hamza._id,
      city: "Karachi",
      venue: "Expo Centre, Halls 4–5",
      startDate: at(25, 11),
      endDate: at(28, 19),
      capacity: 1500,
      tone: "gold",
      highlights: ["Fixed booth sizes", "Buyer aisle", "Dye lab"],
      status: "approved",
    },
    [
      { name: "Visitor", price: 1500, quantity: 1000 },
      { name: "Buyer", price: 6000, quantity: 300 },
    ]
  );

  const jazz = await makeEvent(
    {
      code: "jazz",
      title: "Campus Jazz Night",
      slug: "campus-jazz-night",
      summary: "Two sets, one courtyard, and a student ensemble opening.",
      description:
        "Campus Jazz Night is waiting on approval. The program is an opening ensemble at dusk and a headline quartet after dark. Capacity is the courtyard, not the hall, so tickets stay limited.",
      category: campus._id,
      organizer: hamza._id,
      city: "Karachi",
      venue: "Arts Council Courtyard",
      startDate: at(7, 18),
      endDate: at(7, 22),
      capacity: 180,
      tone: "dusk",
      highlights: ["Student opener", "Headline quartet"],
      status: "pending",
    },
    [{ name: "Courtyard", price: 1200, quantity: 180 }]
  );

  const health = await makeEvent(
    {
      code: "health",
      title: "HealthTech Forum",
      slug: "healthtech-forum",
      summary: "Clinicians and product teams on the same timetable.",
      description:
        "HealthTech Forum pairs short clinical briefings with product demos. Sessions are capped so a demonstration does not turn into a lecture. The forum is produced by Fieldnote and approved for the public program.",
      category: technology._id,
      organizer: hira._id,
      city: "Islamabad",
      venue: "Jinnah Convention Centre",
      startDate: at(55, 9, 30),
      endDate: at(56, 17),
      capacity: 400,
      tone: "pine",
      highlights: ["Clinical briefings", "Capped demos"],
      status: "approved",
    },
    [
      { name: "Forum", price: 3500, quantity: 320 },
      { name: "Clinic lead", price: 8000, quantity: 80 },
    ]
  );

  const winter = await makeEvent(
    {
      code: "winter",
      title: "Winter Design Assembly",
      slug: "winter-design-assembly",
      summary: "Last season's assembly, kept on record with reviews.",
      description:
        "Winter Design Assembly has ended. The record stays public so attendees can leave a review and organizers can point to a completed program. Tickets are closed.",
      category: design._id,
      organizer: hamza._id,
      city: "Lahore",
      venue: "Tollinton Market",
      startDate: at(-22, 11),
      endDate: at(-20, 18),
      capacity: 260,
      tone: "clay",
      highlights: ["Portfolio tables", "Evening talk"],
      status: "completed",
    },
    [{ name: "Assembly", price: 1800, quantity: 260 }]
  );

  await makeEvent(
    {
      code: "trail",
      title: "Street Food Trail",
      slug: "street-food-trail",
      summary: "A draft night market that has not been submitted yet.",
      description:
        "Street Food Trail is still a draft. Stalls, the health permit, and the map are not ready for review. It stays off the public program until the organizer submits it.",
      category: campus._id,
      organizer: hamza._id,
      city: "Karachi",
      venue: "Frere Hall lawn",
      startDate: at(15, 16),
      endDate: at(15, 23),
      capacity: 300,
      tone: "gold",
      highlights: ["Night market"],
      status: "draft",
    },
    [{ name: "Entry", price: 500, quantity: 300 }]
  );

  const opening = await Session.create({
    event: designWeek.event._id,
    title: "Material, not mood boards",
    speaker: "Sana Jaffer",
    hall: "Talk room A",
    description: "How three studios specify cloth, timber, and clay before a drawing is pretty.",
    startTime: at(18, 11),
    endTime: at(18, 12),
    capacity: 80,
    registered: 1,
  });
  await Session.create({
    event: designWeek.event._id,
    title: "Public critique",
    speaker: "Hamza Qureshi",
    hall: "Hall 2 stage",
    description: "Six projects, eight minutes each, questions from the room.",
    startTime: at(21, 15),
    endTime: at(21, 17),
    capacity: 200,
    registered: 0,
  });
  await Session.create({
    event: summit.event._id,
    title: "Office hours",
    speaker: "Table hosts",
    hall: "Dining room",
    description: "Rotate once. Bring a real operating problem, not a pitch deck.",
    startTime: at(40, 14),
    endTime: at(40, 16),
    capacity: 40,
    registered: 0,
  });
  await Session.create({
    event: textile.event._id,
    title: "Dye lab walkthrough",
    speaker: "Loom & Co.",
    hall: "Lab bay",
    description: "A short look at natural dye lots currently on the booth.",
    startTime: at(26, 13),
    endTime: at(26, 13, 40),
    capacity: 25,
    registered: 0,
  });

  const bilalDesign = await Booking.create({
    user: bilal._id,
    event: designWeek.event._id,
    ticketType: designWeek.tickets[0]._id,
    quantity: 2,
    amount: 4000,
    paymentMethod: "card",
    paymentReference: "DEMO-KDW-BILAL",
    ticketCode: "ES-KDW1-BILA",
  });
  const haniaTextile = await Booking.create({
    user: hania._id,
    event: textile.event._id,
    ticketType: textile.tickets[1]._id,
    quantity: 1,
    amount: 6000,
    paymentMethod: "counter",
    paymentReference: "DEMO-TEX-HANIA",
    ticketCode: "ES-TEX1-HANI",
  });
  const bilalWinter = await Booking.create({
    user: bilal._id,
    event: winter.event._id,
    ticketType: winter.tickets[0]._id,
    quantity: 1,
    amount: 1800,
    paymentMethod: "card",
    paymentReference: "DEMO-WIN-BILAL",
    ticketCode: "ES-WIN1-BILA",
    checkedIn: true,
    checkedInAt: at(-22, 11, 20),
  });
  const haniaWinter = await Booking.create({
    user: hania._id,
    event: winter.event._id,
    ticketType: winter.tickets[0]._id,
    quantity: 1,
    amount: 1800,
    paymentMethod: "card",
    paymentReference: "DEMO-WIN-HANIA",
    ticketCode: "ES-WIN2-HANI",
    checkedIn: true,
    checkedInAt: at(-22, 11, 35),
  });

  await TicketType.updateOne({ _id: designWeek.tickets[0]._id }, { sold: 2 });
  await TicketType.updateOne({ _id: textile.tickets[1]._id }, { sold: 1 });
  await TicketType.updateOne({ _id: winter.tickets[0]._id }, { sold: 2 });
  await Booking.updateMany({ event: winter.event._id }, { createdAt: at(-30, 12) });

  await SessionRegistration.create({ session: opening._id, event: designWeek.event._id, user: bilal._id });

  await Booth.create({
    event: textile.event._id,
    exhibitor: sara._id,
    company: "Loom & Co.",
    size: "3x6",
    price: 80000,
    pitch: "Handloom cotton and a small natural-dye sample set for buyers.",
    status: "approved",
    note: "Aisle C, stand 14.",
  });
  await Booth.create({
    event: summit.event._id,
    exhibitor: sara._id,
    company: "Loom & Co.",
    size: "3x3",
    price: 45000,
    pitch: "A quiet stand for appointments, not a full collection.",
    status: "requested",
  });
  await Booth.create({
    event: textile.event._id,
    exhibitor: danish._id,
    company: "Pixel Press",
    size: "3x3",
    price: 45000,
    pitch: "Riso prints and a short binding demo.",
    status: "requested",
  });

  await Review.create({
    event: winter.event._id,
    user: bilal._id,
    rating: 5,
    comment: "The critique ran long in a good way. Easy to find the stage from the ticket note.",
  });
  await Review.create({
    event: winter.event._id,
    user: hania._id,
    rating: 4,
    comment: "Strong talks. The courtyard queue at entry needed a second scanner.",
  });

  await Notification.insertMany([
    {
      user: hamza._id,
      title: "Event awaiting approval",
      body: "Campus Jazz Night is in the review queue.",
      link: "/app/events",
    },
    {
      user: admin._id,
      title: "Event awaiting approval",
      body: "Campus Jazz Night was submitted by Hamza Qureshi.",
      link: "/app/approvals",
    },
    {
      user: hamza._id,
      title: "New booth request",
      body: "Pixel Press asked for a 3x3 booth at Textile Expo Pakistan.",
      link: "/app/booths",
    },
    {
      user: bilal._id,
      title: "Ticket confirmed",
      body: `2 × General for Karachi Design Week. Code ${bilalDesign.ticketCode}.`,
      link: "/app/bookings",
    },
  ]);

  await writeBackup();
  return {
    seeded: true,
    sample: {
      designBooking: bilalDesign.ticketCode,
      textileBooking: haniaTextile.ticketCode,
      winterBooking: bilalWinter.ticketCode,
      secondWinter: haniaWinter.ticketCode,
    },
  };
}

if (require.main === module) {
  require("dotenv").config({ path: path.join(__dirname, "../../.env") });
  const { connectDB } = require("../config/db");
  const force = process.argv.includes("--force");
  connectDB()
    .then(() => seed({ force }))
    .then((result) => {
      console.log(result.seeded ? "Sample data ready." : "Database already has users. Pass --force to reset.");
      process.exit(0);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { seed };
