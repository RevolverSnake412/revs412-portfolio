---
title: "DDNS Setup with DuckDNS on OpenWrt"
slug: "ddns-setup-with-duckdns-on-openwrt"
summary: "Field notes from setting up DuckDNS on OpenWrt for dynamic DNS, remote access, WireGuard endpoints, and home self-hosting workflows."
category: "Networking"
tags:
  - openwrt
  - duckdns
  - ddns
  - dynamic-dns
  - wireguard
  - self-hosting
  - remote-access
  - firewall
  - cgnat
  - home-network
date: "2025-02-06"
updated: "2026-07-25"
featured: true
published: true
seoTitle: "DDNS Setup with DuckDNS on OpenWrt"
seoDescription: "A practical note about configuring DuckDNS dynamic DNS on OpenWrt, verifying updates, using it with WireGuard, and understanding its limits under CGNAT."
---

## Why This Note Exists

This note documents the practical setup direction for using DuckDNS with OpenWrt.

The goal was to make a home network reachable through a stable domain name even when the public IP changes.

Instead of remembering or manually checking the current public IP, a DDNS hostname can point to the latest address:

```txt
revs412.duckdns.org → current public IP
```

This is useful for:

- WireGuard remote access
- home lab access
- testing self-hosted services
- temporary remote administration
- avoiding manual IP updates
- making connection profiles easier to manage

DDNS is simple, but it is often misunderstood. It solves changing IP addresses. It does not solve every reachability problem.

## Project Context

The environment was an OpenWrt router used as the main home network control point.

The setup involved:

- OpenWrt on a router device
- dynamic residential internet connection
- DuckDNS hostname
- WireGuard remote access direction
- port forwarding/firewall rules
- self-hosted services
- possible CGNAT limitations

A DuckDNS domain was used as the stable endpoint name.

Example:

```txt
revs412.duckdns.org
```

The hostname is easier to use in VPN/client configs than a changing public IP address.

## What This Setup Is Meant To Prove

- dynamic public IPs can be handled cleanly
- OpenWrt can update DDNS automatically
- remote access profiles should use hostnames instead of raw IPs
- DDNS and port forwarding are separate problems
- DDNS does not bypass CGNAT
- verification should check both DNS updates and real connectivity
- a small network feature can improve reliability of self-hosted access

## Stack and Tools Used

### Network Layer

- OpenWrt
- WAN interface
- dynamic public IP
- firewall rules
- port forwarding
- WireGuard endpoint direction

### DDNS Layer

- DuckDNS
- DuckDNS token
- DDNS update URL
- OpenWrt dynamic DNS client
- scheduled updates
- public IP detection

### Verification Layer

- DNS lookup
- external IP check
- router logs
- mobile data testing
- remote WireGuard test
- port reachability checks

## Intended Build

The intended build is an OpenWrt DDNS setup that automatically updates a DuckDNS hostname whenever the public IP changes.

A finished setup should:

- update DuckDNS automatically
- survive router reboot
- use the correct WAN/public IP
- show update status in logs
- work with a WireGuard endpoint
- avoid exposing the DuckDNS token publicly
- make remote configs easier to maintain
- clearly identify when CGNAT prevents inbound access

## How DDNS Fits Into Remote Access

Without DDNS, a remote client may need:

```txt
Endpoint = current.public.ip.address:51820
```

If the ISP changes the public IP, the client breaks.

With DDNS:

```txt
Endpoint = revs412.duckdns.org:51820
```

The hostname stays the same while DuckDNS updates the IP behind it.

This is useful for WireGuard because the phone/laptop config does not need to be edited every time the ISP changes the IP.

## What DuckDNS Actually Does

DuckDNS maps a hostname to an IP address.

Example:

```txt
revs412.duckdns.org
  ↓
102.x.x.x
```

When the public IP changes, OpenWrt sends an update request to DuckDNS.

DuckDNS then changes the DNS record.

That is all DDNS does.

It does not:

- open ports
- configure firewall rules
- bypass CGNAT
- secure the service
- start WireGuard
- expose private LAN devices by itself

It only keeps the hostname pointing to the current IP.

## Correct Mental Model

A correct model:

```txt
DDNS = name points to current public IP
Firewall = decides what traffic is allowed
Port forward = sends traffic to an internal host
WireGuard = secure tunnel endpoint
CGNAT = possible ISP-level blocker
```

These are separate layers.

If the hostname updates correctly but WireGuard still does not connect, the problem may be firewall, port forwarding, WireGuard config, CGNAT, or server status.

## Basic OpenWrt DDNS Direction

On OpenWrt, DDNS can be handled by the dynamic DNS service.

A typical setup needs:

```txt
DDNS package
DuckDNS service config
DuckDNS token
domain name
WAN/public IP detection
update interval
```

The exact package names can vary by OpenWrt build, but the usual direction is:

```txt
install ddns client
configure DuckDNS service
enable service
start service
check logs
```

The setup should be persistent across reboot.

## DuckDNS Update URL Direction

DuckDNS updates normally use a token and domain.

The update request conceptually looks like:

```txt
https://www.duckdns.org/update?domains=<domain>&token=<token>&ip=
```

When `ip` is empty, DuckDNS can detect the source public IP.

For OpenWrt, it is usually better to let the DDNS client handle this instead of manually running the URL forever.

The token must stay private.

## Config Values To Track

Important values:

```txt
DuckDNS domain
DuckDNS token
WAN interface
update interval
public IP source
enabled/disabled state
last update status
```

Example documentation without exposing secrets:

```txt
Domain: revs412.duckdns.org
Token: stored privately
Interface: wan
Update mode: automatic
Use case: WireGuard endpoint
```

Do not commit real tokens to GitHub.

## Using DDNS With WireGuard

A WireGuard client can use the DuckDNS hostname as its endpoint.

Example direction:

```txt
Endpoint = revs412.duckdns.org:51820
```

or with a custom external UDP port:

```txt
Endpoint = revs412.duckdns.org:45777
```

This depends on the actual public port exposed by the router.

The important point:

```txt
WireGuard client uses domain
DuckDNS updates domain
OpenWrt/firewall handles UDP traffic
WireGuard server handles tunnel
```

All parts must be correct.

## Firewall Relationship

DDNS does not open the WireGuard port.

The firewall still needs to allow the inbound UDP port.

For a WireGuard server on OpenWrt, that usually means allowing UDP traffic to the router itself.

For a WireGuard server behind OpenWrt, it may require a port forward to the internal host.

The distinction matters:

```txt
WireGuard server on router
  → allow input to router

WireGuard server behind router
  → port forward to internal host
```

Using DDNS does not change this.

## CGNAT Limitation

DDNS does not bypass CGNAT.

If the home router is behind CGNAT, DuckDNS may point to the ISP’s shared public IP, but unsolicited inbound traffic may still never reach the home router.

In that case:

```txt
DuckDNS updates correctly
domain resolves correctly
port still appears closed
WireGuard still cannot connect from outside
```

That does not mean DuckDNS is broken.

It means the public route does not reach the router.

Possible fixes:

- ask ISP for real public IP
- use IPv6 if available
- use a VPS as a WireGuard endpoint
- use a reverse tunnel
- use mesh VPN / overlay network
- keep access local-only

## Testing DNS Update

First test whether the hostname resolves.

Example:

```bash
nslookup revs412.duckdns.org
```

or:

```bash
dig revs412.duckdns.org
```

The result should match the current public IP, not necessarily the router WAN IP if CGNAT exists.

Check public IP:

```bash
curl -s ifconfig.me
```

Then compare:

```txt
DuckDNS result
external public IP
router WAN IP
```

This comparison tells you which layer is working.

## Testing Real Connectivity

DNS resolution is not enough.

After DDNS resolves correctly, test the actual service.

For WireGuard:

```txt
turn off Wi-Fi on phone
use mobile data
connect WireGuard
check handshake
ping VPN router IP
access internal service
```

For a web service:

```txt
open domain from mobile data
check reverse proxy logs
check router logs
check service logs
```

The best test is from outside the home network.

Testing from inside the same LAN may be affected by NAT reflection/hairpin behavior.

## Common Failure Cases

### Hostname Does Not Update

Possible causes:

- DDNS service not enabled
- wrong DuckDNS token
- wrong domain
- no internet from router
- DNS/package issue on OpenWrt
- script/service not running
- update interval not triggered yet

### Hostname Updates But Service Is Unreachable

Possible causes:

- firewall rule missing
- wrong port
- wrong protocol TCP vs UDP
- WireGuard not listening
- service not running
- wrong internal IP
- CGNAT
- ISP blocks inbound traffic

### WireGuard Works Locally But Not Outside

Possible causes:

- client endpoint uses local IP instead of DDNS
- UDP port not open
- upstream router blocks traffic
- CGNAT
- wrong external port
- server listens on different port
- allowed IPs/routes wrong

### DDNS Points To Shared ISP IP

Likely cause:

- CGNAT or upstream NAT

DDNS may still be doing its job, but inbound hosting may not work.

## Logs To Check

On OpenWrt, useful places to check include:

```txt
DDNS service status
system log
service logs
firewall logs if enabled
WireGuard status
```

Useful command direction:

```bash
logread | grep -i ddns
```

or:

```bash
logread | grep -i duck
```

For WireGuard:

```bash
wg show
```

Look for:

```txt
latest handshake
transfer rx/tx
peer endpoint
```

If DNS works but no handshake appears, traffic may not be reaching the WireGuard server.

## Update Intervals

DDNS should update often enough to recover from IP changes, but not so often that it spams the provider.

A practical interval is usually:

```txt
check periodically
update only when IP changes
```

The DDNS client should avoid unnecessary updates when the IP is unchanged.

After a router reboot or WAN reconnect, an update should happen automatically.

## Token Safety

The DuckDNS token is a secret.

Anyone with the token can update the DuckDNS record.

Do not place it in:

- public GitHub repos
- screenshots
- README files
- shared config examples
- chat logs
- public issue reports

For documentation, show:

```txt
DUCKDNS_TOKEN=replace_me
```

not the real value.

## File/Config Hygiene

A clean project or note should separate:

```txt
real config
example config
documentation
```

Example:

```txt
ddns.example.conf
README.md
.env.example
```

Avoid committing real OpenWrt config exports if they include tokens, PPPoE credentials, Wi-Fi passwords, VPN private keys, or internal IP details that should stay private.

## Public Services vs Private Access

DDNS can be used for public services, but it does not mean everything should be public.

Better exposure model:

```txt
Public:
  - website
  - reverse proxy if needed
  - selected game server ports if intended

Private:
  - router admin
  - Proxmox
  - databases
  - dashboards
  - SSH
  - internal apps
```

For private access, use DDNS as the WireGuard endpoint, then access internal systems through VPN.

That is cleaner than exposing admin panels directly.

## OpenWrt Router Reboot Behavior

A finished setup should survive reboot.

Check:

```txt
DDNS service enabled
WAN reconnect triggers update
DuckDNS hostname still correct
WireGuard still uses same endpoint
firewall rule still active
```

A reboot test is useful because many configs appear to work until the router restarts.

## Practical Decision Tree

```txt
Need stable name for home IP?
  → Use DDNS.

Need WireGuard access to home?
  → Use DDNS as endpoint + open correct UDP port.

Domain resolves but connection fails?
  → Check firewall, service, protocol, CGNAT.

Behind CGNAT?
  → DDNS is not enough; use public IP, IPv6, VPS tunnel, or mesh VPN.

Need public reliable hosting?
  → Consider VPS or public IP instead of residential DDNS only.
```

## Practical Decisions

### Use hostname in clients

Remote clients should use the DuckDNS hostname, not a raw IP.

### Verify DNS separately from connectivity

A correct DNS record does not prove the service is reachable.

### Keep secrets private

DuckDNS tokens should be treated like credentials.

### Check CGNAT early

Do not waste time tuning DDNS if the ISP blocks inbound traffic.

### Prefer VPN for admin services

DDNS should point to the VPN endpoint, not directly to admin panels.

### Test from outside

Mobile data or a VPS gives a more honest test than LAN access.

## Testing Checklist

### DDNS Setup

- DuckDNS domain exists
- token is correct
- OpenWrt DDNS service installed/configured
- service enabled
- update succeeds
- logs show successful update

### DNS Verification

- hostname resolves
- resolved IP matches external public IP
- update survives WAN reconnect
- update survives router reboot

### WireGuard Verification

- endpoint uses DuckDNS hostname
- correct UDP port is used
- firewall allows inbound UDP
- handshake appears from outside
- VPN client can reach router VPN IP
- internal services route correctly if intended

### CGNAT Verification

- compare router WAN IP with external public IP
- check if WAN IP is private or `100.64.0.0/10`
- test from outside network
- check whether service logs show attempts

### Security Verification

- token not committed
- screenshots hide sensitive values
- admin panels not public
- only intended ports exposed
- firewall rules reviewed

## What A Finished Setup Should Show

A strong finished setup should show:

- DuckDNS hostname configured
- OpenWrt DDNS service enabled
- successful update logs
- hostname resolving to current public IP
- WireGuard endpoint using hostname
- outside-network connection test
- firewall rule documented
- CGNAT limitation documented if present
- no exposed secrets
- reboot test completed

## Evidence Worth Capturing

Useful evidence for this note would include:

- DuckDNS domain page with token hidden
- OpenWrt DDNS config screenshot with secrets hidden
- update success log
- `nslookup` or `dig` result
- external public IP comparison
- WireGuard client endpoint using hostname
- `wg show` handshake after outside connection
- firewall rule screenshot
- simple topology diagram
- CGNAT check if relevant

## Technical Assumptions

This note assumes OpenWrt is the router or main network gateway.

It assumes the public IP may change over time.

It assumes DuckDNS is used as the DDNS provider.

It also assumes the user wants remote access or self-hosting convenience, not only a decorative domain name.

## Key Risks

- assuming DDNS opens ports
- ignoring CGNAT
- using the wrong protocol for firewall rules
- pointing WireGuard to the wrong port
- testing only from inside LAN
- exposing router/admin panels publicly
- leaking DuckDNS token
- router reboot disabling DDNS service
- hostname updating to shared ISP public IP
- stale DNS cache during testing
- confusing DNS success with service reachability

## Current State

This note represents the DDNS layer of a home/self-hosting setup.

It connects directly to:

- OpenWrt routing
- WireGuard remote access
- dynamic public IPs
- CGNAT troubleshooting
- firewall rules
- safe admin access

The main value is making the public endpoint stable while keeping the rest of the network design understandable.

## What This Note Does Not Claim

This note does not claim DuckDNS bypasses CGNAT.

It does not claim DDNS is a security feature.

It does not claim a hostname makes a service reachable by itself.

It documents how DDNS fits into a larger remote-access setup and where its limits are.

## Practical Takeaway

The useful lesson is:

> DDNS solves the changing-name problem, not the reachability problem.

A correct setup needs all of these layers to work:

```txt
DuckDNS hostname
current public IP
firewall rule
correct protocol/port
running service
no upstream CGNAT block
outside-network test
```

Once those are checked separately, DDNS becomes a simple and reliable part of the remote-access workflow.
