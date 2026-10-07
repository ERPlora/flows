# Automations — Screens

The module contributes one tab to the hub navigation: **Automations**. Only an **owner or an
administrator** can open it — an automation acts in the name of the business while nobody is
watching, so deciding what it may do is not something a shift session can approve.

Before the screen works at all, the hub has to allow the module itself: after installing it, go to
**Settings → Permissions** and grant `manage_flows` to *Automations*. Until then the screen says so
and offers nothing else (see [concepts.md](concepts.md)).

## The Automations screen

The first screen has four parts, top to bottom:

| Part | What it is |
|---|---|
| **Needs your attention** | Events that never got delivered. Each row says what it was and where it came from, with **Send it again** and **Close it**. Only shown when there is something in it. |
| **Waiting for you** | The approval tray: questions asked by an automation, and changes the assistant proposed. Only shown when there is something in it. |
| **Proposed by the assistant** | Drafts the assistant wrote after you asked it for an automation (for example, *«when someone books online, remind me to call them»*). **Review** opens one; **Discard** throws it away. A draft is not an automation: it runs nothing until you create it. |
| **Your automations** | The list. Search by name, by what starts it or by what it does; filter by trigger and by *Only the paused ones*; select several and **Turn them on** / **Pause them**. Each row shows whether it is running or **Paused**, and its last run. |

When there is nothing yet, the screen shows the **gallery**: ready-made automations grouped by
sector (any business, hair and beauty, bars and restaurants). Read the sentence under each card —
that is exactly what it will do — and press **Use this one**. It becomes yours, **created paused**,
with the blanks it asked you to decide (an amount, a time, how long to wait) already holding a
sensible guess. A card that needs a module this hub does not have is **left out**, and one line
under the cards names what to install — *Some automations are hidden: they need the Tasks module* —
so the card comes back once it is installed and this screen is reloaded.

Another screen can send you straight to one of these cards: a link that carries `?template=<id>`
opens that card and brings it into view, so you do not have to find it among a dozen. That is how
**Settings → WhatsApp → Book appointments → Set it up** gets here. It only opens the card — turning
the automation on is still yours to do. A link naming a card this hub does not offer, or naming
nothing at all, simply shows the gallery.

**New automation** starts from an empty one. **How does this work?** opens the built-in guide.

## Inside an automation

An automation is **one column of steps, top to bottom** — no forks, no second route. There are
four tabs: **Steps**, **Try it**, **Permissions** and **History**. The switch at the top turns it
on or pauses it; **Save** writes it; **Run it now** starts it by hand; **Delete** asks for
confirmation and cannot be undone.

### Steps

The first card is the trigger — *when it starts*:

| Trigger | Means |
|---|---|
| **Something happens** | An event of this hub, chosen from the list of events this hub actually fires. Optionally with a filter on the event's own fields. |
| **Every day, at a time** | A daily schedule, drawn as a clock. |
| **Once, at a date and time** | A single run in the future. |
| **Only by hand** | Nothing starts it but the **Run it now** button. This is the default. |

Under the trigger, the steps run in order. The buttons at the bottom add one; the handle on each
card reorders them by dragging; the × removes one. Tap a card to open its form.

| Button | Step | What the form asks |
|---|---|---|
| **Do something** | `command` | *What to run* — the name of a command of this hub (for example `tasks.tasks.create`) — and *With this information*: the fields it needs, each composed of text and pills picked from the event. |
| **Look something up** | `query` | *What to look up* — the name of a read of this hub — and its parameters; *What to keep* (**the first row it finds, field by field**, or **only how many there are**); *At most this many rows* (1–200). The form says what the next steps can use out of it. Looking something up changes nothing. |
| **Only continue if…** | `condition` | One or more comparisons on a field (*equals*, *is not*, *is one of*, *exists*, *contains*, *greater than*…). If they do not hold, the automation **stops here** — that is not a fault. |
| **Ask somebody first** | `approval` | *The question* somebody has to answer, optional details, *Who has to answer* (a **role**, or whoever manages the hub), *How long to wait for an answer* (up to 30 days), *If they say no* and *If nobody answers in time*. |
| **Wait** | `delay` | An amount and a unit (minutes, hours, days), counted from the moment the previous step finished. Drawn as a label on the line, not as a card. |
| **Send a message** | `notify` | The channel (email or WhatsApp — WhatsApp costs money every time), *who it goes to* — always a read of this hub and one of its columns, **never a typed address** — the template, and the text. |
| **Call another system** | `http` | Method, address, headers, body and timeout. Secrets (keys and passwords) are inserted from the box next to the value; they are stored encrypted, **write-only**, and can only be used inside this step. |
| **Ask the assistant** | `ai` | The prompt, what it may read and what it may run, and whether it **asks you first** (default) or acts on its own. |

Wherever a value can come from the event, the field picker offers **the real fields of this hub's
events with a real example beside each** — you pick *Total of the sale — 42.50 €*, never a path.
Braces never appear on screen. A field whose example the hub keeps private is still offered, and
says why the example is missing.

### Try it

Walks the automation against something that **really happened** in this business — the last real
event of the kind that starts it — and shows, step by step, what it **would** do. Nothing here is
real: no message is sent, nothing is charged, nothing is written down, no request is made.

What it points at:

- a value that **would arrive empty** (a field the event does not carry);
- a condition that **would stop it here** — shown as the automation working, not failing;
- a condition it **cannot judge**, because it reads a private example or the output of an earlier
  step that has not run;
- an **Ask somebody first** step, where it says the run *waits here* and refuses to answer on
  anybody's behalf — all three outcomes are still possible;
- a step that **would be refused** because a permission is missing.

### Permissions

An automation runs with **its own** permissions, never with yours. This tab lists what it needs,
read out of the steps themselves so you never type a name twice: each command it runs, each read
it performs, each message channel and recipient, each outside address (as a pattern). Each row is
**Waiting for your permission** or **Allowed**; **Allow everything it needs** grants the lot,
**Withdraw** takes one back.

**Until you allow something, the automation does nothing at all — and it will not complain.** If
yours has never done a thing, look here first. An *Ask somebody first* step needs no permission:
asking a person is not doing anything.

The **Secrets** box lives on this tab too: a name and a value. Once saved, a value can never be read
back — not by you, not by this screen — only used by a *Call another system* step.

### History

Every time the automation woke up there is a line with the day and the hour, its outcome, and
underneath it, in words, what each step did: *Ran `tasks.tasks.create`*, *Found 3*, *Found nothing,
and carried on*, *Somebody said yes*, *Nobody answered in time*, *Waiting for somebody to answer*,
*WhatsApp message queued to send*. A condition that stopped the run names what it was checking, with
the field as the editor shows it: *It stopped here because this was not met: Reachable on whatsapp ›
Phone is international: equal to yes*. A condition with several comparisons names them all, because
the hub does not record which one failed; if that step is no longer in the automation, the line falls
back to *The condition was not met, so it stopped here*. A message
that had nothing to offer — a list of free slots that came back empty — is not sent, and the line
says so: *There was nothing to offer (the list was empty), so the message was not sent*. A failed step shows the reason, which is the only
actionable thing on the screen. Each run has an id you can copy for support.

## The approval tray

**Waiting for you**, on the first screen, holds two kinds of thing in one list:

- **A question** from an *Ask somebody first* step: the title and details as they were asked, who
  was asked (a role — *whoever manages the hub can answer too*), what happens if nobody answers by
  the deadline, and what a *No* means for the automation.
- **A proposal** from an *Ask the assistant* step: the command it wants to run and its data,
  verbatim, and the reason it gave.

Under each one there is room for an optional note. **Approve** or **No** decides it and takes it
off the list; the note travels with the decision and shows in the run's history. If the hub
refuses — it already expired, somebody else already answered, or **it was asked of another role
and you cannot answer it** — the row stays and the reason is said in words.

The tray refreshes on its own when a new question arrives or one expires; the badge on the section
counts what is waiting.
