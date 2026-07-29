---
title: "Extension-Enabled Dedicated-Server Hosting"
slug: "extension-enabled-dedicated-server-hosting"
summary: "Field notes from hosting and operating an extension-enabled dedicated server on Linux, including ARM compatibility, service launch, extension handling, configuration, logs, and troubleshooting."
category: "Server Hosting"
tags:
  - dedicated-server
  - server-hosting
  - linux
  - vps
  - extensions
  - arm
  - hosting
date: "2026-07-08"
updated: "2026-07-25"
featured: true
published: true
seoTitle: "Extension-Enabled Dedicated-Server Hosting on Linux"
seoDescription: "A practical note about hosting an extension-enabled dedicated server on Linux, covering ARM VPS compatibility, extension setup, configuration, logs, and troubleshooting."
---

## Why This Note Exists

A dedicated service can be simple when it runs baseline and only needs a small group of users.

It becomes more complex when the server uses ExtensionRuntime, custom extensions, Linux hosting, ARM hardware, Docker experiments, and Discord integration ideas.

This note documents the practical side of hosting a dedicated service with ExtensionRuntime on a Linux VPS. The focus is not only starting the server once. The focus is understanding the moving parts: architecture compatibility, runtime requirements, extension installation, server configuration, logs, build errors, and recovery when the server fails.

## Server Context

The setup is based on a Linux VPS running application stack with ExtensionRuntime.

The environment included:

- Oracle Cloud ARM / Ampere-style VPS direction
- Linux server administration
- ExtensionRuntime files
- .NET runtime requirements
- extension building/testing
- server configuration file
- no-Steam/server startup direction
- Discord bridge planning
- custom extension development direction
- troubleshooting across architecture, runtime, and extension layers

This note is written as a field note, not as a universal guide.

## What This Setup Is Meant To Prove

- extension-enabled dedicated services need more structure than baseline servers
- CPU architecture matters when using prebuilt tools or Docker images
- ExtensionRuntime adds runtime and extension compatibility constraints
- server config files should be treated as part of deployment
- logs and build errors are the real source of debugging information
- custom extensions should be built and tested in a controlled path
- service startup should be repeatable instead of based on remembered commands
- Discord bridges and service behavior extensions should be added only after the base server is stable

## Stack and Tools Used

### Server Layer

- Linux VPS
- SSH administration
- ARM/Ampere server environment
- filesystem-based server management
- server configuration files
- logs and crash output

### application stack Layer

- application stack dedicated server direction
- ExtensionRuntime
- service data files
- server config
- extension files
- extension sources
- build output
- server launch flags

### Runtime Layer

- .NET runtime
- native dependencies
- architecture compatibility checks
- Docker experiments where useful
- platform-specific troubleshooting

### extension development Layer

- ExtensionRuntime source tree
- custom extension build process
- server-side service behavior rules
- extension dependency direction
- compile errors and API mismatch debugging

### Integration Direction

- Discord chat bridge planning
- achievement/event relay direction
- console visibility improvements
- in-application chat and server event output direction

## Intended Build

The intended build is a dedicated service that can run reliably with ExtensionRuntime and selected extensions.

A finished setup should allow:

- server starts from a known command or script
- server reads the intended configuration file
- service data files are stored in a known location
- extensions are installed intentionally
- custom extensions can be built and copied into the right place
- logs are available when startup fails
- architecture/runtime problems are identified quickly
- Discord bridge integration can be added after server stability
- backups exist before extension or service data changes

## Directory Layout

A clean layout makes the server easier to maintain.

Example direction:

```txt
/home/opc/tml-arm/
  ExtensionRuntime/
    ExtensionRuntime.dll
    serverconfig.txt
    persistent data/
    extensions/
    ExtensionSources/
      SurfaceProtection/
```

The exact path can change, but the important idea is to keep:

- ExtensionRuntime files
- service data files
- extension files
- extension sources
- config files
- build output

in predictable places.

## Server Configuration

A server config file is better than a long command full of repeated options.

Example direction:

```txt
/work/serverconfig.txt
```

or:

```txt
/home/opc/tml-arm/ExtensionRuntime/serverconfig.txt
```

A config file can define:

- service data path
- max users
- port
- password
- difficulty
- motd
- banlist
- secure setting
- language
- auto-create service data direction if needed

The config file should be tracked as part of the server setup.

## Launch Direction

The ExtensionRuntime service is usually launched through its DLL with the correct runtime.

Example shape:

```bash
dotnet ExtensionRuntime.dll -server -config /path/to/serverconfig.txt
```

Additional flags may be needed depending on the setup.

For extension building or offline setup, `-nosteam` can be useful where Steam integration is not required.

The launch command should eventually be wrapped in a script so the server can be started consistently.

## ARM / Architecture Issues

ARM VPS hosting can be attractive because of free or low-cost resources, but architecture compatibility creates real problems.

Common issue types:

- `Exec format error`
- amd64 Docker image on ARM host
- native dependency mismatch
- SteamCMD compatibility problems
- runtime library errors
- tool expecting x86_64 environment
- emulation working but being slower or fragile

If an image or binary is built for amd64 and the host is ARM, it may not execute natively.

This is not a application stack-specific problem. It is a general hosting/platform issue.

## Docker Experiments

Docker can make server setup cleaner, but only if the image supports the target architecture.

In this kind of setup, Docker can fail because:

- image is amd64-only
- host is ARM
- entrypoint script is the wrong format
- SteamCMD dependency does not match
- native library fails at runtime
- mounted paths are wrong
- server config path inside container is wrong

When Docker becomes the source of the problem, running ExtensionRuntime directly on the host can be easier for troubleshooting.

## Extension Runtime Issues

ExtensionRuntime depends on runtime components and native libraries.

Common issue types:

- missing .NET runtime
- wrong .NET version
- native library missing
- startup core dump
- dependency path issue
- permission issue
- graphical/native backend issue even on server
- launch flags missing or wrong

The important debugging habit is to read the actual error output instead of repeatedly changing random parts of the setup.

## extension Installation Direction

extensions should be added after the base server works.

A safer flow:

1. start the baseline service with no extensions
2. confirm service data loads
3. confirm port/connectivity
4. add one extension or one group of related extensions
5. restart
6. read logs
7. join and test
8. backup before major changes

Adding many extensions at once makes failures harder to isolate.

## Custom extension Development Direction

Custom extension work should live under `ExtensionSources`.

Example:

```txt
ExtensionRuntime/ExtensionSources/SurfaceProtection/
```

The build command should point to the correct ExtensionRuntime directory and savedirectory.

Example shape:

```bash
dotnet ExtensionRuntime.dll -build SurfaceProtection -tmlsavedirectory /home/opc/tml-arm/ExtensionRuntime
```

The exact command depends on the final folder layout.

The important part is that build commands should be documented, because ExtensionRuntime paths can become confusing quickly.

## Build Errors

Custom extension build errors are useful signals.

Examples of error categories:

- method signature mismatch
- outdated ExtensionRuntime API usage
- wrong override return type
- missing namespace or class
- server/client-side API confusion
- incorrect tile or item logic
- dependency missing
- build path wrong

A real example type:

```txt
return type must be 'void' to match overridden member
```

This means the extension code is using the wrong method signature for the ExtensionRuntime version.

The fix is not random editing. The fix is checking the current API signature and matching it exactly.

## Server-Side Rules

One project direction involved making server-side behavior rules, such as protecting shared areas from unauthorised changes while preserving permitted actions elsewhere.

This is a useful extension development case because it shows that a dedicated service can enforce rules through code rather than depending only on manual moderation.

Important considerations:

- which objects should be protected
- how the protected boundary is defined
- what actions should be allowed
- what should happen when a blocked action occurs
- how messages are shown to users
- whether the rule creates duplication paths
- whether dependent objects and multi-cell objects behave correctly

## Discord Bridge Direction

A Discord bridge can connect the server with a text channel.

Possible goals:

- relay in-application chat to Discord
- relay Discord messages to service chat
- show join/leave events
- show relevant status or event activity
- improve remote visibility into server activity
- avoid exposing admin console output

This should be added after the base server and extension setup are stable.

A bridge that leaks command output or internal errors can create noise or privacy issues.

## Console and Logging Direction

An extension-enabled server needs good logs.

Useful log areas:

- ExtensionRuntime startup output
- extension build output
- crash output
- service data loading messages
- extension loading messages
- runtime exception output
- Discord bridge logs if used

The console should be more than a black box. If a extension fails, the logs should make it clear which extension or file caused the failure.

## Backup Direction

Backups are important because persistent data and extension configs are stateful.

Minimum backup targets:

```txt
persistent data/
extensions/
ExtensionSources/
serverconfig.txt
```

Before changing extensions, custom extension logic, or ExtensionRuntime version, back up the service data and config.

A simple backup can be:

```bash
tar -czf service-backup-$(date +%F).tar.gz persistent-data extensions serverconfig.txt
```

For custom development, also back up or version-control the extension source.

## Deployment Scripts

A start/build script is useful because commands become long.

Useful script actions:

```txt
start
stop
restart
build-extension
logs
backup
update-extensions
```

The first script does not need to be perfect. It only needs to reduce repeated manual steps and prevent forgetting important paths.

## Practical Decisions

### Stabilize the base server before adding extensions

If the base server does not start reliably, extension debugging becomes harder.

### Treat architecture as a first-class constraint

On ARM VPS hosts, not every Docker image or tool will work.

Check architecture early instead of assuming every Linux command works the same.

### Keep custom extension logic small and testable

Small rules are easier to debug than a large extension that changes many systems at once.

### Use logs before guessing

ExtensionRuntime errors usually point toward the failing API call, dependency, or extension.

### Back up before changing extensions

extension changes can break persistent data, configs, or server startup.

### Add Discord bridge after core stability

Integrations should not be mixed into the first debugging phase.

## Common Failure Points

### Exec Format Error

Likely cause:

```txt
amd64 binary or container on ARM host
```

Fix direction:

- use ARM-compatible image/binary
- build for the correct platform
- use emulation only if acceptable
- avoid Docker path until base server works directly

### ExtensionRuntime Starts Then Crashes

Likely causes:

- missing runtime
- native dependency issue
- wrong launch flags
- incompatible environment
- broken extension
- bad config path
- service data load problem

### extension Build Fails

Likely causes:

- API mismatch
- wrong override signature
- missing dependency
- wrong namespace
- outdated sample code
- wrong savedirectory
- build command points to the wrong folder

### Server Runs but users Cannot Connect

Likely causes:

- port closed
- provider firewall
- local firewall
- wrong port in config
- server not listening on expected address
- version mismatch
- extension mismatch

### Surface Protection Logic Creates Exploits

Likely causes:

- blocking one object interaction but not related drops
- allowing a base-object change to affect dependent objects
- not handling attachment relationships
- not distinguishing exempt objects from protected objects
- server/client prediction mismatch

## What A Finished Setup Should Show

A strong finished setup should show:

- ExtensionRuntime starts reliably
- config file path is documented
- service data files are stored predictably
- extensions are installed intentionally
- custom extension builds successfully
- server port is documented and reachable
- startup and crash logs are accessible
- backup process exists
- Discord bridge direction is clear
- architecture limitations are recorded
- update/build/start commands are documented

## Evidence Worth Capturing

Useful evidence for this note would include:

- server directory tree
- startup command
- serverconfig file excerpt
- successful ExtensionRuntime startup log
- extension list
- custom extension source tree
- build command output
- build error and fix examples
- port/firewall configuration
- user connection test
- Discord bridge test if added
- backup archive list
- architecture check output such as `uname -m`

## Technical Assumptions

This setup assumes the host is a Linux VPS and may be ARM-based.

It assumes ExtensionRuntime and its dependencies can run in the chosen environment after compatibility issues are solved.

It also assumes the server is intended for a small community or controlled group, not a large public production environment.

## Key Risks

- architecture mismatch between host and binaries
- relying on Docker images that do not support ARM
- broken ExtensionRuntime dependencies
- extension incompatibility
- service data corruption after extension changes
- missing backups
- custom extension bugs creating exploits
- unclear config paths
- Discord bridge leaking unwanted output
- port/firewall rules not matching the server config
- manual commands being forgotten or changed over time

## Current State

This note represents the practical hosting and troubleshooting direction for a dedicated service with ExtensionRuntime on Linux.

The main value is the operational model: stabilize the base server, understand architecture constraints, manage extensions carefully, build custom logic in a known path, capture logs, and document repeatable commands.

The setup also creates a base for a separate note about building a custom application stack surface protection extension.

## What This Note Does Not Claim

This note does not claim to be a full universal ExtensionRuntime guide.

It does not claim that ARM VPS hosting is always the easiest choice.

It does not claim that every extension or bridge will work without compatibility checks.

It is a field note about hosting, debugging, and maintaining an extension-enabled dedicated service in a real Linux environment.

## Practical Takeaway

A ExtensionRuntime dedicated service is not only the server executable.

The useful setup includes:

- correct runtime
- correct architecture
- known config paths
- careful extension changes
- custom extension build process
- logs
- backups
- start scripts
- port testing
- integration boundaries

That is what makes the server maintainable after the first successful launch.
