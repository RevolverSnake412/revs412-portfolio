---
resume: false
title: "Raspberry Pi and Banana Pi Infrastructure Planning"
slug: "raspberry-pi-and-banana-pi-infrastructure-planning"
summary: "Field notes from comparing Raspberry Pi and Banana Pi options for OpenWrt routing, VLAN-based networks, VPN access, self-hosted infrastructure separation, and small infrastructure deployments."
resumeSummary: >-
  Evaluated Raspberry Pi and Banana Pi hardware as practical components in a small network and self-hosted infrastructure architecture. The planning compares routing capacity, Ethernet layout, storage, power, OpenWrt support, VLAN and router-on-a-stick use, WireGuard access, managed-switch integration, and isolation requirements rather than selecting boards on specifications alone. It establishes a decision framework for matching hardware to workload and topology, including when a low-power single-board device is sufficient and when better network interfaces or expansion options justify a different platform.
category: "Infrastructure"
tags:
  - raspberry-pi
  - banana-pi
  - openwrt
  - router
  - vlan
  - vpn
  - self-managed-infrastructure
  - networking
  - hardware-planning
  - infrastructure
date: "2025-09-10"
updated: "2026-07-25"
featured: true
published: true
seoTitle: "Raspberry Pi and Banana Pi Infrastructure Planning"
seoDescription: "A practical note about choosing between Raspberry Pi and Banana Pi hardware for OpenWrt routing, VLANs, VPN access, self-hosted infrastructure segmentation, and small infrastructure planning."
---

## Why This Note Exists

This note documents the decision-making process behind choosing small ARM hardware for network infrastructure.

The goal was not only to compare boards by CPU, RAM, or price. The real question was:

```txt
Which device makes sense as a reliable router, VPN endpoint, VLAN gateway, or small infrastructure controller?
```

The hardware options included Raspberry Pi and Banana Pi devices, especially in the context of:

- OpenWrt routing
- VLAN separation
- managed switch setups
- VPN access
- homelab isolation
- small business/server infrastructure
- low-power always-on operation
- avoiding overcomplicated hardware choices

This note is about infrastructure planning, not gadget collecting.

## Project Context

The environment involved a home and small-lab network where the router was more than a basic ISP box.

The network direction included:

- OpenWrt as the main control layer
- VLAN-based separation
- VPN access
- DNS filtering
- self-hosting experiments
- Proxmox/homelab services
- game server hosting experience
- future small-business infrastructure planning

The key devices considered were:

- Raspberry Pi 5
- Banana Pi BPI-R4 family
- Banana Pi BPI-R4 Lite direction
- managed switches
- mini PCs for heavier server workloads

The important design decision was whether the board should act mainly as a router, a service host, or a support device.

## What This Planning Is Meant To Prove

- hardware choice should follow network design
- a board with one Ethernet port can still route VLANs with the right switch
- router-on-a-stick works, but it has tradeoffs
- router-native boards are cleaner for multi-port routing
- VPN, VLANs, DNS, and firewalling should be planned together
- storage and reliability matter for always-on infrastructure
- support/community can matter more than raw specs
- not every workload belongs on the router

## Stack and Tools Considered

### Network Layer

- OpenWrt
- VLANs
- managed switch
- firewall zones
- DHCP
- DNS filtering
- WireGuard
- DDNS
- port forwarding
- router-on-a-stick topology

### Hardware Layer

- Raspberry Pi
- Banana Pi
- ARM boards
- managed switches
- SD cards
- eMMC/NVMe direction
- power supply quality
- cooling
- Ethernet/SFP interfaces

### Service Layer

- AdGuard Home
- WireGuard
- DDNS updater
- small bots/scripts
- monitoring direction
- homelab access control
- server management

## Intended Build

The intended infrastructure direction is a small, low-power network stack that can support:

- internet routing
- VLAN separation
- VPN access
- DNS filtering
- isolated homelab/server network
- safe remote administration
- future expansion
- clear separation between router duties and heavier server duties

A finished design should answer:

```txt
What device routes traffic?
What device switches VLANs?
Where does VPN terminate?
Where do services run?
Where are sensitive systems placed?
What happens if one device fails?
```

## Raspberry Pi as OpenWrt Router

A Raspberry Pi can work as an OpenWrt router, especially when paired with a managed switch.

The typical limitation is Ethernet.

A Raspberry Pi with one Ethernet port can use a router-on-a-stick design:

```txt
ISP/ONT
  ↓
managed switch
  ↓ tagged VLAN trunk
Raspberry Pi running OpenWrt
  ↓ tagged VLAN trunk
managed switch
  ↓
LAN / homelab / server VLANs
```

This can work well when VLANs are configured correctly.

The managed switch becomes essential because traffic for WAN and LAN zones is separated using VLAN tags over the same physical interface.

## Router-on-a-Stick Direction

Router-on-a-stick means one physical network interface carries multiple VLANs.

Example direction:

```txt
eth0.10 → Home LAN
eth0.20 → Homelab LAN
eth0.1141 → WAN / ISP VLAN direction
```

This design can be practical, but it depends on:

- correct VLAN tagging
- managed switch support
- clear port profiles
- OpenWrt interface setup
- firewall zone separation
- avoiding accidental untagged traffic mistakes

The advantage is using one-board hardware effectively.

The disadvantage is that the switch and VLAN config become critical.

## Managed Switch Role

A managed switch is not optional in a VLAN-based router-on-a-stick setup.

The switch handles:

- tagged trunk port to router
- untagged access ports for normal devices
- VLAN separation between networks
- WAN handoff if needed
- homelab/server isolation

Example switch direction:

```txt
Port 1 → router trunk
Port 2 → ISP/ONT WAN VLAN
Port 3 → home LAN untagged
Port 4 → homelab VLAN untagged
Port 5 → server/proxmox VLAN untagged
```

The exact port layout depends on the network, but the principle is the same.

## Banana Pi as Router Hardware

Banana Pi router-focused boards can be more natural for OpenWrt routing because they often target networking use cases more directly than a general Raspberry Pi.

The appeal is:

- more router-like hardware direction
- multiple Ethernet interfaces depending on model
- SFP/SFP+ direction on some boards
- better fit for WAN/LAN separation
- less dependence on router-on-a-stick tricks
- room for expansion depending on model

This can make Banana Pi boards cleaner for a serious router role.

But they also require caution:

- check OpenWrt support status
- check driver maturity
- check community documentation
- check power/cooling
- check availability and price
- check exact board revision
- check whether the specific model matches the needed ports

A strong board on paper is not useful if support is unstable or documentation is weak.

## Banana Pi BPI-R4 Direction

The BPI-R4 direction made sense as a more router-native choice.

It is more aligned with:

- OpenWrt router use
- multi-port networking
- SFP direction
- homelab gateway role
- centralized network control
- future expansion

For a setup that may eventually handle VLANs, VPN, internal services, and more structured routing, a router-focused Banana Pi board can be easier to justify than forcing everything through a single Ethernet port.

The main planning rule:

```txt
Use Raspberry Pi when flexibility and availability matter.
Use Banana Pi router boards when network interfaces and router role matter more.
```

## Banana Pi BPI-R4 Lite Direction

The Lite direction can make sense when the full board is unavailable or too expensive.

But “Lite” should not only be judged by price.

The questions are:

- does it have the ports needed?
- does it support the intended OpenWrt version?
- does it support the needed WAN handoff?
- does it support the planned storage?
- does it support the required throughput?
- does it have enough RAM?
- does the community use it successfully?
- are there known driver issues?

For a startup or early build, using the Lite board can be reasonable if the requirements are clear and the missing features are not needed.

## Raspberry Pi vs Banana Pi Decision

A simple comparison:

| Area | Raspberry Pi Direction | Banana Pi Router Direction |
|---|---|---|
| Best role | flexible small server/router | router-focused gateway |
| Ethernet | often limited | usually stronger networking focus |
| VLAN routing | possible with managed switch | often cleaner with more interfaces |
| Community | very strong general community | more specialized |
| OpenWrt use | workable | often targeted, but check support |
| Availability | often easier depending on market | can be harder locally |
| Expansion | depends on model/HATs/adapters | depends on board design |
| Risk | USB/Ethernet/workaround complexity | support/documentation maturity |
| Best use | lab, VPN, DNS, small services | central router/gateway |

The best choice depends on the role.

## Router vs Server Separation

One important decision is not to overload the router.

A router should prioritize:

- routing
- firewall
- VLANs
- DHCP
- DNS
- VPN
- DDNS
- light monitoring

Heavier workloads should move to:

- mini PC
- Proxmox server
- VPS
- dedicated service host

Examples of workloads that may not belong on the router long-term:

- heavy databases
- large Docker stacks
- game servers
- media servers
- CI/build processes
- large file storage
- public web apps with heavy traffic

A router can run small scripts, but it should remain stable first.

## Mini PC Role

A mini PC can complement the router.

Better split:

```txt
OpenWrt router:
  routing, firewall, VLAN, VPN, DNS

Mini PC / Proxmox:
  applications, databases, dashboards, containers, automation
```

This keeps the network layer reliable while allowing services to grow separately.

For small-business infrastructure, this split is cleaner than using one board for everything.

## VLAN Planning

The infrastructure design should separate traffic by purpose.

Example VLAN direction:

```txt
Home VLAN
Admin VLAN
Homelab/Server VLAN
Guest/IoT VLAN
DMZ if public-facing services exist
```

The exact design should stay simple at first.

Too many VLANs create management overhead.

A practical early structure:

```txt
Home
Homelab/Servers
Guest/IoT
Admin/VPN
```

The goal is to prevent everything from living in one flat network.

## VPN Placement

WireGuard can run on the router or a separate host.

### VPN on Router

Advantages:

- direct access control at network edge
- simple routing to VLANs
- fewer devices
- good for admin access

Risks:

- router workload increases
- mistakes can affect network access
- backup/recovery matters

### VPN on Separate Host

Advantages:

- services separated from router
- easier to rebuild or containerize
- can sit in DMZ/access layer

Risks:

- routing/firewall rules need more care
- more moving parts
- port forwarding may be needed

For small/home infrastructure, VPN on OpenWrt is often practical.

For bigger setups, a dedicated VPN/access gateway can be cleaner.

## DMZ Direction

A DMZ can be useful when hosting public-facing or semi-public entry services.

A clean model:

```txt
Internet
  ↓
Router/firewall
  ↓
DMZ / access layer
  ↓
Private internal services
```

Public-facing services or controlled gateways can sit closer to the edge.

Sensitive services, databases, and admin panels should remain in private networks.

The hardware decision should support this design through VLANs and firewall rules.

## Storage Considerations

Always-on router boards often use SD cards, eMMC, or NVMe depending on model.

Storage matters because:

- logs write over time
- packages need space
- Docker can consume space
- databases write constantly
- sudden power loss can corrupt storage
- SD card quality varies

For a router:

```txt
stable storage > large storage
```

For servers:

```txt
SSD/NVMe preferred
```

Do not run write-heavy services on weak SD cards if reliability matters.

## Power and Cooling

Small boards are sensitive to bad power and heat.

Planning should include:

- quality power supply
- stable voltage
- cooling/heatsink
- airflow
- safe enclosure
- UPS direction if important
- avoiding cheap cables/adapters

Unstable power can look like software failure.

Random crashes, filesystem corruption, and network drops can all come from power/cooling problems.

## Throughput Considerations

Router hardware should be chosen based on expected traffic.

Questions:

- internet speed
- WireGuard speed needed
- inter-VLAN routing load
- SQM/QoS need
- number of clients
- number of firewall rules
- IDS/monitoring plans
- public services or only private access

A board that is fine for basic routing may struggle with heavy VPN encryption, SQM, or high inter-VLAN traffic.

## Availability and Repairability

A technically perfect board is less useful if it is impossible to replace.

Practical buying questions:

- can the board be bought locally or regionally?
- can the power supply be replaced easily?
- are cases/heatsinks available?
- are spare SD/eMMC/storage options available?
- is documentation available?
- do other users run OpenWrt on it successfully?
- can the setup be restored onto another device?

For client or business-facing infrastructure, availability matters.

## Documentation Direction

Infrastructure hardware decisions should be documented clearly.

Useful documentation:

```txt
network diagram
VLAN table
port map
device role list
IP plan
firewall zone summary
VPN access notes
backup/recovery note
hardware list
why this board was chosen
what this board should not do
```

This makes the setup maintainable later.

## Practical Decision Tree

```txt
Need simple OpenWrt router and already have managed switch?
  → Raspberry Pi can work with router-on-a-stick.

Need cleaner router hardware with more network interfaces?
  → Banana Pi router-focused board is stronger.

Need to run heavier services?
  → Use mini PC/Proxmox, not the router board.

Need public/self-hosted services?
  → Consider DMZ/VLAN design and maybe VPS.

Need only VPN + DNS + firewall?
  → Keep router simple and stable.
```

## Practical Decisions

### Do not choose hardware only by specs

Support, documentation, and replacement availability matter.

### Router should stay boring

The router should be stable before it is clever.

### Separate heavy services

Use the router for network control and a mini PC/server for applications.

### Use VLANs deliberately

VLANs should solve real separation needs, not create confusion.

### Plan for recovery

If the router board dies, the network should be recoverable from documentation and backups.

### Check support before buying

Especially for Banana Pi/router-focused boards, verify the exact board revision and OpenWrt support direction before committing.

## What A Finished Plan Should Show

A strong infrastructure plan should show:

- selected router device
- reason for choosing it
- WAN/LAN/VLAN design
- managed switch port map
- VPN placement
- DNS filtering placement
- server/homelab separation
- storage choice
- cooling/power choice
- backup/recovery direction
- what services run where
- what is intentionally not exposed

## Evidence Worth Capturing

Useful evidence for this note would include:

- hardware photos
- OpenWrt dashboard screenshot
- VLAN interface list
- switch VLAN configuration screenshot
- network diagram
- WireGuard status
- DNS filtering status
- storage usage
- port map table
- mini PC/router role split
- before/after topology comparison

## Technical Assumptions

This note assumes the infrastructure is for a home lab, small network, or small-business style environment.

It assumes OpenWrt is used as the routing/firewall layer.

It assumes the hardware choice must balance cost, availability, support, ports, and future expansion.

It also assumes that not every service should run on the router itself.

## Key Risks

- relying on router-on-a-stick without understanding VLAN tagging
- choosing a board with weak OpenWrt support
- overloading the router with heavy services
- using bad power supplies
- running write-heavy services on weak SD cards
- buying hardware based only on theoretical specs
- creating too many VLANs too early
- no port map documentation
- no backup of OpenWrt config
- exposing admin services instead of using VPN
- choosing unavailable hardware for a client-facing setup

## Current State

This note represents the hardware and infrastructure planning direction behind choosing Raspberry Pi or Banana Pi devices for OpenWrt and small-network deployments.

The strongest value is the decision framework:

```txt
router role
switch role
server role
VPN role
VLAN design
storage/reliability
support/availability
```

That is more useful than a simple “which board is better” comparison.

## What This Note Does Not Claim

This note does not claim one board is always better.

It does not claim Raspberry Pi is a perfect router.

It does not claim Banana Pi is automatically production-ready without checking support.

It documents practical infrastructure planning around small ARM boards, OpenWrt, VLANs, VPN access, and homelab/small-business network design.

## Practical Takeaway

The useful lesson is:

> Choose the hardware based on the network role, not the product name.

A clean setup separates responsibilities:

```txt
router → routing, firewall, VPN, DNS
switch → VLAN access/trunks
server/mini PC → applications and heavy services
DMZ/private networks → exposure boundaries
```

That makes the infrastructure easier to understand, expand, and recover.
