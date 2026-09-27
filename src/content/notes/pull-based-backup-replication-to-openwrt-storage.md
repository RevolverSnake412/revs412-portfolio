---
resume: true
title: "Pull-Based Backup Replication to OpenWrt Storage"
slug: "pull-based-backup-replication-to-openwrt-storage"
summary: "Designed and verified a pull-based backup replication path from a VPS-hosted stateful service to an OpenWrt Raspberry Pi with dedicated external storage, separating fast recovery points from an independently retained local archive."
resumeSummary: >-
  Designed and verified a pull-based recovery workflow for a VPS-hosted stateful service, replicating completed backups to an OpenWrt Raspberry Pi with dedicated external storage. Used a restricted SSH identity and rsync so the local system can read only the intended backup artifacts, resume interrupted transfers, and apply retention only after a successful sync. The recovery set includes service state, configuration, and authentication data, creating a practical second storage boundary beyond the VPS.
category: "Infrastructure Operations"
tags:
  - backup-recovery
  - disaster-recovery
  - openwrt
  - raspberry-pi
  - rsync
  - ssh
  - external-storage
  - vps
  - self-managed-infrastructure
date: "2026-08-22"
updated: "2026-08-24"
featured: true
published: true
seoTitle: "Pull-Based Backup Replication to OpenWrt Storage"
seoDescription: "A practical backup design that replicates VPS backups to OpenWrt external storage through restricted SSH and rsync, with independent retention and recovery verification."
---

## Why This Note Exists

Backups stored only on the same VPS are useful, but they do not protect against losing the VPS, its storage, or access to the account that hosts it.

This note documents a second recovery layer for a stateful service: completed backups remain available on the VPS for quick rollback, while an OpenWrt Raspberry Pi pulls completed backup artifacts to a dedicated external drive. The two locations have separate retention windows and separate failure modes.

The important design choice is that the local device pulls from the VPS. The home network does not accept inbound access, and the VPS cannot initiate a connection into the local network.

## Design Goals

The system was designed to provide:

- fast recovery points on the VPS
- a separately retained local copy on physical storage
- no public SSH or port forwarding into the home network
- a local identity that cannot modify the VPS
- safe handling of interrupted transfers
- retention that never deletes healthy copies after a failed sync
- recovery material beyond the primary data directory

This is not a claim that one device eliminates every risk. A local external drive still shares the same physical site as the router. It does, however, provide a separate storage and access boundary from the VPS.

## Architecture

```text
VPS-hosted stateful service
        |
        | creates completed backup archives
        v
VPS backup repository
        |
        | restricted SSH identity + rsync
        | initiated by the local device
        v
OpenWrt Raspberry Pi
        |
        v
Dedicated external ext4 storage
```

The external drive is mounted separately from the OpenWrt system storage. That avoids treating the router’s boot media as a backup target and gives the archive its own capacity, filesystem, and replacement path.

## What Is Preserved

A useful recovery set has to include more than the active data directory.

The replicated backup artifacts cover the stateful service data together with the operational material required to restore it coherently:

- primary service or world state
- server and service configuration
- access-control and identity data
- allowlists, operator or policy files where applicable
- extension and integration configuration
- settings required to reproduce the running service

The point is to recover a working system, not only a partial data folder that still needs important configuration reconstructed from memory.

## Pull-Based Access Model

The OpenWrt device initiates every transfer.

Its SSH identity is restricted to the backup source. It cannot open an interactive shell, alter the service, browse unrelated VPS files, or write back to the remote host. The remote side exposes a fixed backup path through a controlled sender command.

That creates a useful boundary:

```text
OpenWrt can read completed backup artifacts
OpenWrt cannot administer the VPS
VPS cannot initiate access to the home network
```

This is safer and simpler than exposing a router service to the internet only so the VPS can push files inward.

## Synchronization Behaviour

The Pi checks the backup repository on a schedule and synchronizes only completed artifacts.

`rsync` is used because it handles the operational cases that matter here:

- new archives are copied without recopying existing ones
- interrupted transfers can resume safely
- changed completed artifacts can be refreshed
- the local archive can catch up after temporary network loss
- transfer output can be logged for inspection

The job uses a lock so an unusually slow transfer cannot overlap with the next scheduled run.

## Independent Retention

Retention is deliberately independent at each layer.

The VPS keeps a short rolling set for immediate rollback. The local external drive keeps its own rolling archive, so it does not lose older recovery points merely because the VPS rotates its short window.

The retention step runs only after a successful synchronization. If the connection, storage, or transfer fails, the job exits before deleting older local copies. That ordering prevents a failed backup run from becoming a destructive cleanup event.

The exact copy count is a capacity and recovery-window decision, not a magic number. It should be reviewed when backup size, change rate, available storage, or the acceptable recovery point changes.

## Storage Decisions

The local target is a dedicated 2.5-inch external hard drive formatted as ext4 and mounted on the OpenWrt Raspberry Pi.

This was intentional:

- router boot media is not treated as archival storage
- a separate drive can be replaced without rebuilding the router
- ext4 gives predictable Linux permissions and filesystem behaviour
- the drive has enough capacity for a meaningful retention window
- Windows can be kept read-only when inspecting the disk, avoiding accidental initialization or filesystem damage

The drive is mounted automatically at boot, and the backup job uses the stable mount rather than an assumed device name.

## Verification

The design was verified with real backup artifacts rather than only a successful-looking configuration file.

Checks included:

- confirming the external drive separately from the OpenWrt system disk before formatting it
- confirming the filesystem mount and available capacity
- proving the restricted account could access only the intended backup tree
- completing an initial mirror to the external drive
- verifying that service state, authentication data, and configuration were included
- testing a restore path from the backup system
- confirming that retention references were present after scheduled backups

## Operational Lessons

The most important result is the separation of responsibilities:

```text
VPS: creates fast recovery points
OpenWrt Pi: pulls a separate archive without inbound exposure
External drive: holds the retained local recovery set
```

That division makes failure handling more deliberate. A service mistake can be rolled back quickly from the VPS. A VPS-level loss still leaves an independently stored copy. A router or drive issue can be repaired without granting it broad control over the production server.

The work is a good example of infrastructure reliability being defined by access boundaries, recovery completeness, and tested behaviour—not merely by having a folder called `backups`.
