---
resume: false
title: "Rsync and SCP Alternatives for OpenWrt Deployment"
slug: "rsync-and-scp-alternatives-for-openwrt-deployment"
summary: "Field notes from deploying small services to OpenWrt when rsync is unreliable, using SCP, tar over SSH, Git pull, and simple deployment scripts instead."
resumeSummary: >-
  Documented lightweight deployment methods for OpenWrt devices when rsync is unavailable, unreliable, or too heavy for the target. The alternatives include SCP with compatibility mode, streamed tar archives over SSH, upload-and-extract flows, Git pull on the device, and copying only runtime artifacts built elsewhere. Each method is framed around constrained router storage, CPU, package availability, and recovery needs, giving small services a repeatable deployment path without assuming a full Linux-server toolchain.
category: "Deployment"
tags:
  - openwrt
  - deployment
  - rsync
  - scp
  - ssh
  - tar
  - git
  - docker
  - procd
  - automation
date: "2026-07-06"
updated: "2026-07-25"
featured: true
published: true
seoTitle: "Rsync and SCP Alternatives for OpenWrt Deployment"
seoDescription: "A practical note about deploying small services to OpenWrt using SCP, tar over SSH, Git pull, and simple scripts when rsync is unreliable or unavailable."
---

## Why This Note Exists

Deploying code to OpenWrt is different from deploying to a normal Linux server.

OpenWrt is small, router-focused, and sometimes missing tools that are standard on bigger distributions. Even when a tool exists, the implementation, SSH behavior, filesystem layout, or environment can behave differently.

This note documents practical deployment alternatives for small OpenWrt-hosted services when `rsync` is not reliable or not worth fighting.

The goal is simple:

```txt
edit code locally
send it to OpenWrt
restart the service cleanly
verify it is running
```

That workflow matters more than using one specific sync tool.

## Project Context

The deployment target was an OpenWrt device used for small services and scripts.

The environment included:

- Raspberry Pi running OpenWrt
- SSH access from a workstation
  - Node.js automation services
- Docker-based service direction
- procd service direction
- files placed under `/opt`
- `.env.local` style environment files
- need for repeatable build/run/restart scripts

A typical target path looked like:

```txt
/opt/discord-bots/<service-name>
```

The main issue was that `rsync` was not always reliable in practice, even when installed on both machines.

That made it useful to have fallback deployment methods.

## What This Note Is Meant To Prove

- deployment should be repeatable even when one tool fails
- OpenWrt requires simpler, more explicit workflows
- SCP can be enough for small services
- tar over SSH is a strong fallback for whole folders
- Git pull can work when the router has access and credentials
- deployment scripts reduce manual mistakes
- service restart and verification are part of deployment
- syncing files is not the same as deploying a service

## Tools and Methods Used

### Remote Access

- SSH
- OpenSSH client
- OpenWrt SSH server/dropbear or OpenSSH direction
- remote shell commands

### File Transfer

- `scp`
- legacy SCP mode when needed
- `tar` over SSH
- manual upload fallback
- optional `sftp` if available

### Sync/Deployment

- `rsync` when working
- Git pull workflow
- Docker rebuild/restart
- procd restart
- simple shell scripts

### Service Paths

- `/opt/discord-bots/`
- `/etc/init.d/`
- `.env.local`
- `package.json`
- `src/`
- deployment scripts

## Intended Build

The intended deployment workflow is:

```txt
local project folder
  ↓
copy/sync files to OpenWrt
  ↓
install/update dependencies if needed
  ↓
restart service
  ↓
check logs/status
```

A finished workflow should allow:

- one command to upload the project
- one command to restart
- one command to view logs
- clear fallback when rsync fails
- no manual copy-paste of many files
- no accidental overwrite of secrets
- no confusion between build, run, and restart

## Why Rsync Can Fail on OpenWrt

`rsync` is normally excellent, but OpenWrt can create friction.

Possible issues:

- `rsync` missing on either side
- different `rsync` builds/options
- SSH subsystem differences
- path quoting issues from Windows
- permission issues
- remote shell environment differences
- busybox/coreutils differences
- broken or unavailable SFTP subsystem
- old files owned by wrong user
- router storage or overlay issues
- unstable connection

An error like:

```txt
rsync error: unexplained error (code 12)
```

can come from remote-shell/protocol startup failure, not necessarily a normal file conflict.

When the tool itself becomes the problem, switching method is often faster.

## Method 1: SCP Folder Upload

For small projects, SCP is often enough.

Example direction:

```bash
scp -r ./project root@192.168.1.1:/opt/discord-bots/project
```

If the destination already exists, it may merge or overwrite files depending on structure.

For cleaner deployment, upload into a temporary folder first:

```bash
scp -r ./project root@192.168.1.1:/tmp/project-upload
```

Then move it into place on the router after checking it.

SCP is not as smart as rsync, but it is simple.

## Legacy SCP Mode

Some OpenWrt setups behave better with legacy SCP mode.

On newer OpenSSH clients, SCP may use SFTP behavior by default. If the remote server does not support the expected SFTP behavior, transfer can fail.

A useful fallback is:

```bash
scp -O -r ./project root@192.168.1.1:/opt/discord-bots/project
```

The `-O` flag forces legacy SCP protocol behavior.

This can help when SSH works but file transfer fails because of SFTP subsystem issues.

## Method 2: Tar Over SSH

For whole-folder deployment, tar over SSH is a strong fallback.

Instead of copying thousands of files one by one, create a tar stream locally and extract it remotely.

Example direction:

```bash
tar -czf - ./project | ssh root@192.168.1.1 "mkdir -p /opt/discord-bots && tar -xzf - -C /opt/discord-bots"
```

This method is useful because:

- it uses SSH
- it does not require rsync
- it preserves folder structure
- it is efficient for many small files
- it avoids SFTP dependency

A cleaner version can tar the contents instead of the parent folder depending on the desired result.

## Method 3: Upload Archive, Then Extract

Another safe method is:

```bash
tar -czf project.tar.gz ./project
scp project.tar.gz root@192.168.1.1:/tmp/project.tar.gz
ssh root@192.168.1.1 "mkdir -p /opt/discord-bots && tar -xzf /tmp/project.tar.gz -C /opt/discord-bots && rm /tmp/project.tar.gz"
```

This is slightly slower but easier to inspect.

It also gives a temporary artifact you can retry or verify.

## Method 4: Git Pull on Router

If Git is installed and the repo is accessible from the router, deployment can be:

```bash
ssh root@192.168.1.1 "cd /opt/discord-bots/project && git pull"
```

This is clean when:

- the service is already cloned
- credentials are handled safely
- the router can reach GitHub
- the repo does not contain secrets
- the branch is controlled

But Git on a router has tradeoffs:

- needs storage
- needs network/DNS working
- needs credentials or deploy key
- can accidentally pull untested changes
- not ideal for private repos without careful key setup

Git pull is good for controlled personal workflows, but not always the best first deployment method.

## Method 5: Build Locally, Copy Only Runtime Files

For Node.js services, copying the full repo every time may be unnecessary.

A deployment can copy only:

```txt
package.json
package-lock.json
src/
.env.example
Dockerfile
scripts/
```

But avoid copying:

```txt
node_modules/
.git/
logs/
temporary files
real secrets
```

If Docker is used on OpenWrt, the router can build the image locally, or the image can be built elsewhere depending on architecture and workflow.

For small OpenWrt devices, local builds may be slower.

## Method 6: Manual Emergency Upload

A bad but sometimes useful fallback:

```txt
copy one changed file with scp
restart service
test
```

Example:

```bash
scp ./src/index.js root@192.168.1.1:/opt/discord-bots/project/src/index.js
```

This is not a clean deployment process, but it is useful during emergency debugging.

It should not become the normal workflow.

## Deployment Script Direction

A better workflow is to wrap commands into scripts.

Example script commands:

```txt
deploy
restart
logs
status
stop
start
rebuild
clean
help
```

For a Docker-based service:

```txt
deploy → upload files
rebuild → docker build
restart → stop/remove old container, run new one
logs → docker logs
status → docker ps
```

For a procd service:

```txt
deploy → upload files
restart → /etc/init.d/service restart
logs → logread
status → /etc/init.d/service status
```

The exact implementation can change, but the user-facing workflow should stay simple.

## Docker Deployment Flow

A Docker-based OpenWrt service might use:

```txt
Dockerfile
.env.local
package.json
src/
```

A practical flow:

```txt
upload project
docker build image
stop old container
remove old container
run new container with --env-file
check logs
```

The important distinction:

```txt
building an image does not automatically restart the running container
```

A common mistake is building a new image but leaving the old container running.

The deployment script should make that explicit.

## procd Deployment Flow

For native OpenWrt services, procd is the service manager.

A flow might be:

```txt
upload project files
upload /etc/init.d/service file if needed
chmod +x service file
enable service
restart service
check logread
```

Useful commands:

```bash
/etc/init.d/service restart
/etc/init.d/service status
logread -f
```

procd is more OpenWrt-native than Docker and can be lighter for small Node scripts if dependencies are already available.

## Environment Files

Secrets and environment variables should be handled carefully.

A common pattern:

```txt
.env.example committed
.env.local kept private
```

Deploy `.env.local` only to the router if the service needs it.

Do not commit real tokens.

Do not overwrite `.env.local` accidentally during deployment unless that is intended.

Deployment scripts should either:

- skip `.env.local`
- upload it from a known private path
- check that it exists before restart

## Excluding Files

Even without rsync, deployment should avoid copying unnecessary files.

Common exclusions:

```txt
.git/
node_modules/
dist/
logs/
*.log
.env
.env.local if handled separately
.DS_Store
```

With tar, exclusions can be passed to the tar command.

Example direction:

```bash
tar --exclude='.git' --exclude='node_modules' --exclude='*.log' -czf - .
```

This keeps deployment smaller and avoids leaking local junk.

## Verification After Deploy

Deployment is not done when files are copied.

Verify:

```txt
service is running
logs look clean
service is online
expected command/feature works
old code is not still running
environment file loaded
network access works
```

Useful checks:

```bash
ssh root@192.168.1.1 "ps | grep node"
```

```bash
ssh root@192.168.1.1 "docker ps"
```

```bash
ssh root@192.168.1.1 "logread | tail -50"
```

```bash
ssh root@192.168.1.1 "docker logs --tail 50 service-name"
```

## Practical One-Line Commands

For copy/paste workflows, one-line commands are easier.

Example tar-over-SSH deploy:

```bash
tar --exclude='.git' --exclude='node_modules' --exclude='*.log' -czf - . | ssh root@192.168.1.1 "mkdir -p /opt/discord-bots/project && tar -xzf - -C /opt/discord-bots/project"
```

Example legacy SCP:

```bash
scp -O -r ./src ./package.json ./Dockerfile root@192.168.1.1:/opt/discord-bots/project/
```

Example remote restart:

```bash
ssh root@192.168.1.1 "/etc/init.d/project restart && logread | tail -50"
```

Example Docker restart:

```bash
ssh root@192.168.1.1 "cd /opt/discord-bots/project && docker build -t project:latest . && docker rm -f project 2>/dev/null || true && docker run -d --name project --env-file .env.local --restart unless-stopped project:latest && docker logs --tail 50 project"
```

The exact service name should be replaced with the real project name.

## Common Failure Points

### Files Uploaded but Service Still Runs Old Code

Likely causes:

- service not restarted
- Docker image rebuilt but container not recreated
- files copied to wrong path
- multiple project folders exist
- service points to another directory
- old process still running

### SCP Works but rsync Fails

Likely causes:

- rsync protocol startup problem
- SFTP/subsystem mismatch
- remote rsync path problem
- shell quoting issue
- permissions issue
- OpenWrt package/tool mismatch

Use SCP or tar-over-SSH instead of losing time.

### Deployment Overwrites Secrets

Likely causes:

- copying local `.env.local`
- deleting remote folder completely
- archive includes secret files
- no exclude list
- no backup before clean deploy

Handle secrets separately.

### Docker Build Works but Bot Does Not Start

Likely causes:

- missing env file
- wrong command
- wrong working directory
- old container name conflict
- network mode issue
- architecture mismatch
- token invalid
- system time/certificate issue

Check logs, not only build output.

### Remote Path Confusion

Likely causes:

- deploys to `/tmp` but service reads `/opt`
- service file points to old folder
- copy created nested folder accidentally
- relative paths changed

Always verify with:

```bash
ssh root@192.168.1.1 "pwd; ls -la /opt/discord-bots/project"
```

## Safer Deployment Pattern

A safer pattern is:

```txt
upload to temporary folder
backup current folder
replace folder
restart service
check logs
rollback if broken
```

Example direction:

```txt
/opt/discord-bots/project
/opt/discord-bots/project.prev
/tmp/project-upload
```

This gives a basic rollback path.

For tiny services, this may be enough.

## When Rsync Is Still Worth Using

`rsync` is still useful when:

- both sides support it cleanly
- the project has many files
- only small changes should be copied
- exclusions are important
- bandwidth is limited
- deployment needs delete-sync behavior

But it should not be treated as mandatory.

If `scp` or tar-over-SSH solves the problem reliably, that is a valid deployment choice.

## Practical Decisions

### Prefer reliability over tool preference

The goal is deployment, not proving `rsync` works.

### Keep commands scriptable

Manual copy commands are okay once. Repeated deployments need scripts.

### Separate upload from restart

It should be clear whether a command only copies files or actually restarts the service.

### Verify after every deploy

Logs and status checks should be part of the workflow.

### Protect secrets

Do not blindly archive and upload everything.

### Keep OpenWrt light

If the router is the network control point, avoid turning deployment into heavy build infrastructure.

## What A Finished Workflow Should Show

A strong finished deployment workflow should show:

- chosen project path under `/opt`
- one command to deploy files
- one command to restart service
- one command to view logs
- clear excludes
- `.env.local` handled safely
- Docker/procd behavior documented
- fallback if rsync fails
- verification step
- rollback direction for small services

## Evidence Worth Capturing

Useful evidence for this note would include:

- failed rsync error output
- working SCP command
- working tar-over-SSH command
- deployment script
- before/after file listing
- service restart output
- `docker ps` or procd status
- logs after deployment
- directory layout under `/opt`
- README usage instructions

## Technical Assumptions

This note assumes the target device is OpenWrt and reachable over SSH.

It assumes the service is small enough that SCP or tar-over-SSH is practical.

It also assumes the deployment target is controlled by the operator, such as a self-managed router or internal device.

## Key Risks

- copying files to the wrong path
- overwriting secrets
- restarting the wrong service
- building a Docker image but not recreating the container
- leaving old processes running
- using `/tmp` for persistent service files
- assuming SCP upload equals deployment
- no rollback
- no logs checked after restart
- heavy builds affecting router stability

## Current State

This note represents a practical deployment workflow for OpenWrt-hosted services.

The main value is having multiple reliable ways to move code when `rsync` is not behaving:

- SCP
- legacy SCP
- tar over SSH
- upload archive then extract
- Git pull
- scripted deploy/restart/logs

The result is a more resilient workflow for small services.

## What This Note Does Not Claim

This note does not claim `rsync` is bad.

It does not claim OpenWrt should be used as a heavy application server.

It does not claim these methods replace proper CI/CD for larger systems.

It documents practical alternatives for small OpenWrt deployments where simple, reliable, repeatable commands matter more than a perfect deployment platform.

## Practical Takeaway

The useful lesson is:

> The deployment workflow should survive tool failure.

If `rsync` fails, the work can still continue with:

```txt
scp
scp -O
tar over SSH
archive upload
git pull
scripted restart
```

For small OpenWrt services, a boring reliable deployment flow is better than a fragile “proper” one.
