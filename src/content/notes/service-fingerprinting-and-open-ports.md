---
resume: false
title: "Service Fingerprinting and Open Ports"
slug: "service-fingerprinting-and-open-ports"
summary: "Field notes explaining what open ports reveal, how service fingerprinting works, what attackers can infer from SSH/HTTP/HTTPS exposure, and how to reduce unnecessary public information leakage."
resumeSummary: >-
  Produced a practical security reference on what exposed ports disclose before an attacker even authenticates. It distinguishes port scanning from service fingerprinting and examines the clues available through SSH banners, HTTP headers, HTTPS certificates, TLS configuration, version signatures, and default application behaviour. The note connects these observations to defensive choices such as reducing unnecessary exposure, patching, hardening authentication, filtering access, and reviewing public information leakage, helping turn scan results into an actionable security baseline.
category: "Networking"
tags:
  - nmap
  - open-ports
  - service-fingerprinting
  - ssh
  - http
  - https
  - security
  - self-managed-infrastructure
  - hardening
  - networking
date: "2024-07-14"
updated: "2026-07-25"
featured: true
published: true
seoTitle: "Service Fingerprinting and Open Ports"
seoDescription: "A practical note about open port exposure, Nmap scans, service fingerprinting, SSH/HTTP/HTTPS information leakage, and basic hardening for self-managed services."
---

## Why This Note Exists

This note explains what outsiders can learn from open ports on a public IP address.

The original question was simple:

```txt
If my public IP shows ports 22, 80, and 443 open, what can people figure out?
```

The answer is more nuanced than “they can hack you” or “it is fine.”

Open ports are not automatically a vulnerability, but they are information. They tell people that something is listening, and sometimes they reveal what software, version, operating system, web stack, certificate, hostname, or authentication surface is exposed.

This note is about understanding that exposure and reducing unnecessary risk.

## What An Open Port Means

An open port means a service responded to connection attempts.

Example:

```txt
22/tcp open
80/tcp open
443/tcp open
```

That usually suggests:

```txt
22  → SSH
80  → HTTP
443 → HTTPS
```

But the port number alone is only a hint.

A service can run on a non-standard port, and a port can be filtered, proxied, redirected, or handled by a firewall. The real question is what service responds and what it reveals.

## Port Scanning vs Service Fingerprinting

Port scanning answers:

```txt
Which ports are open?
```

Service fingerprinting asks:

```txt
What exactly is running on those ports?
```

A basic scan may show:

```txt
22/tcp open ssh
80/tcp open http
443/tcp open https
```

A deeper fingerprint may reveal:

```txt
OpenSSH version
nginx or Apache
TLS certificate names
HTTP response headers
server banners
supported protocols
redirect behavior
default pages
framework hints
```

This is why fingerprinting matters more than the port list alone.

## What Nmap Can Show

A simple Nmap scan can show open ports.

A version scan can try to identify services:

```bash
nmap -sV <target>
```

A script scan can collect more details:

```bash
nmap -sC -sV <target>
```

An OS detection scan can try to guess the operating system:

```bash
nmap -O <target>
```

A more aggressive scan combines several checks:

```bash
nmap -A <target>
```

These scans do not magically break into the server. They collect visible information from services that already respond.

## What Port 22 Reveals

Port 22 usually means SSH.

An SSH service may reveal:

- that SSH is available publicly
- the SSH implementation
- sometimes the OpenSSH version
- supported authentication methods
- supported key exchange algorithms
- whether password login appears possible
- whether root login may be attempted
- server banner information

It usually does **not** reveal the correct username directly.

Attackers may still try common usernames:

```txt
root
admin
ubuntu
debian
oracle
opc
user
test
```

They do not need to know the real username to start guessing. That is why public SSH should be hardened.

## SSH Username Exposure

A normal SSH scan does not simply tell someone:

```txt
the valid username is this
```

However, usernames can leak indirectly through:

- public Git commits
- exposed web apps
- error messages
- default cloud usernames
- documentation
- reused hostnames
- old config files
- public repository paths
- login banners
- social engineering

So the port itself does not reveal the username, but the wider system can.

The safer assumption is:

```txt
If SSH is public, someone will try common usernames automatically.
```

## SSH Hardening Basics

Good baseline SSH hardening:

- use key-based login
- disable password authentication if possible
- disable root login where practical
- keep OpenSSH updated
- restrict SSH to VPN or trusted IPs if possible
- use firewall rules
- monitor login attempts
- avoid leaking usernames in banners or docs
- use fail2ban or equivalent where suitable
- do not expose SSH publicly unless needed

Changing SSH to a non-standard port can reduce random noise, but it is not real security by itself.

The stronger fix is:

```txt
SSH reachable only over VPN
```

or:

```txt
SSH reachable only from trusted source IPs
```

## What Port 80 Reveals

Port 80 usually means HTTP.

HTTP can reveal a lot because the server sends readable responses.

Possible exposed information:

- web server type
- default pages
- redirect behavior
- app framework
- HTTP headers
- file paths
- admin panels
- exposed directories
- robots.txt content
- error pages
- virtual host behavior
- old test pages

A default page can reveal the stack even if no real site is deployed.

Examples:

```txt
Welcome to nginx
Apache default page
OpenWrt LuCI login
Router admin page
Node/Express error page
```

The biggest risk is accidentally exposing an admin interface or unfinished service.

## What Port 443 Reveals

Port 443 usually means HTTPS.

HTTPS encrypts traffic, but it still reveals metadata.

Possible exposed information:

- TLS certificate domain names
- certificate issuer
- certificate validity dates
- supported TLS versions
- supported cipher suites
- web server behavior after TLS handshake
- HTTP headers after connection
- reverse proxy details
- virtual host configuration

A certificate can reveal hostnames even if the page content is protected.

For example, a certificate may contain:

```txt
example.com
api.example.com
admin.example.com
```

That can give attackers useful target names.

## HTTP Headers

HTTP headers can leak implementation details.

Examples:

```txt
Server: nginx
Server: Apache
X-Powered-By: Express
X-Powered-By: PHP/8.x
Via: reverse-proxy
```

Removing or reducing these headers can help, but it should not be treated as the main defense.

A hidden header does not secure a vulnerable service.

The priority order is:

```txt
patch services
restrict access
remove exposed admin panels
use authentication
then reduce banners/headers
```

## TLS Certificate Information

TLS certificates are public by design.

Anyone connecting to an HTTPS service can inspect the certificate.

It can reveal:

- domain name
- subdomains
- organization if included
- issuer
- expiration date
- certificate chain
- sometimes internal naming mistakes

Certificates are not secret.

If a hostname should not be public, do not place it in a public certificate.

## Web Fingerprinting

Web services can be fingerprinted through:

- headers
- cookies
- HTML structure
- JavaScript files
- CSS paths
- favicon hashes
- default error pages
- login page text
- API responses
- static asset names
- framework-specific files

Even if headers are removed, the app can still reveal itself through behavior and file structure.

Example:

```txt
/wp-login.php → WordPress
/luci/       → OpenWrt LuCI direction
/api/docs    → API documentation
```

Do not rely only on hiding banners.

## Router and Admin Panel Exposure

The most dangerous exposure is often not a normal website.

It is an admin panel exposed by mistake.

Examples:

- router login page
- OpenWrt LuCI
- Proxmox panel
- database admin panel
- Docker UI
- Portainer
- camera DVR interface
- game server admin panel
- development dashboard

These should usually not be public.

Better access path:

```txt
Internet
  ↓
VPN
  ↓
private admin panel
```

Public admin panels create unnecessary risk even when password protected.

## What Attackers Can Infer

From open ports and fingerprinting, someone may infer:

- which services are exposed
- whether the server is probably Linux
- whether SSH is available
- whether a web server is nginx/Apache/Caddy/etc.
- whether a reverse proxy is present
- whether HTTPS is configured
- possible hostnames from certificates
- whether default pages exist
- whether admin panels are public
- whether software looks outdated
- whether common vulnerabilities may apply

This does not mean compromise is automatic.

It means the exposed services define the attack surface.

## What Attackers Usually Cannot Infer Directly

A scan usually cannot directly reveal:

- valid SSH private keys
- valid passwords
- exact internal network layout
- database contents
- correct SSH username with certainty
- private services behind a firewall
- LAN-only devices
- VPN-only services

But if public services leak configuration, logs, backups, or admin pages, that changes quickly.

The goal is to avoid giving the internet unnecessary starting points.

## Open Ports Under CGNAT

When scanning a public IP under CGNAT, results can be confusing.

The public IP may not belong only to one customer router.

An Nmap result shows:

```txt
what is reachable on that public IP
```

It does not always prove:

```txt
this service is running on my local router
```

To verify ownership, check:

- router WAN IP
- public IP from outside
- service logs during scan
- port forward rules
- whether the target service receives the connection
- external test from mobile data or VPS

This matters because CGNAT and ISP layers can make public-IP tests harder to interpret.

## Public IP Scanning Checklist

When checking your own public IP, use a process:

### 1. Identify Public IP

```bash
curl -s ifconfig.me
```

### 2. Scan From Outside

Use an external network or VPS.

```bash
nmap -sV <public-ip>
```

### 3. Compare Router WAN IP

Check whether the router WAN IP matches the public IP.

If not, CGNAT or upstream NAT may be involved.

### 4. Check Service Logs

During a scan or connection test, check if your server logs show the attempt.

If no log appears, traffic may not be reaching your device.

### 5. Confirm Port Ownership

For each open port, confirm which local service owns it.

On Linux/OpenWrt-style systems:

```bash
netstat -tulpn
```

or:

```bash
ss -tulpn
```

## Local Listening vs Public Exposure

A service can be listening locally without being public.

Examples:

```txt
127.0.0.1:3000
192.168.1.10:8080
0.0.0.0:22
```

Meaning:

```txt
127.0.0.1 → local machine only
LAN IP    → local network interface
0.0.0.0   → all interfaces on that device
```

A local listening port becomes public only if firewall/NAT/routing exposes it.

So always separate:

```txt
service is running
```

from:

```txt
service is reachable from the internet
```

## Reducing Attack Surface

The best way to reduce risk is to expose fewer services.

Better public exposure:

```txt
80/443 → reverse proxy / website only
SSH    → VPN-only or trusted IP only
admin  → VPN-only
database → never public
```

A clean public setup usually exposes:

- HTTP/HTTPS for intended public sites
- maybe game server ports if needed
- nothing else unless justified

Everything administrative should be private or VPN-protected where possible.

## Reverse Proxy Direction

A reverse proxy can help organize web exposure.

It can route:

```txt
site.example.com → public site
api.example.com  → backend API
```

But it should not blindly expose:

```txt
admin.example.com
proxmox.example.com
router.example.com
db.example.com
```

unless those are strongly protected and intentionally public.

A safer pattern:

```txt
public websites → reverse proxy
admin tools     → VPN
databases       → private only
```

## Practical Hardening Steps

### For SSH

- disable password login
- use keys
- disable root login if practical
- restrict by firewall
- prefer VPN-only
- monitor failed attempts

### For HTTP/HTTPS

- remove default pages
- patch web server
- hide unnecessary headers
- disable directory listing
- use proper TLS
- do not expose admin panels
- use authentication where needed

### For Router/Admin Services

- keep router admin LAN/VPN only
- do not expose LuCI/public admin UI
- check port forwards
- check UPnP rules if enabled
- audit running services

### For Databases

- do not expose publicly
- bind to private IP or localhost where possible
- require strong authentication
- restrict by firewall
- access through app server or VPN only

## UPnP Risk

UPnP can automatically create port forwards.

That can be convenient, but it can also expose services unexpectedly.

If public exposure matters, check:

- whether UPnP is enabled
- which devices requested forwards
- which ports were opened
- whether those forwards are still needed

On a controlled network, disabling UPnP or limiting it can reduce surprises.

## Common Misunderstandings

### “Only port 22 is open, so I am safe.”

SSH is a serious access surface. It should be hardened.

### “Changing SSH port makes it secure.”

It reduces random scans but does not replace strong authentication.

### “HTTPS means nothing is visible.”

HTTPS encrypts content but still exposes certificate and service metadata.

### “Nmap found nginx, so I am hacked.”

Fingerprinting is not compromise. It is information gathering.

### “No website is deployed, so port 80 is harmless.”

Default pages and admin panels can still reveal useful information.

### “A scan reveals my SSH username.”

Usually not directly, but usernames can be guessed or leaked elsewhere.

## Testing Checklist

### Identify Open Ports

```bash
nmap <public-ip>
```

### Identify Services

```bash
nmap -sV <public-ip>
```

### Check Default Scripts

```bash
nmap -sC -sV <public-ip>
```

### Check Local Listeners

```bash
ss -tulpn
```

or:

```bash
netstat -tulpn
```

### Check HTTP Headers

```bash
curl -I http://<public-ip>
```

```bash
curl -I https://<domain>
```

### Check Certificate

Use browser certificate viewer or command-line TLS inspection.

### Check Router Forwards

Review:

```txt
port forwards
firewall rules
UPnP leases
reverse proxy configs
running services
```

## Practical Decisions

### Public services should be intentional

Every open port should have a reason.

### SSH should usually be private

VPN-only SSH is cleaner than public SSH for personal infrastructure.

### Admin panels should not be public

Protect router, Proxmox, database, and service dashboards behind VPN.

### Fingerprinting is expected

Assume people can identify exposed services. Security should not depend on hiding everything.

### Headers are secondary

Removing headers is useful, but patching and access control matter more.

### Logs matter

If a scan reaches your service, logs should help confirm it.

## What A Finished Note Should Show

A strong finished note should show:

- port scan example
- service fingerprinting example
- explanation of SSH exposure
- explanation of HTTP/HTTPS metadata
- what usernames can and cannot be discovered
- CGNAT caveat
- local listener vs public exposure
- hardening checklist
- decision to move admin access behind VPN
- difference between hiding banners and reducing attack surface

## Evidence Worth Capturing

Useful evidence for this note would include:

- Nmap result with public IP hidden
- router port-forward page with sensitive data hidden
- `ss -tulpn` or `netstat` output
- HTTP headers before/after cleanup
- TLS certificate screenshot with private domains hidden if needed
- SSH config hardening snippet
- firewall rule screenshot
- VPN-only admin access diagram
- failed public admin panel test after blocking access

## Technical Assumptions

This note assumes the user is scanning their own public IP or systems they are allowed to test.

It assumes the goal is defensive understanding and hardening, not scanning third-party targets.

It also assumes the environment may include OpenWrt, self-hosted services, SSH, web servers, and game/server hosting.

## Key Risks

- exposing SSH publicly with password login
- exposing router admin UI
- exposing database services
- leaving default pages online
- ignoring TLS certificate metadata
- assuming changed ports are real security
- relying only on hidden banners
- forgetting UPnP-created forwards
- confusing local listening with public exposure
- misunderstanding CGNAT scan results
- not checking service logs during tests

## Current State

This note represents the security reasoning around open ports and service fingerprinting.

It connects to self-hosting, OpenWrt, CGNAT, SSH, web hosting, reverse proxies, and VPN access.

The main value is knowing what exposed services reveal and how to reduce exposure without overreacting.

## What This Note Does Not Claim

This note does not claim that every open port is dangerous.

It does not claim that fingerprinting is the same as exploitation.

It does not provide instructions for attacking third-party systems.

It documents defensive understanding for systems the operator owns or is authorized to test.

## Practical Takeaway

The useful lesson is:

> Open ports are not automatically a breach, but they are public information.

A clean self-hosting setup should answer:

- why is this port open?
- what service responds?
- what version or metadata does it reveal?
- does it need to be public?
- can it be moved behind VPN?
- are logs and authentication strong?
- are admin tools and databases private?

That turns a scary port scan into a practical hardening checklist.
