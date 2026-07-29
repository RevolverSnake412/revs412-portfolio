---
title: "Dedicated-Server Deployment on Linux"
slug: "dedicated-server-deployment-on-linux"
summary: "Field notes from deploying and maintaining an extension-enabled dedicated server on Linux, including service management, extension compatibility, ports, console access, updates, backups, and relay planning."
category: "Server Hosting"
tags:
  - dedicated-server
  - linux
  - vps
  - systemd
  - server-hosting
  - extensions
  - hosting
date: "2026-07-08"
updated: "2026-07-25"
featured: true
published: true
seoTitle: "Dedicated-Server Deployment on Linux"
seoDescription: "A practical note about deploying an extension-enabled dedicated server on Linux with systemd service management, ports, extensions, backups, console access, and troubleshooting."
---

## Why This Note Exists

A dedicated service looks simple from the outside: download server files, open a port, and start it.

In practice, a server that people actually use needs more structure than that.

It needs a stable runtime, clear directory layout, service management, port configuration, backups, update handling, extension compatibility checks, logs, console access, and a way to recover when the server crashes or an extension breaks startup.

This note documents the practical side of hosting a dedicated service on Linux. The goal is not to present it as a service-hosting flex. The goal is to treat it like a small hosted service with users, state, configuration, and maintenance needs.

## Server Context

The setup is based on a Linux VPS running an extension-enabled dedicated service.

The server direction included:

- ExtensionLoader-based application stack setup
- extension management
- service management with `systemd`
- server console access direction
- port exposure
- logs and crash troubleshooting
- Discord bridge direction
- service-data persistence
- update and rollback thinking

The exact application stack version and extension list can change over time, but the operational structure remains useful.

## What This Setup Is Meant To Prove

- dedicated services are stateful services and should be treated carefully
- service management matters more than manually running a jar in a terminal
- extension compatibility can break startup and needs controlled testing
- ports and firewall rules should be documented
- service data needs backups before updates or extension changes
- console access is important for administration
- Discord bridges add operational value but also add configuration risk
- a small hosted server still benefits from logs, restart behavior, and clear update steps

## Stack and Tools Used

### Server Layer

- Linux VPS
- SSH administration
- Java runtime
- dedicated service files
- persistent-data directory
- server configuration files
- firewall/port configuration

### application stack Layer

- dedicated service
- ExtensionLoader direction
- ExtensionLoader extensions
- server properties
- whitelist/op management
- persistent data
- crash reports and logs

### Service Management Layer

- `systemd`
- service unit
- restart behavior
- server logs
- console input direction
- FIFO/socket direction where useful

### Integration Direction

- Discord bridge planning
- server chat relay direction
- event/achievement relay direction
- command-output privacy direction

## Intended Build

The intended build is a dedicated service that can run continuously on a Linux host without depending on an open SSH session.

A finished setup should allow:

- server starts automatically or through a service command
- server restarts cleanly when needed
- logs are easy to inspect
- service data persists
- extensions are installed intentionally
- broken extensions can be removed or rolled back
- ports are documented
- console commands can be sent safely
- backups are taken before risky changes
- Discord integration can be added without exposing unnecessary server output

## Directory Layout

A clean directory layout makes maintenance easier.

Example direction:

```txt
/srv/dedicated-service/
  server.jar
  server.properties
  eula.txt
  service-data/
  extensions/
  config/
  logs/
  crash-reports/
```

A dedicated path avoids mixing server files with random home-directory downloads.

The important data is usually:

- `service-data/`
- `extensions/`
- `config/`
- `server.properties`
- whitelist/op files
- logs and crash reports when debugging

## Server Properties

`server.properties` controls important behavior such as:

- server port
- max users
- online mode
- whitelist
- view distance
- simulation distance
- message settings
- difficulty
- resource behavior

Any change here should be intentional because some settings affect performance, security, and service behavior.

The server port should be recorded clearly.

Example:

```txt
server-port=27767
```

Use the actual configured port for the real server.

## Port and Firewall Direction

A dedicated service needs an open TCP port for users to connect.

The access path depends on where the server is hosted:

- VPS firewall
- cloud security group
- local firewall
- host firewall
- Docker/network layer if used

Checks should include:

```bash
ss -lntp | grep java
```

and external connection testing from another network.

If the port is open locally but not reachable externally, the issue may be firewall, provider network rules, or wrong port configuration.

## Service Management With systemd

A proper server should run under a service manager.

Manual execution like this is useful for testing:

```bash
java -Xms2G -Xmx4G -jar server.jar nogui
```

But production-style hosting should use `systemd`.

A service gives:

- start/stop/restart commands
- logs through journal
- automatic restart direction
- startup after reboot if enabled
- consistent working directory

Useful commands:

```bash
systemctl status dedicated-service
journalctl -u dedicated-service -f
systemctl restart dedicated-service
```

The service name can be project-specific.

## Console Access Direction

application stack administration often needs console commands.

Examples:

```txt
say Server restarting soon
whitelist add <user>
op <user>
save-all
stop
```

If the server runs under `systemd`, direct console input is not always simple.

One approach is using a FIFO or socket-based input path so commands can be sent to the running server.

Example concept:

```txt
/srv/dedicated-service.stdin
```

A command can then be sent into the server process if the service is built to read from that FIFO.

This should be set up carefully because console access can affect the live server.

## extended Server Direction

An extension-enabled server needs more care than a baseline server.

Important checks:

- application stack version
- ExtensionLoader version
- extension versions
- server-side vs client-side extensions
- dependency extensions
- config files
- crash reports
- client compatibility

A extension can fail because:

- wrong application stack version
- wrong loader version
- missing dependency
- client-only extension installed on server
- incompatible extension combination
- config migration issue
- architecture/runtime problem

## Example extension Direction

A small ExtensionLoader setup can include utility and client-experience extensions, but the final list should be tested.

Examples from this direction included:

- Jade
- Jade Addons
- monitoring and map-visualization extension direction
- No Chat Reports direction
- Discord bridge direction

Some extensions may need to be removed if they break startup or conflict with the server version.

The important practice is to test extension changes one step at a time.

## Update Workflow

Updating an extension-enabled dedicated service should not be random.

A safer update workflow:

1. stop the server
2. backup service data and config
3. update one group of files
4. start server
5. check logs
6. join and test
7. keep rollback files temporarily

Do not update application stack, loader, and all extensions at once unless you are ready to debug multiple failure sources.

## Backup Direction

Backups matter because service data is the real state of the server.

Minimum backup targets:

```txt
service-data/
server.properties
extensions/
config/
whitelist.json
ops.json
banned-users.json
banned-ips.json
```

A simple backup can be:

```bash
tar -czf dedicated-service-backup-$(date +%F).tar.gz service-data server.properties extensions config
```

Before extension changes or version upgrades, take a backup.

## Logs and Crash Reports

Logs are the first place to check when the server fails.

Important paths:

```txt
logs/latest.log
crash-reports/
```

Useful checks:

```bash
tail -n 100 logs/latest.log
journalctl -u dedicated-service -n 100
```

Look for:

- missing extension dependency
- version mismatch
- port bind failure
- Java memory errors
- permission errors
- corrupted config
- crash report file path

## Discord Bridge Direction

A Discord bridge can connect server chat and events with a text channel.

Useful bridge goals:

- relay in-application chat to Discord
- relay Discord messages to in-application chat
- show join/leave messages if desired
- show achievements/events if configured
- hide command output or sensitive admin messages
- avoid leaking moderation/admin commands

The bridge should be treated as an integration, not just a chat toy.

Important decisions:

- which channel receives messages
- whether commands are relayed
- whether achievements are relayed
- whether admin output is hidden
- what happens if Discord is offline
- how tokens/webhooks are stored

Secrets should never be stored directly in public config.

## Performance Direction

dedicated service performance depends on:

- CPU single-thread performance
- RAM allocation
- view distance
- simulation distance
- number of users
- extensions
- service data generation
- storage speed
- Java version and flags

More RAM does not fix every problem.

A small server should tune:

```txt
view-distance
simulation-distance
max-users
autosave expectations
extension list
```

The server should be sized for real expected use, not imaginary maximum load.

## Practical Decisions

### Use systemd instead of manual terminal sessions

The server should not depend on an SSH session staying open.

`systemd` gives a predictable service lifecycle.

### Keep backups before risky changes

extended servers can break unexpectedly.

service data backups are cheaper than trying to repair corrupted state later.

### Test extensions incrementally

If five extensions are changed at once and the server fails, debugging becomes slower.

Change less, test more.

### Separate server-side and client-side assumptions

Some extensions are only useful on the client. Installing the wrong type on the server can cause startup problems.

### Hide command output from bridges where needed

A Discord bridge should not leak admin commands, sensitive console output, or internal errors into public channels.

### Document the port and connection method

A server is easier to support when the port, address, and firewall path are known.

## Common Failure Points

### Server Does Not Start

Likely causes:

- wrong Java version
- broken jar path
- missing EULA acceptance
- bad working directory
- extension version mismatch
- missing dependency
- corrupted config
- not enough memory
- file permission issue

### users Cannot Connect

Likely causes:

- wrong port
- firewall closed
- server bound to wrong address
- cloud security rule missing
- server not actually running
- DNS/domain pointing wrong
- client using wrong application stack version
- extension mismatch

### Server Starts Then Crashes

Likely causes:

- extension incompatibility
- service data corruption
- config migration issue
- memory pressure
- broken datapack/resource pack
- crash triggered by a loaded chunk or entity

### Discord Bridge Does Not Work

Likely causes:

- wrong token/webhook
- bot missing permissions
- channel ID wrong
- bridge extension/plugin version mismatch
- server not loading the bridge
- command relay disabled
- Discord API/network issue

### Console Commands Are Hard to Send

Likely causes:

- server running under systemd without stdin
- no FIFO/socket input path
- using the wrong service design
- trying to attach to a non-interactive process

## What A Finished Setup Should Show

A strong finished setup should show:

- server files in a dedicated directory
- Java version documented
- server version documented
- ExtensionLoader/loader version documented if used
- extensions and configs organized
- systemd service working
- port/firewall path documented
- logs accessible
- backups available
- update workflow written down
- console access method documented
- Discord bridge behavior defined
- sensitive tokens/configs protected

## Evidence Worth Capturing

Useful evidence for this note would include:

- directory tree
- `systemctl status` output
- `journalctl` output sample
- server startup log
- extension list
- server properties excerpt
- firewall or provider port rule screenshot
- successful client connection screenshot
- backup archive list
- Discord bridge test screenshot
- console command test
- crash report example and fix

## Technical Assumptions

This setup assumes the server is small enough for the chosen VPS or host.

It also assumes the server owner can access the host through SSH and manage service files.

For extended servers, it assumes the client and server versions are aligned.

The setup also assumes that the server is not a replacement for professional hosting infrastructure. It is a practical self-hosted service with maintenance responsibility.

## Key Risks

- service data loss without backups
- broken extension updates
- wrong Java version
- firewall/provider port mismatch
- memory allocation too high or too low
- command bridge leaking sensitive output
- service restart loop hiding the real crash
- no rollback plan after updates
- storage filling up with logs/backups
- public server exposure without moderation controls
- relying on manual SSH sessions instead of a service

## Current State

This note represents the operational direction for running an extension-enabled dedicated service on Linux.

The main value is the hosting structure: service management, extension control, backups, logs, port documentation, and integration planning.

The server can evolve with new extensions or integrations, but the maintenance model should stay stable.

## What This Note Does Not Claim

This note does not claim to be a universal application stack hosting guide.

It does not claim that every server needs extensions or a Discord bridge.

It does not claim that a cheap VPS is always enough for every extension-enabled server.

It is a field note about turning a dedicated service into a maintainable small Linux service.

## Practical Takeaway

A dedicated service is not just a jar file.

The useful setup includes:

- clear directory layout
- service management
- documented port
- controlled extension changes
- backups
- logs
- console access
- update workflow
- integration boundaries

That is what makes it maintainable after the first successful launch.
