# Milestone Event Pages

Song requests, tips, printable signs and the pre-consult intake form for Milestone events. Static site on GitHub Pages, data in Firebase.

| File | Who sees it | What it does |
|---|---|---|
| `dashboard.html` | Owner | Live requests, history by night, insights, CSV export, Couples tab |
| `request.html` | Guests (via QR) | Search a song and send the request |
| `print.html` | Guests (printed) | Vertical sign: letter, 8x10, 5x7 or 4x6; requests + tips, requests only, or tips only |
| `display-milestone.html` | Guests (on a screen) | Branded landscape display with request and tip QRs |
| `intake.html` | Booked couples | Pre-consult form with a private link to edit any time |
| `index.html` | Owner | Links to everything |
| `config.js` | — | Firebase, EmailJS, Venmo and business details |
| `intake-schema.js` | — | Every intake field and add-on, in one place |

## Printing signs

Open `print.html` on the live site (not a local file, so the QR points at the right address). The box in the corner switches size, content and paper colour. Print at 100% scale with margins set to none. Add `?v=bar` (or any word) to tag requests from that sign, e.g. `print.html?size=5x7&v=bar`.

## How the data works

Requests are stored under their event night (6am to 6am, so a 12:30am request belongs to that night). Nothing is deleted; every night stays in History and can be exported. Intake records sit under an unguessable private token that is the couple's key to edit.

## Firebase setup

1. Realtime Database: create it in locked mode, then paste the rules you were given into the Rules tab and publish.
2. Project settings, Your apps: copy the web config into `config.js`.

## Email confirmations (optional)

The intake form can email couples their private link through EmailJS. Put the Service ID, Template ID and Public Key in the `EMAILJS` block of `config.js`. Template variables: `{{to_email}}`, `{{couple}}`, `{{action}}`, `{{wedding_date}}`, `{{link}}`, `{{dj_name}}`, `{{business}}`.
