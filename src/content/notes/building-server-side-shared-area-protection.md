---
title: "Building Server-Side Shared-Area Protection"
slug: "building-server-side-shared-area-protection"
summary: "Field notes from building a server-side extension that protects shared areas from unauthorized changes while preserving permitted user actions."
category: "Server-side Extensions"
tags:
  - server-side-extension
  - csharp
  - shared-area-protection
  - server-rules
  - anti-grief
  - debugging
date: "2026-07-08"
updated: "2026-07-25"
featured: true
published: true
seoTitle: "Building Server-Side Shared-Area Protection"
seoDescription: "A practical note about building a server-side extension that enforces shared-area protection, handles build errors, and accounts for operational edge cases."
---

## Why This Note Exists

This note documents a custom server-side extension built to protect shared areas in a multi-user service.

The goal was to prevent unrestricted modification of shared areas while preserving normal use of the service. The visible surface needed protection from abuse and accidental damage, while the lower working area remained available for ordinary activity.

The useful part of this project was not only writing C# code. It was translating a service behavior rule into a reliable server-side enforcement system.

## extension Context

The server used ExtensionRuntime.

The custom extension was created under the ExtensionRuntime source directory:

```txt
/home/opc/tml-arm/ExtensionRuntime/ExtensionSources/SurfaceProtection
```

The extension was built on the server using a command shaped like:

```bash
dotnet ExtensionRuntime.dll -build SurfaceProtection -tmlsavedirectory /home/opc/tml-arm/ExtensionRuntime
```

The exact server path can change, but the structure matters:

```txt
ExtensionRuntime/
  ExtensionSources/
    SurfaceProtection/
      SurfaceProtection.csproj
      Common/
        Systems/
        GlobalTiles/
        users/
```

The extension belonged to the same larger application server setup that involved ExtensionRuntime, ARM/Linux hosting, server configuration, extension building, and service behavior rule enforcement.

## What This extension Is Meant To Prove

- server rules can be enforced technically instead of relying only on trust
- server-side ExtensionRuntime logic needs careful object handling
- preventing griefing can create unexpected service behavior edge cases
- protected and permitted areas should be separated clearly
- a rule should be tested against normal service behavior, not only obvious cases
- custom extension development requires debugging both C# build errors and service behavior
- multiplayer server design is partly software design and partly service behavior design

## Stack and Tools Used

### service and extension development Layer

- application
- ExtensionRuntime
- C#
- ExtensionRuntime source structure
- object-level hooks
- object removal and placement logic
- user chat feedback

### Server Layer

- Linux VPS
- ARM/Ampere environment
- `.NET` runtime
- ExtensionRuntime build command
- server logs
- extension build output

### service behavior Rule Layer

- protected area
- permitted work area
- change restrictions
- object exception handling
- anti-grief behavior
- exploit testing

## Intended Build

The intended build was a server-side rule extension that prevents users from modifying a protected area while preserving permitted actions elsewhere.

A finished version should:

- block changes in the protected area
- block unauthorised object placement where required
- allow changes in the permitted work area
- warn users when an action is blocked
- avoid item duplication bugs
- avoid blocking normal use of the service
- behave consistently in multiplayer
- be easy to rebuild and redeploy after rule changes

## Original Rule Direction

The first rule direction was:

```txt
Protect the shared area from modification.
Allow changes in the permitted work area.
```

Earlier exceptions were considered for:

- selected dependent objects
- resource-bearing objects
- user-created markers

Later the rule became stricter:

```txt
Prevent all placement in the protected area.
Keep the permitted work area available.
```

That change matters because a looser rule system needs exception lists, while a stricter rule system needs fewer exceptions but can affect normal building behavior more.

## Protected-Area Definition

The most important design decision is how the extension defines the protected area.

A application service data has several layers, and the exact boundary depends on service data.

The rule needs a consistent check such as:

```txt
if cellY is inside the protected-area threshold:
    apply protection
else:
    allow normal behavior
```

A bad boundary definition can cause problems:

- objects near the boundary may be protected incorrectly
- permitted actions may be blocked
- adjacent areas may be affected unexpectedly
- service data size differences may shift the rule boundary
- users may find edge cases around the threshold

The boundary should be visible in code and easy to tune.

## Change-Interception Logic

The rule starts when the service intercepts an attempted change.

The extension needs to intercept object-removal attempts and decide:

```txt
Is this object in the protected area?
  yes → block the action
  no  → allow normal service behavior
```

The practical goal is not only to block the direct change. It also needs to prevent drops, side effects, and inconsistent client state.

The blocked action should feel clear to the user.

A warning message is useful:

```txt
[Server] This area is protected. Use the permitted work area instead.
```

## Object-Placement Logic

Object placement also matters.

If removal is blocked but placement is allowed, users can still alter the protected area with new objects.

A stricter surface protection rule should block placing too:

```txt
if user tries to place an object in the protected area:
    cancel placement
    show message
```

This prevents clutter and keeps the shared area consistent.

## Chat Warning Direction

The server should tell users why an action failed.

A silent block feels like lag or a bug.

The desired message style was a server-tagged warning, something like:

```txt
[Server] Surface editing is protected.
```

The visual goal was:

- `[Server]` tag
- readable color
- not too spammy
- visible enough to explain the rule

A useful final behavior should include rate limiting or cooldown logic so users are not spammed every tick while holding a tool.

## Build and Debugging Errors

Several build/runtime issues appeared during development.

### Missing Name or Type Errors

One issue involved a missing `SurfaceRules` name.

This usually means:

- wrong namespace
- class not created
- class not imported with `using`
- file not included in the project
- typo between class name and reference

Practical fix direction:

```txt
check namespace
check class name
check file path
check using statements
rebuild cleanly
```

### Invalid Operator Error

Another issue involved comparing a boolean with an integer:

```txt
bool > int
```

That usually happens when a property or method returns `true/false`, but the code treats it like a numeric value.

Practical fix direction:

```txt
read the ExtensionRuntime API return type
do not guess from older examples
compare booleans as booleans
compare integers as integers
```

### FNA3D Runtime Issue

An `FNA3D.so` issue appeared during the server/extension build path.

That belonged more to the Linux and ExtensionRuntime environment than the rule logic itself.

The lesson was:

```txt
extension code errors and runtime/native library errors are different problems
```

Do not debug C# rule code when the runtime cannot load a required native dependency.

### Drop Override Return Type

One build error was:

```txt
Drop(int, int, int) must return void
```

The overridden member expected `void`, but the extension code used the wrong return type.

This is a common ExtensionRuntime-version problem:

- examples from another version may use different signatures
- override methods must match exactly
- compiler errors are often the best API documentation during extension development

Practical fix direction:

```txt
match the exact method signature required by the installed ExtensionRuntime version
```

## Dependent-Object Edge Case

One important bug involved a dependent object: it was attached to a base terrain object, but the two were handled by separate change paths.

When the base-object interaction was blocked incorrectly, the dependent object could produce an item and then reappear. That created a repeatable duplication path.

That showed that protection is not only about the object the user directly targets. The data model can include:

- base objects and dependent objects
- objects with multiple occupied cells
- objects that trigger drops when a related object changes
- client-side visual state that must agree with server state

Blocking one change can still trigger side effects elsewhere. The rule therefore needs to test the complete relationship, not one object in isolation.

## Exploit Prevention

A protection extension must not create a new duplication path.

A good test should check:

- whether a blocked action changes a dependent object
- whether an item is created without the expected state change
- whether the same item can be created repeatedly
- whether server state matches client visuals
- whether repeated actions produce inconsistent results

The rule should prevent both:

```txt
unauthorised shared-area modification
and
unearned item drops
```

If a blocked action still creates drops, the protection is incomplete.

## Testing Checklist

A practical test pass should include:

### Protected-Area Changes

- try removing base objects
- try removing dependent objects
- try changing objects near the boundary
- try changing user-created objects
- try changing decorative objects

### Object Placement

- try placing ordinary objects
- try placing multi-cell objects
- try placing objects adjacent to protected objects

### Permitted-Area Behavior

- perform ordinary changes in the permitted area
- place and remove ordinary objects
- confirm normal service use still works

### Multiplayer Behavior

- test as normal user
- test as admin if admin bypass exists
- test repeated fast clicking
- test with multiple users nearby
- check server logs
- check client/server state mismatch

### Exploit Behavior

- test dependent objects
- test base-object changes
- test item drops
- test repeated blocked actions
- test multi-cell objects

## Practical Decisions

### Keep rules server-side

users should not be able to bypass the rule by changing their client.

### Keep permitted behavior normal

The server still needs progression. Blocking too much makes the service data feel broken.

### Block placing as well as breaking

If protection only stops removal, users can still alter the area through placement.

### Avoid too many exceptions

Every exception adds edge cases. A stricter rule is easier to reason about.

### Test dependent-object relationships

The service has dependent objects. Protecting one object can affect another.

### Show feedback to users

A blocked action should explain itself.

## What A Finished extension Should Show

A strong finished version should show:

- clean ExtensionRuntime project structure
- protected-area rule isolated in readable code
- break protection
- place protection
- permitted-area allowance
- user warning message
- no repeated chat spam
- no dependent-object duplication path
- successful build command
- server load confirmation
- multiplayer testing
- clear configuration points if the rule needs tuning

## Evidence Worth Capturing

Useful evidence for this note would include:

- extension repository screenshot
- `SurfaceProtection` source tree
- build command output
- successful extension build
- server loading the extension
- blocked protected-area change test
- permitted-area change test
- blocked protected-area placement test
- chat warning screenshot
- before/after dependent-object bug evidence
- final exploit fix test
- relevant error messages and fixes

## Technical Assumptions

This note assumes the extension runs in an ExtensionRuntime environment.

It assumes server-side enforcement is possible through the relevant object-level hooks available in the installed ExtensionRuntime version.

It assumes the protected-area rule is meant for a private or community service with a defined operational purpose.

## Key Risks

- wrong ExtensionRuntime API version
- override signatures copied from outdated examples
- protected-area threshold too strict or too loose
- blocking objects but still allowing drops
- client/server desync
- chat warning spam
- accidentally blocking permitted service use
- allowing unwanted placement while blocking only removal
- fragile exception lists
- testing only one object type and missing dependent-object behavior

## Current State

This note represents the custom Surface Protection extension direction.

The most important lesson was that a simple rule — “protect this area” — becomes more complex when translated into the service’s object model.

The real work was not only blocking an action. It was making sure the blocked action did not create side effects, exploits, or confusing user behavior.

## What This Note Does Not Claim

This note does not claim the extension is a general anti-cheat system.

It does not claim to solve every possible griefing method.

It does not claim to be a polished public ExtensionRuntime release.

It documents a practical custom server extension built for a specific multi-user service rule.

## Practical Takeaway

The useful takeaway is:

> A server rule is only reliable when it is enforced in code, tested against edge cases, and checked for side effects.

For this extension, the important parts were:

- define the protected area clearly
- block unauthorised removal
- block unauthorised placement
- preserve permitted actions elsewhere
- warn users clearly
- match the installed ExtensionRuntime API
- test dependent-object relationships
- prevent item drop exploits

That makes it a real service behavior-systems note, not just a small C# extension.
