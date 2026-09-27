---
resume: true
title: "Router Firmware Recovery Through Serial and Flash Access"
slug: "router-firmware-recovery-through-serial-and-flash-access"
summary: "Field notes from troubleshooting and recovering router firmware/storage failures, including EdgeRouter X serial console recovery, NAND/MTD corruption symptoms, bootloader access, and external flash recovery direction."
resumeSummary: >-
  Created a recovery reference for router failures involving corrupted firmware or storage, unstable configuration persistence, and incomplete boot behaviour. The procedure covers observing early symptoms, distinguishing reset behaviour from flash failure, accessing an EdgeRouter X through USB-TTL serial, using bootloader or failsafe paths, interpreting NAND and MTD bad-block signs, and deciding when external flash recovery is warranted. It prioritizes evidence before destructive recovery steps, preserving a path back to the device when ordinary web or SSH administration is no longer available.
category: "Hardware Recovery"
tags:
  - router
  - firmware
  - edgerouter-x
  - ubiquiti
  - openwrt
  - edgeos
  - usb-ttl
  - serial-console
  - nand
  - spi-flash
  - u-boot
  - hardware-recovery
date: "2026-07-23"
updated: "2026-07-25"
featured: true
published: true
seoTitle: "Router Firmware Recovery Through Serial and Flash Access"
seoDescription: "A practical note about router firmware recovery using USB-TTL serial access, bootloader recovery, NAND/MTD troubleshooting, EdgeRouter X recovery symptoms, and external flash recovery direction."
---

## Why This Note Exists

This note documents a real router recovery path where normal admin access was not enough.

The device was an EdgeRouter X that showed signs of firmware/storage corruption before becoming hard-bricked. The recovery process moved through several layers:

```txt
web UI / SSH
  ↓
firmware reinstall
  ↓
TFTP / recovery image
  ↓
USB-TTL serial console
  ↓
bootloader / U-Boot recovery
  ↓
external flash recovery direction
```

The useful part of this note is not just “flash firmware.” It is understanding how to diagnose a router when normal configuration changes do not persist and the device may have corrupted firmware, bad NAND blocks, broken bootloader state, or failed recovery attempts.

This is a low-level hardware and firmware troubleshooting note.

## Project Context

The router was an Ubiquiti EdgeRouter X.

The early symptoms were not a normal configuration mistake. The router could boot, but configuration changes did not survive reboot. Firmware and configuration behavior suggested a storage or firmware persistence problem.

Observed direction:

```txt
/config/config.boot resets to default after reboot
EdgeOS/OpenWrt changes do not persist properly
multiple firmware versions were tried
TFTP and SSH recovery were attempted
/config appeared mounted read-only in some context
```

One observed mount detail showed:

```txt
/opt/vyatta/config/active
```

as read-only through a union filesystem direction.

Later, the serial console showed NAND/MTD information and bad block messages. After a wrong flashing attempt, the router moved into a much worse state where normal console access stopped.

## What This Recovery Is Meant To Prove

- router failures are layered
- configuration reset after reboot can indicate storage or overlay problems
- firmware reinstall is not always enough
- USB-TTL serial access gives visibility below SSH/web UI
- bootloader access can allow lower-level recovery
- NAND/MTD bad blocks can explain unstable persistence
- flashing the wrong image can turn a soft brick into a hard brick
- when serial output disappears, recovery may require external flash access
- firmware recovery should be slow, verified, and documented

## Stack and Tools Used

### Device Layer

- Ubiquiti EdgeRouter X
- NAND/MTD storage direction
- bootloader / U-Boot direction
- EdgeOS
- OpenWrt recovery attempts

### Access Layer

- SSH
- TFTP recovery direction
- USB-TTL serial adapter
- PuTTY serial console
- 3.3V TTL serial wiring
- boot console / failsafe direction

### Recovery Layer

- firmware images
- bootloader environment
- TFTP server
- serial boot messages
- possible external SPI/NAND flash recovery direction
- CH341A/flashrom-style recovery direction if serial/bootloader is gone

## Intended Recovery Goal

The intended recovery goal was:

```txt
restore a bootable router
restore writable persistent configuration
recover or reflash valid firmware
avoid losing bootloader access
understand whether the issue is firmware, config partition, NAND, or bootloader
```

A good recovery process should preserve as much diagnostic information as possible before doing destructive writes.

## Early Symptom: Config Reverting After Reboot

The first important symptom was configuration not persisting.

Example behavior:

```txt
change router config
reboot
config returns to default
```

That suggests the problem may not be the UI or command being used.

Possible causes:

- `/config` partition not mounted correctly
- overlay/union filesystem issue
- firmware running from temporary recovery mode
- NAND/MTD corruption
- failed write persistence
- damaged or read-only configuration storage
- firmware mismatch or broken upgrade state

This symptom is stronger than “I forgot to save config.” It points to the storage/persistence layer.

## EdgeOS / OpenWrt Reset Behavior

The router behavior affected both EdgeOS/OpenWrt directions.

When different firmware paths still show persistence problems, the likely issue moves lower:

```txt
not just one config file
not just one web UI
not just one firmware version
possibly storage layout / NAND / boot state
```

That is why recovery needed to move below normal software-level troubleshooting.

## USB-TTL Serial Access

USB-TTL serial access is useful because it gives access to boot messages and sometimes the bootloader prompt.

A typical safe wiring direction:

```txt
USB-TTL TX → router RX
USB-TTL RX → router TX
USB-TTL GND → router GND
VCC       → do not connect unless specifically required
```

Important:

```txt
use 3.3V TTL
do not connect 5V power to the router serial header
```

Serial console settings direction:

```txt
baud rate: 115200
data bits: 8
parity: none
stop bits: 1
flow control: none
```

PuTTY or another serial terminal can be used on Windows.

## Why Serial Console Matters

SSH depends on the OS booting and networking working.

The serial console can show earlier boot stages:

- bootloader output
- kernel loading
- NAND/MTD messages
- filesystem errors
- failsafe prompts
- OpenWrt loader messages
- boot arguments
- recovery menu direction

This is why serial access is one of the most valuable router recovery tools.

It gives information even when Ethernet, web UI, or SSH are unavailable.

## OpenWrt Loader / Failsafe Direction

At one stage, the console showed an OpenWrt kernel loader/failsafe-style context.

The kind of message was:

```txt
OpenWrt kernel loader for MIPS based SoC...
Press the [f] key...
```

That indicates the router was still reaching a low-level boot path.

This is useful because it means:

```txt
bootloader/early boot was still alive
serial console was useful
firmware recovery was still possible
```

At that stage, recovery should focus on careful bootloader/failsafe handling rather than random firmware writes.

## NAND / MTD Bad Blocks

The serial console later showed NAND/MTD layout information and bad block messages.

Observed bad block direction included offsets like:

```txt
0x1ef80
0x1f380
```

Bad blocks in NAND are not automatically fatal because NAND systems can tolerate some bad blocks.

But in a router with persistent config failures, NAND/MTD messages become important evidence.

They can help explain:

- config partition instability
- firmware write failures
- boot failure
- inconsistent recovery behavior
- corruption after flashing attempts

The wording should be careful:

```txt
firmware/NAND contents corruption
```

is safer than claiming:

```txt
physically dead NAND chip
```

unless the chip itself was confirmed faulty.

## Correct Wording

A bad wording would be:

```txt
I flashed the NAND chip using USB-TTL.
```

That is usually not accurate.

USB-TTL provides serial console access. It does not directly program the NAND chip like a flash programmer.

Better wording:

```txt
I used a USB-TTL adapter to access the router's serial console and perform lower-level firmware recovery through the bootloader/recovery environment.
```

or:

```txt
The router showed firmware/NAND contents corruption, and recovery required serial-assisted bootloader access before the failure became hard-bricked.
```

If external programming is later used, that is a separate step:

```txt
external flash programmer / SPI or NAND recovery
```

## TFTP Recovery Direction

Bootloader-level recovery often uses TFTP.

A typical conceptual flow:

```txt
set router recovery IP
set TFTP server IP
load firmware image over TFTP
boot or flash the image
verify result
```

Example bootloader environment direction:

```txt
setenv ipaddr 192.168.1.1
setenv serverip 192.168.1.100
saveenv
tftpboot 0x81000000 <firmware-or-recovery-image>
```

The exact commands depend on the device, bootloader, image type, and recovery method.

The important rule:

```txt
do not flash random images to bootloader or firmware partitions without verifying what partition they belong to
```

## Flashing Risk

Flashing the wrong file can make the problem much worse.

This happened in the recovery path: after a wrong file was flashed, the router reached a harder-bricked state.

Symptoms later included:

```txt
no useful console output
no reset reaction
only power LED visible
other LEDs not flashing normally
USB-TTL showing no output
```

That is a different failure class.

Before that, the router was at least producing serial output and recovery information.

After that, the boot chain may not have been starting properly.

## Soft Brick vs Hard Brick

A useful distinction:

### Soft Brick

The router does not boot normally, but some recovery path still works.

Examples:

```txt
serial console output exists
bootloader prompt reachable
failsafe mode reachable
TFTP recovery reachable
LEDs show boot activity
```

### Hard Brick

The router appears dead at a lower level.

Examples:

```txt
no serial output
no bootloader prompt
no useful LED sequence
reset does nothing
Ethernet recovery unavailable
```

A soft brick can often be recovered through serial/TFTP.

A hard brick may require external flashing or hardware-level recovery.

## When Serial Output Disappears

If USB-TTL previously showed output but later shows nothing, check simple issues first:

- correct COM port
- correct baud rate
- TX/RX swapped correctly
- GND connected
- adapter is 3.3V TTL
- router powered separately
- header pins making contact
- PuTTY serial settings correct
- adapter detected by OS

If all of that is correct and there is still no output, the bootloader may not be running.

That is when the recovery direction moves toward:

```txt
external flash programmer
JTAG if available
replacing/reprogramming bootloader/flash contents
```

## External Flash Recovery Direction

When the bootloader is damaged or the router produces no serial output, USB-TTL alone may not be enough.

External recovery may require:

- identifying flash chip or storage layout
- using an external programmer
- reading the chip before writing
- saving multiple backups
- comparing dumps
- obtaining a known-good bootloader/firmware image
- writing carefully
- verifying the write
- reassembling and testing serial output again

This is more invasive and riskier than bootloader TFTP recovery.

It should be treated as last-resort recovery.

## SPI vs NAND Clarification

Routers can use different storage technologies.

Some recovery guides involve SPI NOR flash. Others involve NAND/MTD layouts.

The EdgeRouter X recovery discussion involved NAND/MTD-style messages and storage corruption symptoms.

The note title includes “flash access” broadly because the recovery concept is about low-level firmware storage.

A correct technical note should avoid pretending every router has the same flash layout.

The process should start by identifying:

```txt
device model
SoC
bootloader
flash type
partition layout
firmware image format
recovery method
```

## Diagnostic Checklist

Before flashing anything destructive:

### Confirm the Failure

- does the router boot?
- does SSH work?
- does web UI work?
- does config persist?
- does serial console output appear?
- do LEDs show boot activity?
- does reset/failsafe work?

### Check Storage Symptoms

- does `/config/config.boot` reset?
- is config mounted read-only?
- do firmware changes persist?
- do logs show NAND/MTD errors?
- are bad blocks reported?
- is the router running from recovery/RAM image?

### Check Serial Access

- correct USB-TTL adapter
- 3.3V TTL
- TX/RX crossed
- GND connected
- no VCC connected
- 115200 8N1
- correct COM port
- boot messages captured

### Check Recovery Path

- correct firmware image
- correct recovery image type
- correct TFTP server IP
- correct router IP
- correct bootloader commands
- backup before write where possible

## Recovery Evidence Worth Saving

During router recovery, useful evidence includes:

- boot log from serial console
- NAND/MTD layout messages
- bad block messages
- exact firmware image name
- commands typed in bootloader
- TFTP transfer output
- mount output
- config persistence test
- LED behavior
- screenshots/photos of wiring
- before/after boot behavior
- final recovery result

This matters because once the device is flashed, the previous state may be lost.

## Practical Recovery Flow

A safer flow:

```txt
1. Document symptoms.
2. Try normal config save/reboot test.
3. Check if firmware actually persists.
4. Access serial console through USB-TTL.
5. Capture full boot log.
6. Identify bootloader, partitions, and storage errors.
7. Try non-destructive boot/recovery first.
8. Use TFTP recovery only with correct image.
9. Avoid flashing bootloader partitions unless necessary.
10. If serial disappears, move to external flash recovery direction.
```

The most important rule is:

```txt
do not rush destructive writes
```

## EdgeRouter X Recovery Story

The EdgeRouter X case can be summarized like this:

```txt
The router first showed persistence problems: configuration changes and firmware state did not survive reboot reliably. Normal firmware recovery did not solve the issue. Serial console access through USB-TTL exposed lower-level boot behavior and NAND/MTD information, including bad block messages. This suggested the issue was below normal configuration management and likely involved firmware/storage corruption. After an incorrect flashing attempt, the device became hard-bricked: normal console output disappeared and only the power LED remained active. At that point, recovery moved beyond USB-TTL serial access toward external flash/JTAG-style recovery direction.
```

This is worth including because it shows layered troubleshooting and the difference between recoverable firmware corruption and a deeper brick.

## Common Mistakes

### Saying USB-TTL Flashes NAND Directly

USB-TTL gives serial console access.

It does not directly program the flash chip.

### Flashing The Wrong Image

Firmware images, recovery images, bootloader files, and partition images are not interchangeable.

### Ignoring Bad Block Messages

Some NAND bad blocks can be normal, but in context they matter.

### Assuming Reset Button Fixes Everything

If the bootloader or firmware storage is damaged, reset may do nothing useful.

### Not Saving Boot Logs

Boot logs are diagnostic evidence. Capture them before changing things.

### Connecting VCC On Serial Header

On many router serial headers, connect TX/RX/GND only. Do not power the board from the USB-TTL adapter unless the device documentation explicitly requires it.

## Practical Decisions

### Use precise wording

Say “firmware/NAND contents corruption” unless physical chip failure is confirmed.

### Keep USB-TTL and external flashing separate

Serial console recovery and chip programming are different recovery levels.

### Capture boot logs before flashing

Logs can explain the failure and guide the next step.

### Treat bootloader writes as dangerous

A bad firmware flash may be recoverable. A bad bootloader flash can remove serial/TFTP recovery.

### Preserve backups

If external flash access is used, read and save the current chip contents before writing anything.

### Document device-specific paths

Router recovery is model-specific. Do not assume commands from one device apply to another.

## What A Finished Recovery Note Should Show

A strong finished note should show:

- device model
- symptoms before brick
- normal recovery attempts
- serial wiring direction
- serial settings
- boot log evidence
- NAND/MTD bad block evidence
- recovery commands or direction
- flashing risk
- hard-brick symptoms
- when external flash recovery becomes necessary
- final lessons and wording corrections

## Evidence Worth Capturing

Useful evidence for this note would include:

- photo of EdgeRouter X serial header wiring
- USB-TTL adapter photo
- PuTTY serial settings
- bootloader output
- NAND/MTD bad block lines
- `/config/config.boot` persistence test
- mount output showing read-only config direction
- TFTP recovery screen/output
- LED behavior after failed flash
- external flash recovery setup if attempted
- final recovery state

## Technical Assumptions

This note assumes the router is owned by the operator and recovery is authorized.

It assumes the operator is working on local hardware, not bypassing access controls on someone else’s device.

It also assumes that firmware recovery commands are device-specific and should be verified against the exact model and image type before writing.

## Key Risks

- wrong voltage serial adapter
- connecting VCC incorrectly
- TX/RX wiring mistakes
- flashing the wrong image
- overwriting bootloader
- assuming NAND bad blocks always mean physical chip failure
- no backup before external write
- using commands from another router model
- treating OpenWrt, EdgeOS, recovery images, and bootloader images as interchangeable
- losing diagnostic logs before destructive recovery

## Current State

This note represents the router firmware recovery experience around the EdgeRouter X and broader serial/flash recovery workflow.

It turns the original “router brick” problem into a strong hardware-recovery story:

```txt
normal software troubleshooting
persistent config failure
serial console diagnostics
NAND/MTD evidence
bootloader recovery direction
hard-brick boundary
external flash recovery direction
```

That makes the note stronger than a generic firmware flashing post.

## What This Note Does Not Claim

This note does not claim the physical NAND chip was definitely dead.

It does not claim USB-TTL directly flashes NAND.

It does not provide a universal recovery method for every router.

It documents a practical recovery path and the reasoning used when a router moves from configuration failure to firmware/storage corruption and then to hard-brick territory.

## Practical Takeaway

The useful lesson is:

> A bricked router is not one failure state.

It can be:

```txt
bad config
broken firmware
read-only config storage
corrupted NAND/MTD contents
wrong recovery image
damaged bootloader
hard brick requiring external flash access
```

The recovery method depends on which layer still works.

If serial console works, use it carefully and capture evidence.

If serial console stops working after a bad flash, the recovery path moves beyond USB-TTL into external flash or board-level repair.

## Final Hardware Status

The current working conclusion is that the NOR flash chip is faulty and will likely need replacement.

At this stage, the router should be treated as a board-level repair case rather than a normal firmware recovery case. USB-TTL serial access and bootloader recovery are no longer enough if the flash chip itself cannot reliably store or provide the boot contents.

The next practical task, if this router is revisited later, is:

```txt
replace the faulty NOR flash chip
flash known-good boot/firmware contents
verify serial output returns
confirm the router boots consistently
test whether configuration persistence is restored
```

Until then, the recovery is considered paused at the hardware-replacement stage.
