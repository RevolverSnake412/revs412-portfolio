---
title: "OpenWrt Home Network Setup"
slug: "openwrt-home-network-setup"
summary: "Field notes from building a practical OpenWrt-based home network with custom routing, DNS filtering, VPN access, VLAN direction, and service troubleshooting."
category: "Networking"
tags:
  - openwrt
  - networking
  - router
  - dns
  - firewall
  - vlan
  - vpn
  - homelab
date: "2026-07-06"
updated: "2026-07-25"
featured: true
published: true
seoTitle: "OpenWrt Home Network Setup"
seoDescription: "A practical field note about building and troubleshooting an OpenWrt home network with routing, DNS, VPN, VLAN planning, and small service hosting."
---

## Why This Note Exists

A home network can stay simple when it only needs Wi-Fi and internet access.

It becomes more interesting when the router also becomes the control point for DNS filtering, VPN access, local services, traffic separation, port forwarding, and remote maintenance.

This note documents the direction of an OpenWrt-based home network setup. The focus is not to show that OpenWrt was installed. The focus is to explain how the network was treated as a small system with routing, services, access, failure points, and recovery paths.

## Network Context

The setup is based around an OpenWrt router used as the main controllable network device.

The environment includes:

- fiber internet connection
- ISP router/ONT situation
- OpenWrt router
- managed switch direction
- local services
- DNS filtering
- VPN remote access
- port forwarding where needed
- storage expansion for local services
- troubleshooting across DNS, firewall, and service layers

The setup changed over time, which is normal for a home/lab network. The important part is keeping the network understandable while adding capabilities.

## What This Setup Is Meant To Prove

- a home network can be treated like a small infrastructure system
- OpenWrt gives more control than a normal ISP router
- DNS, firewall, VPN, and local services should be planned together
- troubleshooting should follow layers: device, link, IP, DNS, firewall, service
- adding services to the router increases responsibility and failure impact
- small network changes should be documented because they affect future debugging
- a router can be useful as a learning platform without turning the network into chaos

## Hardware and Tools Used

The exact hardware may change, but this setup involved or considered:

### Network Hardware

- OpenWrt router device
- ISP fiber router/ONT path
- managed Ethernet switch
- local client devices
- optional service devices or mini servers

### OpenWrt Features

- interface configuration
- firewall zones
- DHCP
- DNS forwarding
- port forwarding
- package management
- service management
- storage/overlay expansion
- LuCI web interface
- SSH administration

### Local Services

- AdGuard Home DNS filtering
- WireGuard VPN server
- DDNS direction
- small self-hosted services
- maintenance scripts

### Troubleshooting Tools

- SSH
- LuCI
- `ip`
- `logread`
- `netstat` / `ss`
- `nslookup`
- `ping`
- `traceroute`
- `nmap`
- service logs

## Intended Build

The intended build is a home network where the router is not just passing internet traffic.

It should provide:

- reliable internet routing
- local DHCP/DNS behavior
- DNS filtering
- controlled remote access through VPN
- firewall rules that are understandable
- service access only where needed
- separation direction for home/lab devices
- clean recovery path when DNS or services fail
- enough documentation to debug issues later

The setup should stay practical. It should not become complicated only because OpenWrt allows complexity.

## Core Network Roles

### 1. Main Router Role

OpenWrt acts as the controllable router layer.

This means it handles or can handle:

- WAN connection
- LAN addressing
- DHCP
- DNS forwarding
- firewall rules
- port forwarding
- VPN access
- local service exposure
- network debugging

The router becomes the place where network decisions are made.

### 2. DNS Role

DNS is one of the most important parts of the setup because when DNS breaks, many things look like the internet is broken even when routing still works.

The setup includes DNS filtering through AdGuard Home, with attention to:

- what listens on port 53
- whether clients use the router as DNS
- whether OpenWrt or AdGuard owns DNS resolution
- fallback behavior when AdGuard fails
- avoiding conflicts between `dnsmasq` and AdGuard Home

### 3. VPN Role

WireGuard provides remote access back into the network.

The goal is to avoid exposing sensitive admin services directly to the internet.

VPN access is useful for:

- managing the router remotely
- reaching local services
- accessing lab devices
- reducing the need for direct public exposure
- testing internal services from outside

### 4. Service Host Role

The router can run small services, but this creates a trade-off.

Running services directly on the router is convenient, but it also means service problems can affect the network control device.

The setup should keep this in mind:

- critical router functions first
- optional services second
- logs and restart paths documented
- storage space checked
- service failures isolated where possible

### 5. Segmentation Direction

A managed switch and VLAN planning can separate different groups of devices.

Possible directions include:

- main/home devices
- lab or service devices
- guest or isolated devices
- admin-only access paths

Segmentation should be introduced when it solves a real problem, not just because VLANs are available.

## Delivery Scope

### 1. OpenWrt Installation and Base Access

The first working layer is basic access to OpenWrt:

- LuCI reachable
- SSH reachable
- LAN interface working
- clients receiving addresses
- internet routing working
- router configuration backed up where possible

Without this stable base, extra services only make debugging harder.

### 2. WAN and ISP Integration

The WAN side depends on the ISP setup.

Important checks include:

- how the ISP device is connected
- whether OpenWrt is behind the ISP router or directly handling WAN
- whether PPPoE is involved
- whether VLAN tagging is required
- whether the public IP is reachable or behind CGNAT
- whether port forwarding is possible

These details affect everything else: VPN, remote access, port forwarding, and self-hosted services.

### 3. LAN and DHCP

The LAN side should be predictable.

Important decisions:

- LAN subnet
- DHCP range
- static leases for important devices
- router IP address
- DNS server advertised to clients
- naming devices clearly

Static leases are useful for devices that need firewall rules, DNS names, or service access.

### 4. DNS Filtering with AdGuard Home

AdGuard Home adds filtering and visibility, but it also becomes a dependency.

Important decisions:

- should AdGuard listen directly on port 53?
- should OpenWrt `dnsmasq` keep DHCP only?
- how should upstream DNS be configured?
- what happens if AdGuard stops?
- are clients actually using AdGuard?

A common failure point is a port 53 conflict between AdGuard and the default OpenWrt DNS service.

### 5. WireGuard Remote Access

WireGuard should be configured with clear rules:

- server interface
- client peer
- allowed IPs
- listening port
- firewall rule
- port forwarding if behind another router
- QR code export for phone setup
- access rules to LAN or selected services

The VPN should be tested from outside the local network.

### 6. Firewall and Port Exposure

Firewall rules should stay intentional.

Questions to ask before exposing anything:

- does this service need to be public?
- can it be accessed through VPN instead?
- is the device/service updated?
- is authentication strong?
- is logging available?
- can the rule be removed later?

For most internal services, VPN access is better than public exposure.

### 7. Storage and Package Management

If the OpenWrt device runs extra services, storage matters.

Overlay expansion can make the router more useful, but it also means the device is no longer a minimal router.

Important checks:

- free storage
- package sources
- service data paths
- backup strategy
- SD card or storage reliability
- what breaks if storage fails

### 8. Monitoring and Recovery

A useful setup should include ways to recover from mistakes.

Important recovery methods:

- SSH access
- LuCI access
- configuration backup
- serial access if needed
- known-good network settings
- documented firewall changes
- router reboot/restart commands
- service restart commands
- logs for DNS/VPN/firewall issues

## Practical Decisions

### Keep the router understandable

OpenWrt can do many things, but the router should not become a pile of undocumented services.

Every new service should have a reason, a port, a restart method, and a failure impact.

### Treat DNS as critical infrastructure

DNS filtering is useful, but if DNS fails, users will think the whole network is broken.

The DNS path should be simple enough to explain and debug.

### Prefer VPN over public exposure

If a service is only for personal administration, it should usually be reached through VPN.

Public port forwarding should be intentional and limited.

### Add VLANs only when they solve a real problem

VLANs are useful for separation, but they also add debugging complexity.

The design should start from the reason for separation: trust level, device type, service role, or guest isolation.

### Document ISP-specific details

ISP details matter because they affect WAN, PPPoE, VLANs, CGNAT, public IP behavior, and port forwarding.

These details should be recorded because they are easy to forget and painful to rediscover.

## Troubleshooting Notes

### DNS Failure

Symptoms:

- websites do not load
- `ping 1.1.1.1` works but domain names fail
- `nslookup` times out
- clients show connected but cannot browse normally

Things to check:

```bash
nslookup example.com
nslookup example.com 1.1.1.1
netstat -lnup | grep ':53'
logread | grep -i dns
```

Likely causes:

- AdGuard not listening
- `dnsmasq` conflict
- wrong upstream DNS
- firewall blocking DNS
- clients not using router DNS
- local service bound to the wrong interface

### WireGuard Not Reachable

Symptoms:

- peer shows no handshake
- VPN works locally but not outside
- port scan does not show expected UDP access
- phone cannot connect on mobile data

Things to check:

```bash
wg show
logread | grep -i wireguard
```

Likely causes:

- firewall rule missing
- port forwarding missing on upstream router
- wrong endpoint
- CGNAT
- wrong allowed IPs
- client route mismatch

### Port Forwarding Not Working

Things to check:

- is the service listening locally?
- is the port forwarded to the correct internal IP?
- is the ISP router also forwarding?
- is the public IP really public?
- is the service TCP or UDP?
- is a local firewall blocking it?
- are you testing from outside the network?

A port appearing closed does not always mean OpenWrt is wrong. The upstream ISP/router path may be the problem.

### Service Running but Not Accessible

Things to check:

```bash
service <name> status
logread -e <name>
netstat -lntup
```

Possible causes:

- service bound to localhost only
- firewall zone mismatch
- wrong port
- wrong interface
- service crashed
- missing environment/config file
- DNS points to the wrong address

## What A Finished Setup Should Show

A strong finished version of this network should show:

- OpenWrt running reliably as the main router/control layer
- clients receiving correct DHCP settings
- DNS filtering working intentionally
- WireGuard remote access tested externally
- firewall rules documented
- public exposure minimized
- important devices using static leases
- service ports known and documented
- backup/recovery path available
- optional VLANs designed around real separation needs
- ISP-specific WAN details recorded

## Evidence Worth Capturing

Useful evidence for this note would include:

- network diagram
- OpenWrt interface screenshots
- firewall zone screenshots
- DHCP/static lease screenshots
- AdGuard Home dashboard screenshot
- WireGuard peer screenshot
- VPN QR generation screenshot
- port forwarding screenshots
- `wg show` output with sensitive data removed
- DNS test results
- storage/overlay screenshot
- notes about ISP router/ONT/WAN behavior

## Technical Assumptions

This setup assumes the OpenWrt device is powerful and stable enough for the services being added.

It also assumes that the network owner understands that adding DNS filtering, VPN, and local services to the router increases the router’s importance.

The setup assumes that some services are better reached through VPN instead of being exposed publicly.

## Key Risks

- DNS misconfiguration breaking normal browsing
- exposing admin services to the internet
- losing access after firewall changes
- WAN behavior changing after ISP router updates
- CGNAT blocking inbound access
- storage failure if services depend on expanded overlay
- undocumented VLAN/firewall changes causing future confusion
- running too many services on the router
- relying on a single device for routing, DNS, VPN, and services
- forgetting to back up configuration before major changes

## Current State

The OpenWrt network setup is an evolving home/lab infrastructure.

The current value is not a perfect final architecture. The value is in building a controllable network where DNS, VPN, firewall, services, and troubleshooting are understood as connected parts.

This setup also creates a base for future notes about AdGuard Home, WireGuard, DDNS, port forwarding, Docker/service deployment, and network segmentation.

## What This Note Does Not Claim

This note does not claim that every home network should be built this way.

It does not claim that OpenWrt should run every possible service.

It does not claim that VLANs, VPNs, or DNS filters are always needed.

It is a field note about building a practical controllable network and learning from the problems that appear when a home router becomes a small infrastructure device.

## Practical Takeaway

A good OpenWrt setup is not about enabling every advanced feature.

The useful part is having control and understanding:

- how clients get addresses
- where DNS is handled
- what traffic is allowed
- what is exposed publicly
- how remote access works
- where services run
- how to recover when something breaks

That is what makes the network maintainable instead of just customized.
