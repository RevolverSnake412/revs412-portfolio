---
resume: false
title: "AdGuard Home on OpenWrt"
slug: "adguard-home-on-openwrt"
summary: "Field notes from running AdGuard Home on OpenWrt, including DNS ownership, port 53 conflicts, resolver failures, and practical troubleshooting."
resumeSummary: >-
  Documented the design and troubleshooting of running AdGuard Home on an OpenWrt router as the network DNS filtering layer. The note maps DNS ownership between AdGuard Home, dnsmasq, DHCP advertisements, local names, upstream resolvers, firewall rules, and LAN clients, with emphasis on port 53 conflicts and failure isolation. It provides a repeatable way to verify the full resolver path, recover from broken local resolution, and preserve a clear division of responsibility between routing, DHCP, and DNS filtering.
category: "Networking"
tags:
  - adguard-home
  - openwrt
  - dns
  - dnsmasq
  - resolver
  - networking
  - troubleshooting
date: "2026-07-06"
updated: "2026-07-25"
featured: true
published: true
seoTitle: "AdGuard Home on OpenWrt"
seoDescription: "A practical note about running AdGuard Home on OpenWrt, debugging DNS failures, port 53 conflicts, resolver behavior, and client DNS paths."
---

## Why This Note Exists

DNS filtering is useful until DNS itself becomes the thing that breaks.

AdGuard Home can turn an OpenWrt router into a network-wide DNS filtering device. That makes browsing cleaner, blocks unwanted domains, and gives visibility into what devices are resolving.

But when AdGuard Home runs on the same router that also handles DHCP, routing, firewall rules, and local services, DNS ownership needs to be clear.

This note documents the practical side of running AdGuard Home on OpenWrt: what should listen on port 53, how clients should reach DNS, what happens when local resolution fails, and how to debug the problem without guessing.

## Network Context

The setup is an OpenWrt router running local network services.

AdGuard Home is used as the DNS filtering layer for clients on the LAN.

In this kind of setup, several components can touch DNS:

- AdGuard Home
- OpenWrt `dnsmasq`
- DHCP options
- `/etc/resolv.conf`
- upstream DNS resolvers
- local clients
- firewall rules
- listening interfaces and ports

The main question is simple:

> Who owns DNS on the router, and where do clients send DNS requests?

If that is unclear, failures become confusing.

## What This Setup Is Meant To Prove

- DNS filtering should be treated as infrastructure, not just an extra app
- port 53 ownership must be intentional
- `dnsmasq` and AdGuard Home need clear roles
- resolver failures should be debugged layer by layer
- clients may be connected but unable to browse if DNS is broken
- local and upstream DNS tests tell different stories
- a router running DNS filtering needs a recovery path

## Tools and Areas Used

### DNS Layer

- AdGuard Home
- OpenWrt `dnsmasq`
- DHCP DNS advertisement
- upstream DNS resolvers
- local domain resolution direction
- DNS filtering rules

### OpenWrt Layer

- LuCI
- SSH
- service management
- logs
- network configuration
- firewall zones
- interface binding

### Troubleshooting Tools

- `nslookup`
- `ping`
- `netstat`
- `ss`
- `logread`
- service restart commands
- OpenWrt network and DHCP settings

## Intended Build

The intended setup is a network where LAN clients use AdGuard Home as their DNS resolver.

AdGuard Home should:

- listen on the correct router address
- receive DNS queries from LAN clients
- forward allowed queries to upstream DNS
- block/filter unwanted domains
- show query logs
- avoid conflict with OpenWrt DNS services
- continue working predictably after reboot

OpenWrt should still handle routing, firewall, and DHCP. Depending on the chosen design, `dnsmasq` may handle DHCP only, or DNS forwarding may be adjusted so AdGuard Home owns the DNS path.

## Core DNS Roles

### AdGuard Home Role

AdGuard Home is the filtering DNS resolver.

It should receive client DNS queries, apply filtering rules, and forward allowed queries to upstream resolvers.

Important settings:

- listening address
- listening port
- upstream DNS
- bootstrap DNS if needed
- client visibility
- filtering rules
- query logs
- cache behavior

### `dnsmasq` Role

OpenWrt normally uses `dnsmasq` for DHCP and DNS.

When AdGuard Home is added, `dnsmasq` can still be useful for DHCP, but DNS service ownership must be planned.

Possible approaches:

1. AdGuard Home listens on port 53 and `dnsmasq` DNS is moved/disabled.
2. `dnsmasq` listens on another port and forwards to AdGuard.
3. Clients use AdGuard directly through DHCP options.

The exact design matters less than consistency.

### DHCP Role

DHCP tells clients which DNS server to use.

If clients are supposed to use AdGuard Home, DHCP should advertise the correct router/DNS address.

If DHCP still points clients somewhere else, AdGuard may be running but not actually used.

## Delivery Scope

### 1. Install and Run AdGuard Home

Install AdGuard Home and confirm the service starts.

The service should be reachable through its web interface and should survive reboots.

### 2. Decide DNS Ownership

Decide whether AdGuard Home or `dnsmasq` listens on port 53.

This is the most important decision because both services cannot own the same address and port at the same time.

A port conflict can make DNS fail silently or inconsistently.

### 3. Configure Listening Address

AdGuard Home should listen where clients can reach it.

For a LAN router setup, that may be:

```txt
192.168.1.1:53
```

or another LAN router address depending on the network.

If AdGuard listens only on localhost, LAN clients may not reach it.

If AdGuard listens on the wrong interface, the router itself may resolve but clients may fail, or the opposite.

### 4. Configure Upstream DNS

AdGuard needs upstream resolvers to answer allowed queries.

Examples could include public DNS providers or ISP DNS, depending on preference.

The important part is that upstream DNS works independently of the local filtering path.

### 5. Configure DHCP DNS Advertisement

Clients should receive the correct DNS server through DHCP.

If the router IP is the DNS server, clients should query the router. If another DNS path is used, DHCP should reflect that.

After changing DHCP DNS settings, clients may need to reconnect or renew their lease.

### 6. Test Local and Client Resolution

Test both from the router and from a client device.

Router test:

```bash
nslookup example.com 127.0.0.1
nslookup example.com 192.168.1.1
nslookup example.com 1.1.1.1
```

Client test:

```bash
nslookup example.com
nslookup example.com 192.168.1.1
```

The goal is to know exactly where DNS works and where it fails.

## Practical Decisions

### Do not leave port 53 ambiguous

Port 53 should have one clear owner on the relevant address.

Check what is listening:

```bash
netstat -lnup | grep ':53'
```

or:

```bash
ss -lnup | grep ':53'
```

If AdGuard Home is listening on `192.168.1.1:53`, then testing `127.0.0.1:53` may fail unless AdGuard is also bound to localhost.

That difference matters.

### Separate DHCP from DNS mentally

DHCP and DNS are often handled by the same service, but they are not the same job.

It is possible to keep `dnsmasq` for DHCP while changing how DNS is handled.

### Test upstream DNS separately

If upstream DNS fails, AdGuard cannot resolve allowed domains.

If upstream DNS works but local DNS fails, the issue is likely local binding, port ownership, firewall, or DHCP client path.

### Keep a fallback path

If AdGuard Home breaks, the whole network may look broken.

It helps to know how to temporarily restore DNS through `dnsmasq` or public DNS until the filtering path is fixed.

## Troubleshooting Notes

### DNS Completely Fails

Symptoms:

- websites do not load
- clients show internet connected but pages fail
- `nslookup` times out
- router package updates fail because domain names cannot resolve

Things to test:

```bash
ping 1.1.1.1
nslookup downloads.openwrt.org
nslookup downloads.openwrt.org 1.1.1.1
netstat -lnup | grep ':53'
logread | grep -i dns
```

If `ping 1.1.1.1` works but `nslookup` fails, the internet path may be fine and DNS is the broken layer.

### `nslookup 127.0.0.1` Fails

Example symptom:

```txt
nslookup: write to '127.0.0.1': Connection refused
```

This can happen if no DNS service is listening on `127.0.0.1:53`.

If AdGuard Home is listening on the LAN address only, such as:

```txt
192.168.1.1:53
```

then localhost queries may fail while LAN-address queries work.

Test:

```bash
nslookup example.com 192.168.1.1
```

Do not assume localhost and LAN IP behave the same.

### Port 53 Conflict

Symptoms:

- AdGuard Home fails to start DNS
- `dnsmasq` or AdGuard logs show bind errors
- DNS works sometimes but not consistently
- service restart changes behavior

Check:

```bash
netstat -lnup | grep ':53'
```

Only one service should bind the same address and port.

Common conflict:

```txt
dnsmasq wants :53
AdGuard Home wants :53
```

Decide which service owns DNS and configure the other accordingly.

### Clients Not Using AdGuard

AdGuard Home may be running, but clients may still use another DNS server.

Signs:

- AdGuard query log is empty
- blocking rules do not apply
- client DNS server points to ISP/router/other address
- DHCP still advertises another DNS server

Check on a client:

```bash
nslookup example.com
```

Then check which DNS server the client is using.

### Router Cannot Resolve Package Sources

Example issue:

```txt
apk update
wget failed
nslookup downloads.openwrt.org fails
```

This means the router itself cannot resolve names.

Possible causes:

- `/etc/resolv.conf` points somewhere unreachable
- local DNS service not listening where the router queries
- AdGuard upstream DNS broken
- firewall issue
- wrong DNS binding

Test with an explicit resolver:

```bash
nslookup downloads.openwrt.org 1.1.1.1
```

If explicit public DNS works, the router’s default resolver path is the issue.

## Example Working Direction

One clean direction is:

```txt
AdGuard Home listens on: 192.168.1.1:53
Clients receive DNS:     192.168.1.1
AdGuard upstream DNS:    public or chosen upstream resolvers
dnsmasq handles:         DHCP, not conflicting DNS
```

This is only an example. The exact configuration depends on how OpenWrt and AdGuard are set up.

The important thing is that the DNS path is intentional.

## What A Finished Setup Should Show

A strong finished setup should show:

- AdGuard Home running after reboot
- AdGuard listening on the intended address and port
- no port 53 conflict
- clients receiving the correct DNS server
- queries visible in AdGuard logs
- upstream DNS working
- blocked domains actually blocked
- router package/update resolution working
- fallback recovery method documented
- DNS tests from both router and client working

## Evidence Worth Capturing

Useful evidence for this note would include:

- AdGuard Home dashboard screenshot
- DNS settings screenshot
- upstream resolver screenshot
- OpenWrt DHCP/DNS settings screenshot
- `netstat -lnup | grep ':53'` output
- `nslookup` tests from router
- `nslookup` tests from client
- query log screenshot
- blocked domain test
- service status output
- notes showing the chosen DNS ownership model

## Technical Assumptions

This setup assumes the router is intended to be the DNS point for LAN clients.

It assumes that AdGuard Home is stable enough to act as a network-wide DNS resolver.

It also assumes that the person maintaining the network understands how to restore basic DNS if AdGuard Home stops or is misconfigured.

## Key Risks

- AdGuard and `dnsmasq` fighting over port 53
- clients not actually using AdGuard
- router itself failing to resolve names
- upstream DNS misconfiguration
- AdGuard binding only to an unexpected interface
- losing internet usability because DNS filtering service is down
- blocking domains needed for updates or apps
- changing DHCP DNS settings without renewing clients
- forgetting how to recover DNS after a bad config change

## Current State

AdGuard Home is part of the network’s DNS and filtering direction.

The main value is control and visibility over DNS requests, but it also becomes a dependency. When it fails, the network can look broken even when routing is fine.

This note is connected to the OpenWrt setup because DNS sits at the center of the router’s practical usability.

## What This Note Does Not Claim

This note does not claim that AdGuard Home is required for every home network.

It does not claim that DNS filtering is a replacement for security updates, firewall rules, or safe browsing.

It does not claim that one DNS layout fits every OpenWrt setup.

It is a field note about making DNS filtering understandable and debuggable.

## Practical Takeaway

A working AdGuard Home setup is not only:

> install AdGuard and turn on blocking.

The useful part is knowing the DNS path:

- who listens on port 53
- what address clients use
- what DNS the router itself uses
- where upstream queries go
- how to test from router and client
- how to recover when DNS breaks

That is what makes the setup maintainable.
