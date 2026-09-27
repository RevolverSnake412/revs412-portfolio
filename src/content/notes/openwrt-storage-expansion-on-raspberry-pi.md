---
resume: false
title: "OpenWrt Storage Expansion on Raspberry Pi"
slug: "openwrt-storage-expansion-on-raspberry-pi"
summary: "Field notes from expanding OpenWrt storage on a Raspberry Pi so the router can safely support extra packages, logs, and small services without running into overlay space limits."
resumeSummary: >-
  Documented storage expansion for an OpenWrt installation on Raspberry Pi hardware so the router can support additional packages, logs, and small services without exhausting its writable overlay. The work covers storage checks, overlay-space constraints, what changes after expansion, what remains limited by hardware or memory, and how package and service placement should be planned. It turns a common hidden constraint into an operational decision, helping prevent upgrades and installs from failing because the device was treated like a full server.
category: "Networking"
tags:
  - openwrt
  - raspberry-pi
  - storage
  - overlay
  - sd-card
  - router
  - self-managed-infrastructure
date: "2026-07-06"
updated: "2026-07-25"
featured: false
published: true
seoTitle: "OpenWrt Storage Expansion on Raspberry Pi"
seoDescription: "A practical note about expanding OpenWrt storage on Raspberry Pi, checking overlay space, using SD card capacity, and managing the risks of running extra services on a router."
---

## Why This Note Exists

OpenWrt is usually designed to run from limited storage.

That is fine when the router only handles routing, DHCP, DNS, firewall rules, and a few packages. It becomes limiting when the device starts running extra tools and small services.

On a Raspberry Pi, the SD card gives much more physical storage than OpenWrt may use by default. Expanding the usable overlay makes the device more practical for packages, logs, Docker-related experiments, scripts, and local service files.

This note documents the practical reasoning behind expanding OpenWrt storage on a Raspberry Pi.

The goal is not to turn the router into a full server. The goal is to remove the tiny-overlay limitation while still respecting that the device is the network control point.

## Device Context

The setup is based on a Raspberry Pi running OpenWrt.

The router was used for more than basic routing, including:

- OpenWrt network control
- DNS filtering direction
- WireGuard remote access
- local scripts
- package installation
- small service experiments
- expanded overlay storage

After expansion, the device had a much larger usable storage area, with roughly tens of gigabytes available instead of the small default overlay.

The important point is that storage expansion made the device easier to work with, but also increased the need for discipline around backups and service placement.

## What This Setup Is Meant To Prove

- OpenWrt’s default writable space can be too small for a Raspberry Pi-based router
- SD card capacity should be used intentionally, not assumed to be available automatically
- expanding overlay storage makes package and service management easier
- more storage does not mean the router should run everything
- backups matter more after the router becomes more customized
- storage checks should be part of troubleshooting
- router stability is still more important than convenience

## Tools and Areas Used

### OpenWrt Layer

- SSH administration
- LuCI where useful
- package management
- overlay filesystem
- mount points
- service files
- logs
- configuration backups

### Raspberry Pi Layer

- SD card storage
- boot/root filesystem layout
- partition resizing direction
- storage reliability considerations
- power stability considerations

### Troubleshooting Layer

- `df -h`
- `mount`
- `block info`
- `logread`
- package installation checks
- service data path checks

## Intended Build

The intended result is an OpenWrt router where the writable overlay has enough space for practical maintenance and small service hosting.

A finished setup should allow:

- package installs without immediate space pressure
- logs and scripts stored safely
- service files placed in predictable paths
- enough free overlay space after updates
- router configuration backed up
- storage usage checked before adding services
- recovery path understood if the SD card or overlay fails

## Why Overlay Space Matters

OpenWrt separates read-only firmware content from writable changes.

The writable part is usually the overlay.

The overlay stores things like:

- installed packages
- changed configuration
- scripts
- service files
- some logs or state files
- application data if placed there

If overlay space fills up, problems can become strange:

- packages fail to install
- config changes fail
- services fail to write files
- updates fail
- logs cannot be written
- the router becomes harder to recover cleanly

Storage should be checked before assuming a service or package is broken.

## Basic Storage Checks

Useful checks:

```bash
df -h
```

```bash
mount
```

```bash
block info
```

The main things to look for:

- total overlay size
- free overlay space
- mounted partitions
- whether the expected SD card space is actually in use
- whether important paths are on the expanded storage

A healthy result should show the writable area using the intended expanded storage, not only the tiny default overlay.

## Practical Result

After expansion, the OpenWrt device had a much larger writable area available.

The useful result was:

```txt
overlay expanded to SD card capacity
roughly 50+ GB free after setup
enough room for packages, scripts, logs, and small service files
```

This changed the router from a constrained firmware-only device into a more usable self-managed infrastructure platform.

That said, the router still remained a router first.

## What Gets Easier After Expansion

Expanded storage helps with:

- installing extra OpenWrt packages
- keeping helper scripts
- storing service files
- running lightweight tools
- keeping logs during debugging
- experimenting without immediately hitting space limits
- maintaining local bot/service deployment files
- storing temporary troubleshooting output

It also reduces the chance of breaking something simply because OpenWrt ran out of writable space during package installation.

## What Does Not Change

Expanded storage does not automatically fix:

- CPU limits
- RAM limits
- SD card reliability
- power stability
- bad service configuration
- broken firewall rules
- DNS failure
- service crashes
- network design issues

It only solves the storage pressure problem.

A Raspberry Pi router with more storage is still a router, not a full replacement for a dedicated server.

## Storage and Service Placement

When running small services or scripts on the router, paths should be deliberate.

Useful path direction:

```txt
/opt/
  discord-bots/
  scripts/
  services/
```

or another clearly documented service path.

Avoid scattering files randomly across the filesystem.

For anything important, record:

```txt
service name
path
config file
data path
log path
restart command
backup target
```

This makes later troubleshooting easier.

## Package Installation Direction

Before installing packages, check available space.

```bash
df -h
```

Then install normally using the available package manager for the OpenWrt build.

After installing larger packages, check again.

```bash
df -h
```

This prevents slow storage creep from going unnoticed.

## Backup Direction

After expanding storage and customizing the router, backups become more important.

Minimum backup targets:

```txt
OpenWrt configuration backup
network/firewall/DHCP settings
WireGuard config
DNS/AdGuard direction
custom scripts
service files
important environment examples without secrets
notes about partition/overlay setup
```

A normal OpenWrt configuration backup may not include every custom file placed in `/opt` or other custom directories.

That means custom service paths should have their own backup plan.

## SD Card Risk

Using SD card storage is convenient, but SD cards can fail.

Risk factors:

- constant writes
- logs written too frequently
- Docker/container layers
- database writes
- poor power supply
- cheap or weak SD card
- sudden power loss

If the router depends heavily on SD card storage, failure can affect network availability.

Practical mitigation:

- use a decent SD card
- reduce unnecessary writes
- keep backups
- avoid heavy databases on the router
- move heavy services to Proxmox/VPS/mini PC
- keep the router’s critical functions simple

## Router Stability Rule

A useful rule:

> The router can run extra services, but those services should not make the router unreliable.

Expanded storage makes it tempting to install more tools and run more services.

That should be limited.

Good candidates for router-side tools:

- small scripts
- DNS filtering
- VPN
- lightweight monitoring
- small helper services

Bad candidates:

- heavy databases
- large Docker stacks
- high-write services
- experimental services that crash often
- anything that can fill disk space quickly
- anything that makes the router hard to reboot safely

## Troubleshooting Notes

### Package Install Fails

Check storage first:

```bash
df -h
```

Possible causes:

- overlay full
- package repo issue
- DNS issue
- network issue
- package architecture mismatch
- missing dependencies

Do not assume it is only a package problem.

### Service Cannot Write Files

Check:

```bash
df -h
```

```bash
mount
```

Possible causes:

- no free space
- wrong path
- read-only filesystem
- permission issue
- service user mismatch
- SD card problem

### Router Behaves Strangely After Adding Services

Possible causes:

- storage filling up
- RAM pressure
- CPU load
- service restart loop
- logs growing too much
- bad package/service interaction
- SD card I/O issue

Check:

```bash
df -h
```

```bash
free
```

```bash
top
```

```bash
logread
```

### Overlay Expansion Not Reflected

Possible causes:

- wrong partition resized
- overlay not mounted where expected
- fstab/mount config not applied
- reboot needed
- storage layout differs from expected image
- SD card image did not use full space automatically

Check mounted paths and partition visibility before making more changes.

## Practical Decisions

### Expand storage before adding many packages

It is better to solve storage limits early instead of fighting failures later.

### Keep router services light

More space should not turn the router into a general-purpose server for everything.

### Document custom paths

Files outside standard OpenWrt config paths can be forgotten during backup or migration.

### Check free space during debugging

Storage issues often look like package, service, or config problems.

### Keep backup outside the router

A backup stored only on the same SD card does not protect against SD failure.

## What A Finished Setup Should Show

A strong finished setup should show:

- expanded writable overlay
- enough free storage visible in `df -h`
- clear mount/partition layout
- custom service paths documented
- OpenWrt config backup saved
- important custom files backed up separately
- no heavy uncontrolled writes
- storage checks included in troubleshooting workflow
- router still stable after expansion
- optional services not interfering with routing/DNS/VPN

## Evidence Worth Capturing

Useful evidence for this note would include:

- `df -h` output after expansion
- `mount` output showing overlay path
- OpenWrt storage/LuCI screenshot
- partition layout screenshot or command output
- before/after storage comparison
- list of custom paths under `/opt`
- notes about SD card size/model
- backup location notes
- package install test after expansion

## Technical Assumptions

This setup assumes the OpenWrt device is a Raspberry Pi or similar board using SD card storage.

It assumes the user wants more writable space for packages, scripts, logs, and small services.

It also assumes router stability is more important than using every available gigabyte.

## Key Risks

- SD card failure affecting router availability
- too many services added after expansion
- logs filling storage over time
- custom files not included in backups
- assuming `df -h` free space means all paths are safe
- expanding storage without documenting what changed
- running heavy Docker workloads on the router
- power loss corrupting storage
- confusing storage problems with network problems

## Current State

This note represents the storage expansion direction for the Raspberry Pi OpenWrt router.

The main value is that the router gained enough writable space for practical maintenance, extra packages, scripts, and small services without constantly fighting the default overlay limit.

This connects directly to the notes about OpenWrt setup, AdGuard Home, WireGuard, messaging-service hosting, and Docker helper scripts.

## What This Note Does Not Claim

This note does not claim that every OpenWrt router needs expanded storage.

It does not claim that a Raspberry Pi router should replace a Proxmox server or VPS.

It does not claim that SD card storage is ideal for heavy services.

It is a practical field note about making an OpenWrt Raspberry Pi router less storage-constrained while keeping router stability in mind.

## Practical Takeaway

Expanding OpenWrt storage is useful, but it should be treated as infrastructure maintenance, not just extra space.

The useful parts are:

- checking actual overlay size
- using SD card capacity intentionally
- keeping enough free space
- documenting custom paths
- backing up configs and service files
- avoiding heavy write workloads
- keeping the router’s main job protected

That makes the device easier to maintain without turning it into an uncontrolled server.
