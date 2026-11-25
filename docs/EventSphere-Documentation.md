# EventSphere Management — Project Documentation

## 1. Introduction

EventSphere is an event operations platform for expos, founder summits, campus nights, and trade floors. It replaces a shared spreadsheet with one record for the program, the booth plan, the ticket, and the door.

The system is built on the MERN stack: MongoDB, Express, React, and Node.js. The interface is a React application written in TypeScript. The API is Express with JSON Web Tokens.

## 2. Objectives

- Let an organizer prepare an event and submit it for review.
- Let an administrator decide what appears on the public program.
- Let an exhibitor request a booth at a published price.
- Let an attendee buy a pass, build a session agenda, and carry a check-in code.
- Keep payments in demo mode so no card number is stored.

## 3. Users

| User | Responsibility |
| --- | --- |
| Admin | Approves events, manages categories and people, can check any ticket in |
| Organizer | Creates events, sessions, and decides booth requests for their own events |
| Exhibitor | Requests a booth and can also buy a ticket |
| Attendee | Books tickets, saves sessions, writes a review after the event |

Public registration accepts attendee, organizer, and exhibitor. The admin account is created by the seed and cannot be chosen on the sign-up form.

## 4. Modules

1. **Authentication.** Register, sign in, profile, password change, and account suspension.
2. **Categories.** Admin-managed labels used by events.
3. **Events.** Draft, submit, approve, reject, edit, and delete unpublished events.
4. **Tickets.** Named passes with a price, a quantity, and a sold count.
5. **Bookings.** Demo card or counter payment, cancellation before start, ticket code, QR mark.
6. **Sessions.** Program items inside the event dates, with a seat cap.
7. **Agenda.** Ticket holders save and leave sessions.
8. **Booths.** Fixed sizes and prices, request, approve, or decline.
9. **Check-in.** Door staff enter a ticket code. Organizers only see their own events.
10. **Reviews.** One review per ticket holder after the event ends. An admin can remove one.
11. **Notices.** In-app messages for approvals, bookings, and booth decisions.
12. **Dashboard.** Counts and a category chart for the signed-in role.

## 5. Main flows

**Publish an event.** The organizer saves a draft or submits it. Status becomes `pending`. An admin approves or rejects it. Only `approved` and `completed` events are public. Booking is allowed only while the event is `approved` and has not ended.

**Book a pass.** The attendee picks a ticket and a quantity from 1 to 10. The API increments `sold` only when enough seats remain, then writes the booking. If saving the booking fails, the sold count is returned. Cancelling before the start date returns the seats.

**Check in.** Staff enter the code, for example `ES-KDW1-BILA`. A second attempt reports the earlier check-in time.

**Request a booth.** An exhibitor chooses an approved event and a size. Prices are `3x3` PKR 45,000, `3x6` PKR 80,000, and `6x6` PKR 140,000. The organizer or an admin approves or declines.

## 6. Data collections

- **User** — name, email, password hash, role, phone, company, bio, status
- **Category** — name, description
- **Event** — title, summary, description, category, organizer, city, venue, dates, capacity, tone, highlights, status, review note
- **TicketType** — event, name, price, quantity, sold
- **Booking** — user, event, ticket, quantity, amount, status, payment method, payment reference, ticket code, check-in time
- **Session** — event, title, speaker, hall, times, capacity, registered
- **SessionRegistration** — session, event, user (one row per person per session)
- **Booth** — event, exhibitor, company, size, price, pitch, status, note
- **Review** — event, user, rating, comment (one review per person per event)
- **Notification** — user, title, body, link, read

Passwords are hashed with bcrypt and are not included in the JSON backup.

## 7. Security

- Passwords are hashed with bcrypt before they are stored.
- The API issues a signed JWT. The browser stores it and sends `Authorization: Bearer`.
- Routes check the role. Organizers cannot approve their own event or check in another organizer's ticket.
- Sign-in locks an email for a short time after repeated failures.
- Suspended users cannot sign in.
- Demo payment stores a reference, never a card number.
- Public event queries escape search text before it is used as a regular expression.

## 8. Non-functional notes

- The public site and the dashboards work on a narrow phone width and on a desktop width.
- Buttons and inputs have visible focus.
- Motion is removed when the visitor has asked the system for reduced motion.
- The first launch without MongoDB uses an embedded database so the project can be demonstrated on a machine that does not have MongoDB installed.

## 9. Sample data

The seed creates categories (Design, Business, Trade, Campus, Technology) and events in Karachi, Lahore, and Islamabad, including:

- Karachi Design Week — approved, with sessions and a booking
- Textile Expo Pakistan — approved, with an approved booth and a waiting booth
- Campus Jazz Night — waiting for admin approval
- Street Food Trail — still a draft
- Winter Design Assembly — completed, with check-ins and reviews

A known ticket code for the door demo is `ES-KDW1-BILA` (not yet checked in) and `ES-WIN1-BILA` (already checked in).

## 10. Credentials

See `docs/CREDENTIALS.txt` and the table in the root `README.md`.

## 11. How to run

```powershell
npm run setup
npm run dev
```

Web: http://localhost:5173  
API health: http://localhost:5000/api/health

## 12. Test cases

| ID | Case | Steps | Expected result |
| --- | --- | --- | --- |
| T1 | Attendee sign-in | Open Sign in, use attendee@eventsphere.com / Attendee@123 | Dashboard shows upcoming tickets |
| T2 | Bad password | Sign in with a wrong password | Message says the email or password is incorrect |
| T3 | Public list | Open Events with no account | Approved and completed events show. Jazz Night and the draft do not |
| T4 | Book | Sign in as attendee, open Karachi Design Week, confirm a General pass | A ticket code and QR mark appear |
| T5 | Sold out guard | Request more tickets than remain | API refuses and does not increase sold |
| T6 | Cancel | Cancel that new booking before the event starts | Status becomes cancelled and seats return |
| T7 | Session | From the same event, save a seat | Agenda lists the session. Saving twice is refused |
| T8 | Review too early | Try to review Karachi Design Week | Refused because the event has not ended |
| T9 | Review | Sign in as attendee and open Winter Design Assembly | A review form is not offered again; two reviews are already posted |
| T10 | Organizer draft | Sign in as organizer, create an event, leave it unpublished | It is listed as Draft and is absent from the public site |
| T11 | Submit | Submit Campus Jazz Night's sibling, or the new event, for approval | Admin Approvals shows it |
| T12 | Approve | Sign in as admin and approve it | The organizer is notified and the event is public |
| T13 | Reject path | Reject a pending event with a note | Organizer sees the note |
| T14 | Booth request | Sign in as exhibitor and request a 3×3 on an approved event | Organizer Booths shows Requested |
| T15 | Booth decision | Organizer approves it | Exhibitor sees Approved and the price from the size table |
| T16 | Check-in | Organizer enters ES-KDW1-BILA | Bilal Ahmed is checked in. A second try reports the time |
| T17 | Wrong door | Organizer 2 tries the same code | Refused, because the event belongs to Northline |
| T18 | Suspend | Admin suspends an exhibitor | That account can no longer sign in |
| T19 | Category guard | Admin deletes Design | Refused because events use it |
| T20 | Own account | Admin tries to suspend Amina Shah | Refused |

## 13. Limits

- Checkout is a demonstration. It is not connected to a bank.
- The embedded database forgets data when the API stops. Use `MONGO_URI` for a real MongoDB database.
- The QR mark encodes the ticket code so it can be shown on the pass. The door in this version is the check-in form, not a camera scanner.
