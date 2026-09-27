---
resume: false
title: "Isolated Dedicated-Server Hosting"
slug: "isolated-dedicated-server-hosting"
summary: "Field notes from hosting a dedicated service at home behind an isolated VLAN, using an OpenWrt router, managed-switch tagging, and a Proxmox server."
resumeSummary: >-
  Designed a home-hosted dedicated-service environment that keeps externally exposed workloads separate from the primary LAN. The architecture uses OpenWrt routing, managed-switch VLAN tagging, router-on-a-stick configuration, firewall zones, and a Proxmox host to define physical and logical boundaries between services, administration, and trusted devices. The note covers addressing, port exposure, traffic rules, and host placement, demonstrating how segmentation limits the effect of a compromised or unstable public-facing workload without making the environment impossible to operate.
category: "Server Hosting"
tags:
  - dedicated-server
  - proxmox
  - openwrt
  - vlan
  - tplink
  - tl-sg105e
  - home-server
  - server-hosting
  - networking
  - backups
date: "2026-07-08"
updated: "2026-07-25"
featured: true
published: true
seoTitle: "Isolated Dedicated-Server Hosting Behind a VLAN"
seoDescription: "A practical note about hosting a dedicated service at home through a VLAN-isolated Proxmox setup using OpenWrt, router-on-a-stick networking, managed-switch tagging, port forwarding, and backups."
---

## Why This Note Exists

This was the only dedicated service I hosted from home instead of on a VPS.

The important part was not only that a dedicated service was running. The useful part was the network design around it: the server lived behind an isolated homelab/server VLAN, hosted from the Proxmox side, while the normal home network stayed separated.

The setup used a Raspberry Pi 5 running OpenWrt as the router, with a TP-Link TL-SG105E managed switch handling VLAN tagging.

That made the project more than a dedicated service. It became a practical home infrastructure setup involving router-on-a-stick networking, VLAN separation, Proxmox hosting, firewall rules, port forwarding, and data persistence.

## Server Context

The dedicated service was hosted at home.

The environment included:

- home internet connection
- Raspberry Pi 5 running OpenWrt as the main router
- single-Ethernet router-on-a-stick style routing
- TP-Link TL-SG105E managed switch
- VLAN tagging on the switch
- Home VLAN 10
- Homelab/Server VLAN 20
- Proxmox server connected to the isolated server VLAN
- dedicated service running from the Proxmox environment
- UDP port forwarding for application stack
- firewall separation between home devices and server devices
- data persistence and backups

This setup is distinct from the later VPS-hosted services. It belongs to the home-infrastructure and homelab side of the work.

## What This Setup Is Meant To Prove

- a home network can host a public-facing service without staying flat
- VLAN tagging on a small managed switch is useful even in a home setup
- a Raspberry Pi 5 with OpenWrt can act as the router/firewall control point
- Proxmox can provide the compute layer for small self-hosted services
- a server VLAN reduces exposure to normal home devices
- port forwarding should expose only the required service ports
- firewall rules should define what the server VLAN can and cannot reach
- service data files need backups because the dedicated service is stateful
- home hosting requires more network thinking than VPS hosting

## Stack and Tools Used

### Router and Network Layer

- Raspberry Pi 5
- OpenWrt
- router-on-a-stick networking
- VLAN interfaces
- firewall zones
- DHCP
- port forwarding
- NAT
- TP-Link TL-SG105E managed switch
- VLAN tagging and untagged access ports

### VLAN Layout

- Home VLAN 10
- Homelab/Server VLAN 20
- Home subnet direction: `192.168.10.0/24`
- Server/Homelab subnet direction: `192.168.20.0/24`
- tagged trunk between OpenWrt router and TP-Link switch
- untagged access port for home/AP side
- untagged access port for Proxmox/server side

### Virtualization Layer

- Proxmox server
- VM/container hosting direction
- server attached to the homelab/server VLAN
- persistent storage for service data
- console or SSH management

### application stack Layer

- dedicated service
- Linux server environment
- startup script direction
- service data files
- service name, data set, and access-control configuration
- UDP ports `2456-2458`

### Maintenance Layer

- logs
- backups
- restart workflow
- update workflow
- external connection testing

## Intended Build

The intended build was a home-hosted dedicated service that stayed isolated from the main home LAN.

A finished setup should allow:

- normal home devices to stay on VLAN 10
- homelab/server devices to stay on VLAN 20
- Proxmox to host the dedicated service from the server VLAN
- OpenWrt to route and firewall between VLANs
- the TP-Link switch to tag/untag VLAN traffic correctly
- only application stack UDP ports to be forwarded from WAN
- the server VLAN to be blocked from freely accessing the home VLAN
- admin access to the server to remain controlled
- service data files to persist and be backed up

## Physical and Logical Topology

The practical topology looked like this:

```txt
Internet
  ↓
ISP device / bridge path
  ↓
Raspberry Pi 5 running OpenWrt
  ↓ tagged trunk
TP-Link TL-SG105E managed switch
  ├─ Home VLAN 10 → AP / normal home devices
  └─ Server VLAN 20 → Proxmox server → dedicated service
```

The Raspberry Pi handled routing and firewall decisions.

The TP-Link TL-SG105E handled VLAN tagging and access-port separation.

The Proxmox server lived on the isolated server/homelab side.

## VLAN Design

The key separation was:

```txt
VLAN 10 → Home network
VLAN 20 → Homelab / server network
```

Example subnet direction:

```txt
VLAN 10 Home:          192.168.10.0/24
VLAN 20 Homelab/Server: 192.168.20.0/24
```

The dedicated service belonged to VLAN 20, not the normal home VLAN.

That matters because a public-facing service should not casually sit beside personal devices on the same flat network.

## TP-Link TL-SG105E VLAN Tagging

The TP-Link TL-SG105E was the small managed switch that made the VLAN split possible.

The general switch role:

- one port works as a tagged trunk to the OpenWrt router
- one or more ports act as untagged Home VLAN 10 access ports
- one or more ports act as untagged Homelab/Server VLAN 20 access ports
- PVIDs decide which VLAN untagged traffic belongs to

Example direction:

```txt
Port to OpenWrt/Raspberry Pi: tagged VLAN 10 + VLAN 20
Port to AP/Home side:         untagged VLAN 10, PVID 10
Port to Proxmox/server side:  untagged VLAN 20, PVID 20
```

The exact port numbers can change, but the role of each port must be clear.

The switch is not just a dumb Ethernet splitter here. It is part of the network design.

## OpenWrt Router-on-a-Stick Role

The Raspberry Pi 5 used OpenWrt as the router/firewall control point.

Because the Pi has a single Ethernet interface, the setup follows a router-on-a-stick style design:

```txt
eth0 tagged trunk
  ├─ VLAN 10 interface
  └─ VLAN 20 interface
```

OpenWrt then creates separate logical interfaces for each VLAN.

Example direction:

```txt
Home interface:    br-lan.10 or eth0.10 → 192.168.10.1/24
Homelab interface: br-lan.20 or eth0.20 → 192.168.20.1/24
```

The exact device naming depends on the OpenWrt version and bridge configuration, but the concept is the same.

OpenWrt owns:

- routing between VLANs
- DHCP per VLAN
- DNS direction
- firewall zones
- NAT to WAN
- port forwarding from WAN to server VLAN

## Firewall Design

The firewall is what makes VLAN separation meaningful.

A practical policy:

### Home VLAN 10

Home devices can access the internet.

Home/admin devices may be allowed to access selected server VLAN services for management.

### Server VLAN 20

Server devices can access the internet for updates.

Server devices should not freely initiate connections into the Home VLAN.

### WAN to Server VLAN

WAN should only reach the dedicated service through the required UDP ports.

For application stack:

```txt
UDP 2456-2458 → dedicated service IP on VLAN 20
```

### WAN to Admin Services

Do not expose:

- Proxmox web interface
- OpenWrt LuCI
- SSH
- internal dashboards
- other homelab services

The dedicated service ports are the only intended public exposure.

## Proxmox Role

Proxmox provided the compute layer.

The dedicated service ran from the Proxmox environment, either as a VM or container-style service direction.

The important Proxmox responsibilities were:

- attach the server guest to the correct VLAN/server network
- provide CPU/RAM/storage
- keep service data files persistent
- allow console/SSH access for management
- separate the service from personal devices
- make rebuilding or moving the service easier later

The Proxmox host itself should not be exposed to the internet.

## application stack Server Ports

application stack uses UDP ports.

The exposed port direction:

```txt
2456-2458 UDP
```

The forwarding path should be:

```txt
WAN UDP 2456-2458
  → OpenWrt firewall/NAT
  → dedicated service IP on VLAN 20
```

If users cannot connect, the first checks should be:

- is the dedicated service running?
- is the server listening on the expected port?
- does OpenWrt forward UDP, not TCP?
- does the forward point to the current VLAN 20 server IP?
- does the firewall allow WAN to that destination?
- is the ISP/public IP path reachable?

## Why VLAN Isolation Matters Here

The dedicated service is public-facing. Even if the dedicated service itself is normal, it receives traffic from outside the home network.

That gives it a different trust level than:

- personal PCs
- phones
- AP/home devices
- router admin pages
- private dashboards

The server VLAN limits what happens if the service, guest, or configuration has a problem.

It does not make the setup magically secure, but it reduces unnecessary trust between devices.

## Server Configuration

A dedicated service normally needs:

```txt
server name
data set name
password
port
public/private listing setting
data path
```

The password should not be shown in public screenshots or committed to a repository.

The startup command should be wrapped in a script, for example:

```txt
start_dedicated-service.sh
```

The script makes restart/update work more consistent.

## Persistent Data

The service data files are the most important part of the service.

The server install can be recreated. The service data should not be casually lost.

Important practices:

- know where the service data files are stored
- keep the save path persistent inside the Proxmox guest
- avoid temporary container paths for service data
- back up the service data before updates
- back up before changing VM/container storage
- keep at least one backup outside the active server directory

## Backup Direction

Minimum backup targets:

```txt
application stack service data files
startup script
service file if used
configuration notes
```

Example backup direction:

```bash
tar -czf dedicated-service-backup-$(date +%F).tar.gz /path/to/dedicated-service/service-data
```

For a home-hosted Proxmox setup, backups should not exist only inside the same guest. A copy outside the VM/container is safer.

## Update Workflow

A safe update flow:

1. notify users if needed
2. stop the dedicated service
3. back up the service data files
4. update the server files
5. start the server
6. check logs
7. test from outside the home network
8. keep the backup

For this setup, also verify:

- Proxmox guest IP did not change
- VLAN assignment did not change
- OpenWrt port forward still points to the correct IP
- TP-Link switch port membership still matches the intended VLAN

## External Access Testing

Testing from inside the home network is not enough.

Good tests:

- test from mobile data
- ask a remote user to connect
- verify the public IP/domain points home
- confirm OpenWrt port forwarding
- check application stack logs after connection attempt

LAN testing can hide NAT, firewall, CGNAT, or forwarding problems.

## Practical Decisions

### Keep the dedicated service off the home VLAN

The server was exposed to outside traffic, so it belonged in the homelab/server VLAN, not the home VLAN.

### Use the TL-SG105E for VLAN access ports

The managed switch made a single OpenWrt trunk usable for multiple separated networks.

### Let OpenWrt enforce the rules

The switch separates traffic at Layer 2, but OpenWrt decides routing and firewall behavior between VLANs.

### Expose only application stack UDP ports

No Proxmox, SSH, LuCI, dashboards, or management panels should be public.

### Keep service data backups separate from server install

The service data is the real state. The install can be rebuilt.

### Document port roles

With a small managed switch, it is easy to forget which physical port is trunk, home, or server.

Port roles should be written down.

## Common Failure Points

### VLAN Tagging Wrong on the Switch

Symptoms:

- Proxmox/server gets no IP
- home devices land on wrong subnet
- server cannot reach router
- port forward points correctly but traffic never reaches server

Likely causes:

- wrong tagged/untagged membership
- wrong PVID
- OpenWrt trunk port not tagged for VLAN 20
- Proxmox/server port not untagged VLAN 20
- AP/home port accidentally placed in server VLAN

### OpenWrt VLAN Interface Wrong

Symptoms:

- VLAN exists on switch but not routed
- DHCP missing on one VLAN
- firewall zone missing
- server VLAN has no internet
- inter-VLAN rules behave incorrectly

Likely causes:

- wrong interface device
- wrong bridge VLAN filtering setup
- DHCP not enabled for VLAN 20
- firewall zone not assigned
- NAT/forwarding not allowed where needed

### users Cannot Connect From Outside

Likely causes:

- UDP ports not forwarded
- TCP forwarded by mistake instead of UDP
- forward points to old server IP
- server is on wrong VLAN
- firewall blocks WAN to VLAN 20
- ISP/public IP issue
- CGNAT
- dedicated service not running
- public IP/domain changed

### Server Works Locally but Not Remotely

Likely causes:

- LAN test bypasses WAN path
- NAT reflection confusion
- firewall allows LAN but not WAN
- upstream ISP/router issue
- wrong external test method
- UDP blocked

### Proxmox Guest Network Misconfigured

Likely causes:

- guest attached to wrong bridge
- VLAN tag mismatch
- guest IP on wrong subnet
- static IP conflicts
- Proxmox host bridge not connected to correct switch port
- switch port PVID mismatch

### Service Data Appears Reset

Likely causes:

- wrong data set name
- wrong save path
- storage not persistent
- guest/container path changed
- server started with a new empty service data
- backup restored to wrong location

## What A Finished Setup Should Show

A strong finished setup should show:

- Raspberry Pi 5 running OpenWrt as router/firewall
- TP-Link TL-SG105E handling VLAN tagging
- tagged trunk from OpenWrt to switch
- Home VLAN 10 separated from Server VLAN 20
- Proxmox connected to the server/homelab VLAN
- dedicated service running from the Proxmox side
- UDP `2456-2458` forwarded only to the dedicated service
- server VLAN blocked from freely accessing home VLAN
- admin access controlled from trusted devices
- service data path documented
- backups available
- external connection tested
- no public exposure of Proxmox/OpenWrt/admin services

## Evidence Worth Capturing

Useful evidence for this note would include:

- network diagram
- OpenWrt VLAN interface screenshot
- OpenWrt firewall zone screenshot
- OpenWrt port forwarding screenshot
- TP-Link TL-SG105E 802.1Q VLAN table
- TP-Link TL-SG105E PVID table
- Proxmox network bridge screenshot
- guest IP on VLAN 20
- application stack startup script
- application stack logs
- service data folder listing
- backup archive listing
- external connection test

## Technical Assumptions

This setup assumes the home connection supports inbound access or has a workable port-forwarding path.

It assumes the TP-Link TL-SG105E is configured with correct tagged and untagged VLAN membership.

It assumes OpenWrt owns routing and firewalling between VLANs.

It assumes the Proxmox guest running application stack is placed on VLAN 20 or the intended server network.

It also assumes service data files are stored persistently and backed up before risky changes.

## Key Risks

- wrong switch PVID placing devices in the wrong VLAN
- OpenWrt trunk missing VLAN 20 tagging
- exposing Proxmox management by mistake
- forwarding too many ports
- allowing server VLAN into home VLAN too broadly
- internal server IP changing and breaking the forward
- service data loss from unclear save path
- no backup before updates
- CGNAT or ISP behavior preventing inbound hosting
- testing only from LAN and assuming WAN works
- losing track of physical switch port roles

## Current State

This note represents the home-hosted application stack setup direction.

Unlike the VPS-hosted services, this setup belongs to the home-infrastructure side: Raspberry Pi 5 OpenWrt routing, TL-SG105E VLAN tagging, Proxmox hosting, an isolated server VLAN, port forwarding, and firewall design.

The main value is that the server was not treated as a random process on the home network. It was hosted behind a separated network path with controlled exposure.

## What This Note Does Not Claim

This note does not claim that every dedicated service should be home-hosted.

It does not claim that VLANs are required for every small server.

It does not claim that a home setup is automatically safer than a VPS.

It documents a specific practical setup: a dedicated service hosted at home behind a VLAN-isolated Proxmox network using OpenWrt and a TP-Link TL-SG105E managed switch.

## Practical Takeaway

This project was useful because it combined service hosting with real network design.

The important parts were:

- Raspberry Pi 5 running OpenWrt
- router-on-a-stick VLAN routing
- TP-Link TL-SG105E VLAN tagging
- Home VLAN 10
- Homelab/Server VLAN 20
- Proxmox as the server host
- application stack UDP `2456-2458` forwarding
- firewall separation
- persistent data storage
- backups
- external access testing

That makes it a homelab infrastructure note, not just a dedicated service note.
