---
title: "CGNAT and Self-Hosting Limits"
slug: "cgnat-and-self-hosting-limits"
summary: "Field notes explaining how CGNAT affects self-hosting, port forwarding, public IP scans, shared addresses, and practical alternatives for exposing home services."
category: "Networking"
tags:
  - cgnat
  - nat
  - self-hosting
  - port-forwarding
  - openwrt
  - isp
  - home-network
  - ddns
  - wireguard
  - reverse-proxy
date: "2025-11-14"
updated: "2026-07-25"
featured: true
published: true
seoTitle: "CGNAT and Self-Hosting Limits"
seoDescription: "A practical note about CGNAT, self-hosting, port forwarding, public IP scans, shared public IP behavior, and alternatives like VPS tunnels and VPN access."
---

## Why This Note Exists

This note explains one of the most common problems in home self-hosting: the difference between having internet access and being reachable from the internet.

A home router can access the web normally while still being impossible to reach from outside. This often happens because of CGNAT.

CGNAT changes how port forwarding works, how public IP addresses behave, and how realistic it is to host services like game servers, VPNs, web apps, or remote admin tools directly from home.

This note is written from the perspective of practical troubleshooting: what is happening, how to test it, and what options exist when inbound hosting is blocked.

## What CGNAT Means

CGNAT means Carrier-Grade NAT.

With normal home NAT, the layout is usually:

```txt
Internet
  ↓
Public IP on home router
  ↓
Private LAN devices
```

With CGNAT, the layout becomes:

```txt
Internet
  ↓
ISP public IP
  ↓
ISP NAT layer
  ↓
Customer private/CGNAT address
  ↓
Home router
  ↓
Private LAN devices
```

The important difference is that the public IP is not directly assigned to the customer router.

The ISP owns the public-facing NAT layer, and multiple customers can appear behind the same public address.

## Why CGNAT Breaks Port Forwarding

Port forwarding only works when the router that receives the public traffic can forward it to the internal device.

In a normal setup:

```txt
WAN public IP:25565
  ↓
home router port forward
  ↓
Minecraft server
```

In CGNAT:

```txt
WAN public IP:25565
  ↓
ISP NAT layer
  ↓
customer router
  ↓
home server
```

The customer can configure port forwarding on their own router, but they cannot configure the ISP NAT layer.

So the inbound traffic never reaches the customer router unless the ISP has created a mapping for that customer.

That is why a port can be forwarded correctly on OpenWrt and still appear closed from outside.

## Public IP vs Router WAN IP

A simple CGNAT check is comparing:

```txt
public IP shown by an external website
```

with:

```txt
WAN IP shown on the router
```

If they do not match, and the router WAN is in a private or CGNAT range, then inbound self-hosting is likely blocked.

Common private ranges:

```txt
10.0.0.0/8
172.16.0.0/12
192.168.0.0/16
```

Common CGNAT range:

```txt
100.64.0.0/10
```

If the router WAN IP is something like `100.64.x.x`, that strongly suggests CGNAT.

## Shared Public IP Behavior

Under CGNAT, multiple customers can share the same public IP.

That creates a common question:

```txt
If two customers share the same public IP and both want to host the same port, what happens?
```

The answer is that the ISP NAT layer decides which internal customer gets which public mapping.

Two customers cannot both receive the same public IP and same public port at the same time through the same NAT device.

A unique inbound mapping needs:

```txt
public IP
public port
internal customer/session mapping
```

If the ISP does not create that mapping, neither customer receives unsolicited inbound traffic.

## Example: Two Minecraft Servers Behind CGNAT

Imagine two customers behind the same ISP public IP.

Both want to host:

```txt
102.x.x.x:25565
```

From the internet, that is one address and one port.

The ISP NAT cannot send the same inbound packet to both customers.

Possible outcomes:

- the port is not forwarded to either customer
- the ISP maps that public port to one specific customer
- the ISP maps different public ports to different customers
- inbound traffic is blocked entirely

A customer-side port forward alone does not solve this because the first NAT layer belongs to the ISP.

## What Nmap Shows on a Shared Public IP

If you scan your public IP with Nmap, you are scanning the public-facing address.

Under CGNAT, that address may represent the ISP NAT layer, not only your own router.

This raises another question:

```txt
Will Nmap show ports opened by other customers sharing the same public IP?
```

In theory, Nmap shows whatever is reachable on that public IP from the scanner’s location.

If the ISP has public mappings for other customers on that same IP and those mappings are reachable, they could appear as open ports.

But in practice, many CGNAT setups do not expose arbitrary customer port forwards publicly. The ISP controls the mappings, and unsolicited inbound traffic is usually blocked unless a service/mapping exists.

So an Nmap scan of the public IP does not automatically tell you a clean story about your own router.

It only tells you:

```txt
what is reachable on that public IP from where you scanned
```

It does not prove that every open port belongs to your device.

## Why Local Port Forward Tests Can Mislead

A common mistake is testing from inside the same LAN.

For example:

```txt
home PC → public IP/domain → home server
```

This may work or fail depending on NAT reflection/hairpin NAT.

It does not prove that an outside user can connect.

Better tests:

- test from mobile data
- ask someone outside your network to connect
- use an external port checker
- check actual server logs after the attempt
- compare router WAN IP with public IP

WAN reachability must be tested from outside.

## DDNS Does Not Fix CGNAT

DDNS solves a different problem.

DDNS helps when the public IP changes:

```txt
dynamic public IP
  ↓
domain updates to current IP
```

But if the current IP is the ISP’s shared CGNAT public IP, DDNS only points to that shared address.

It does not create an inbound route through the ISP NAT.

So this can happen:

```txt
DDNS updates correctly
port forwarding is configured correctly
service still unreachable
```

That usually means the problem is not DNS. It is inbound reachability.

## WireGuard and CGNAT

WireGuard can be affected by CGNAT depending on where the server is.

### Home as WireGuard Server

If the home router is behind CGNAT, outside clients may not be able to initiate a connection to it.

Problem:

```txt
phone outside home
  ↓
tries to connect to home public IP
  ↓
ISP CGNAT blocks inbound traffic
```

### VPS as WireGuard Server

A better option is to put the WireGuard server on a VPS with a real public IP.

Then home connects outward to the VPS:

```txt
home router/client
  ↓ outbound tunnel
VPS with public IP
  ↓
remote clients connect to VPS
```

Outbound connections usually work through CGNAT.

This is often the cleanest workaround.

## Self-Hosting Options Under CGNAT

When direct inbound hosting is blocked, the practical options are:

### 1. Ask ISP for Public IP

Some ISPs offer:

- real public IPv4
- static public IPv4
- dynamic public IPv4
- business plan with public IP

This is the most direct fix if available.

### 2. Use IPv6

If the ISP gives real IPv6 and firewall rules are configured correctly, inbound hosting may be possible over IPv6.

But clients must also support IPv6.

### 3. Use a VPS Tunnel

Host a small VPS with a public IP and tunnel traffic back home.

Options include:

- WireGuard tunnel
- reverse SSH tunnel
- reverse proxy over VPN
- FRP-style tunnel
- Tailscale/Headscale-style overlay
- Cloudflare Tunnel for web services

### 4. Use a Mesh VPN

Tools like a mesh VPN can make private access easier without exposing public ports.

This is good for admin access, but less ideal for public game servers unless every player joins the mesh.

### 5. Host Public Services on VPS

For game servers or public services, sometimes the simpler answer is:

```txt
host it on a VPS
```

Home hosting is useful, but not always worth fighting the ISP network.

## Public Game Servers Under CGNAT

Game servers are often where CGNAT becomes obvious.

For a public game server, players need to reach:

```txt
public IP or domain + port
```

If CGNAT blocks inbound traffic, players cannot connect directly.

Possible solutions:

- request public IP from ISP
- host the game server on VPS
- use a VPS as a UDP relay/tunnel if practical
- use a VPN/mesh network for private friend servers
- choose a game/server platform with built-in relay/NAT traversal if available

For public community servers, VPS hosting is often more reliable.

For private friends-only servers, a mesh VPN can be enough.

## Port 22, 80, and 443 Scans

If Nmap shows ports like:

```txt
22
80
443
```

those ports reveal services that respond on the scanned address.

Possible inferences:

- `22` usually suggests SSH
- `80` usually suggests HTTP
- `443` usually suggests HTTPS
- service banners may reveal software/version if not hidden
- TLS certificates may reveal hostnames
- HTTP headers may reveal server type
- web pages may reveal stack or app identity

But a port scan does not automatically reveal the valid SSH username.

Attackers can guess common usernames, but Nmap does not magically know the correct account.

What they can often learn is:

```txt
there is an SSH service here
it may expose a banner
it may allow password or key auth
it may reveal implementation details
```

That is enough to justify hardening SSH.

## SSH Exposure Notes

If SSH is publicly exposed, good basics include:

- disable password login if possible
- use key-based authentication
- disable root login where practical
- use firewall allowlists if possible
- use fail2ban or equivalent if appropriate
- keep OpenSSH updated
- avoid exposing SSH publicly if VPN access is possible
- check service banners
- monitor logs

Security should focus on reducing access paths and making authentication strong.

Changing the port can reduce noise but does not replace proper hardening.

## Router Port Forwarding vs Firewall Rules

On OpenWrt, a port forward is not just a cosmetic setting.

A working port forward needs:

- correct WAN zone
- correct destination zone
- correct protocol TCP/UDP
- correct external port
- correct internal IP
- correct internal port
- target device listening
- upstream public reachability

If any of those are wrong, the service may appear closed.

Under CGNAT, all of those can be correct and the service can still be unreachable because the ISP NAT is in front.

## Testing Checklist

### Check WAN Address

Compare:

```txt
router WAN IP
external public IP
```

If they differ and WAN is private/CGNAT, suspect CGNAT.

### Check Service Locally

From LAN:

```txt
can I connect to the service by local IP?
```

If local access fails, fix the service first.

### Check Router Forward

Confirm:

```txt
protocol
external port
internal IP
internal port
firewall zone
```

### Check From Outside

Use:

- mobile data
- external machine
- trusted friend
- VPS test

Do not rely only on LAN tests.

### Check Logs

Look at:

- router firewall logs if available
- service logs
- game server console
- VPN logs
- connection attempts

If no attempt reaches the service, the block may be upstream.

## Practical Decision Tree

A simple decision tree:

```txt
Need private admin access only?
  → Use WireGuard/Tailscale/VPN.

Need public web app?
  → Use VPS, Cloudflare Tunnel, or reverse proxy through VPS.

Need public game server?
  → Prefer public IP or VPS.

Need home-only service?
  → Keep it LAN/VPN only.

Behind CGNAT and cannot get public IP?
  → Use outbound tunnel or VPS.
```

This avoids wasting time on impossible port-forwarding fixes.

## Practical Decisions

### Do not blame OpenWrt first

If WAN IP is CGNAT, OpenWrt port forwarding may be fine. The missing piece is upstream reachability.

### DDNS is not port forwarding

DDNS solves changing addresses, not blocked inbound paths.

### Test externally

Local tests are not enough for public access.

### Prefer VPN for admin panels

Admin dashboards, Proxmox, router panels, databases, and SSH should not be exposed directly if VPN access is possible.

### Use VPS when public reliability matters

For a serious public service, a VPS with a real public IP is usually cleaner than fighting CGNAT.

## What A Finished Explanation Should Show

A strong finished note should show:

- CGNAT topology
- difference between router WAN IP and public IP
- why port forwarding fails
- why shared public IPs cannot map one port to multiple customers
- what Nmap can and cannot prove
- why DDNS does not solve CGNAT
- practical alternatives
- testing checklist
- decision tree for self-hosting options

## Evidence Worth Capturing

Useful evidence for this note would include:

- router WAN IP screenshot with sensitive parts hidden
- external public IP check with sensitive parts hidden
- OpenWrt port forward example
- failed external port test
- successful local service test
- traceroute or path notes if useful
- Nmap result with interpretation
- VPS tunnel diagram
- WireGuard topology diagram
- ISP public IP/CGNAT notes

## Technical Assumptions

This note assumes a home user is trying to self-host services from a residential connection.

It assumes the ISP may place the customer behind CGNAT.

It also assumes the user controls their home router/OpenWrt configuration but does not control the ISP NAT layer.

## Key Risks

- assuming a port forward works because it is configured
- testing only from LAN
- confusing DDNS with inbound reachability
- exposing SSH or admin panels publicly
- thinking Nmap open ports always belong to your router
- trying to host public services on a connection that cannot receive inbound traffic
- ignoring UDP vs TCP differences
- not checking server logs during tests
- relying on dynamic IP without update mechanism
- choosing complicated tunnels when a VPS would be simpler

## Current State

This note represents the practical understanding needed before self-hosting from a home network.

It connects to OpenWrt, WireGuard, DDNS, game servers, public ports, and ISP limitations.

The main value is avoiding wasted troubleshooting when the real blocker is not the local server, but the ISP network path.

## What This Note Does Not Claim

This note does not claim CGNAT is bad for every user.

It does not claim every ISP setup behaves the same.

It does not claim that home hosting is impossible under all CGNAT conditions.

It explains why direct inbound hosting often fails and how to choose the right workaround.

## Practical Takeaway

The important lesson is:

> A service can be perfectly configured locally and still be unreachable from the internet if the public route does not reach your router.

For self-hosting, always verify:

- router WAN IP
- public IP
- local service availability
- correct protocol/port
- external reachability
- ISP/CGNAT status

After that, choose the right path:

```txt
public IP
IPv6
VPS
VPN
tunnel
or local-only access
```

That makes the troubleshooting practical instead of guessing.
