# Automations — Concepts

The things people get wrong on their first day.

## An automation without permissions does not fail — it does nothing

This is the one to read first when *«my automation never does anything»*.

An automation acts while nobody is watching, so it **never borrows your permissions**. It can only
do the exact things you allowed it, one by one, in its **Permissions** tab — and by default it has
been allowed **nothing**. Until you allow a step, that step is refused when its turn comes: the run
ends there, the history says it *«tried to do something you have not allowed it to do»*, and
nothing on the list looks broken.

So a new automation, and every one the assistant drafts, and every one from the gallery, is born
**paused and with nothing allowed**. Turning it on is not enough; allowing what it needs is the
other half. If yours has never done a thing, open Permissions before anything else.

## The module itself needs a permission before its screen works

*Automations* is a module like any other, but it is the first one that **asks the hub for a
permission when it is installed**: the capability `manage_flows`. It is denied by default. After
installing, go to **Settings → Permissions** and grant it to *Automations*; until then the screen
says *«Automations has not been allowed…»* and stays closed. This is deliberate — the module can
create things that act on their own, and the hub wants a person to say yes to that once.

Two related facts that look like bugs and are not:

- **A hub with an image older than v1.1.0 refuses to install the module at all.** Older hubs do not
  know this capability, and a module that declares a capability the hub does not know is refused
  whole — the message says the module cannot be installed, not that a permission is missing. Update
  the hub first, then install.
- **Only an owner or an administrator can open the screen.** A shift session cannot decide what
  runs on its own in the name of the business.

## Steps run in one line, top to bottom — there are no forks

An automation is a **column**. Each step runs after the previous one, and *Only continue if…*
**stops the run** when its condition is not met — it does not take a second route. *«It stopped here
because this was not met: …»* in the history — naming what the condition checked — is the automation
**working**.

Two different outcomes means two automations, or one of the two patterns below that compose a
decision without a fork.

## «When something happens» is an event; «only continue if» is a state

The trigger is a moment: a sale was charged, a booking was made. It happens once and it is over.
A condition is a state: *the total is over 100 €* — true or false at the moment the step is
reached. Mixing the two is the classic mistake: *«when the stock is low»* is not an event this hub
fires. What you can write is *«when stock changes, look up the level, and only continue if it is
low»* — a trigger, a read, and a condition.

## Waiting counts from now, not from a date in the event

*Wait* pauses for an amount of time **after the previous step finished**. It cannot count
backwards from a date carried by the event: *«the day before the appointment»* is not something it
can work out yet. *«An hour after someone booked»* is.

## Looking something up returns one row or a number — never a list

*Look something up* performs one of this hub's reads and leaves the result for the next steps:
either **the first row it finds, field by field**, or **only how many there are**. In both cases
it also leaves `found` (yes/no) and `count`.

There is no *«all the rows»*: the values later steps read cannot walk a list, so a step that kept
one would leave behind something nobody could use. Zero rows is **not** a failure — the run carries
on with `found = false`, and the way to *«warn me IF there is low stock»* is a **read followed by a
condition on `found`**.

A read needs a permission like anything else (the same one the assistant needs to read the same
thing). And the read has to exist in this hub: a name this hub does not know is refused when you
save, not discovered at 3 AM.

## «Ask somebody first» pauses the run — and it always ends

The step writes a question into the tray and the run **parks** until a person answers. Three things
about it are decided by you, on the step, and not by the person answering:

- **Who is asked is a role, never a person.** People leave; roles stay. Whoever manages the hub can
  always answer, whatever role you named, so a question never gets stuck on a role with nobody in
  it.
- **It waits at most 30 days**, and you choose less. When the time runs out the automation does
  what you chose — counts it as a *no*, stops, or carries on — and the question is closed. There is
  no such thing as an approval waiting forever.
- **What a *no* means is yours to say**: stop the automation there (the default), or carry on.

**Carrying on** is how you branch without forks: choose *carry on* and add *Only continue if…* on
`steps.<id>.decision` right after — `approved`, `rejected` or `expired` — and each answer gets its
own line of steps.

The question is **fixed the moment it is asked**: its text is filled in from the event right then,
and editing the automation afterwards does not change a question already waiting in the tray. This
step needs **no permission** — asking a person is not doing anything; the step that acts after the
answer is the one that needs it.

## The assistant proposes; it does not act

An *Ask the assistant* step, by default, **asks you first**: what the model wants to do lands in the
tray as a proposal — the exact command and data — and nothing happens until a person approves it.
Approving runs **exactly what was proposed**, checking the permission at that moment; the model is
not consulted again. Switching a step to *act on its own* is a real decision: it means a model
writes to the business at 3 AM with nobody watching, and the form says so where the switch is.

The same rule applies to drafts. When you ask the assistant for an automation, it writes a
**draft**: not an automation, nothing that runs, with no permissions. You review it, create it —
still paused — allow what it needs, and turn it on.

## Secrets are write-only

Keys and passwords for other systems live in the **Secrets** box, encrypted. Once saved, a value can
**never be read back** — not by you, not by this screen, not by the assistant. Only a *Call another
system* step can use one, and only inside that step: writing a secret into a message or a prompt
is refused when you save. If you lose a value, you replace it; you do not recover it.

## A call is never made twice by mistake

A *Call another system* step can be retried — the hub restarted halfway, the other system did not
answer in time. Every try carries the same **repeat-protection key** in the standard
`Idempotency-Key` header, one per run and step, so Stripe and the systems that read it there do not
create the same order or payment twice. Some systems ask for that key somewhere else: Square inside
what you send (`idempotency_key`), PayPal in a `PayPal-Request-Id` header. **Insert the
repeat-protection key** next to the headers and the body puts the very same key there. Keep the rest
of what you send the same on every try: a time inserted into it changes on a retry, and the other
system may refuse the same key with different data. The key exists only inside this step, and the
button appears only on a hub that can fill it in: an older hub would refuse to save the automation.

## Messages go to a person the hub knows, never to a typed address

*Send a message* has **no box to type an address into**, and that absence is the guarantee. The
recipient is always a read of this hub and one of its columns — *the customer's phone on file* —
so an automation can never message whatever an event happened to carry. The channel and the
recipient are **two separate permissions**: allowing a reminder by email says nothing about paying
for it by WhatsApp, and allowing the channel says nothing about who is written to.

## «Try it» executes nothing — on purpose

There is no dry-run in the hub: *Run it now* runs for real, commands included. So **Try it** walks
the automation *here*, against the last real event of this business, mirroring what the hub would
do, and executes nothing. What it cannot know, it says: a value the hub keeps private, the output
of a step that has not run, the answer a person has not given. Being confidently wrong is the one
outcome that would make it worse than nothing.

## Every run has an id, and things that never happened land in one place

Each run has an id, and everything it did — the messages it queued, the events it emitted — is
tagged with it, so a line in another module's history can be traced back to the automation that
caused it. Copy the id from History when asking for help.

An event the hub could not deliver after retrying — because a permission was withdrawn while it
waited, or a system stayed down — ends in **Needs your attention** on the first screen. That is not
a log: it is a list of things that **did not happen**, each with *Send it again* or *Close it*. A
row that can never succeed (its permission was withdrawn) says so and offers only to close.
