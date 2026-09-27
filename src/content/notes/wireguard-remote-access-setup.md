---
resume: false
title: "WireGuard Remote Access Setup"
slug: "wireguard-remote-access-setup"
summary: "Field notes from setting up WireGuard remote access for a home/lab network, including peer configuration, firewall rules, QR setup, and external testing."
resumeSummary: >-
  Documented a WireGuard remote-access deployment for a home or lab network, including server and peer configuration, key management, allowed-address design, firewall rules, client QR provisioning, and testing from outside the LAN. The note follows the connection path from endpoint DNS or public address through UDP exposure and handshake verification to access of approved internal resources. It also records common failure modes and security decisions, making remote administration repeatable without confusing a successful VPN handshake with correct route and policy behaviour.
category: "Networking"
tags:
  - wireguard
  - vpn
  - openwrt
  - remote-access
  - firewall
  - networking
date: "2025-02-06"
updated: "2026-07-25"
featured: true
published: true
seoTitle: "WireGuard Remote Access Setup"
seoDescription: "A practical note about setting up WireGuard remote access for a home or lab network with firewall rules, peer configuration, QR setup, and troubleshooting."
---

## Why This Note Exists

Remote access is useful when a network has routers, servers, local services, or lab devices that should not be exposed directly to the internet.

WireGuard is a good fit for this because it is simple, fast, and easier to reason about than many traditional VPN setups.

The goal of this setup is not to make everything public. The goal is the opposite: keep internal services private and access them through a controlled VPN path.

## Network Context

The setup is based around a home/lab network where the router handles local services and network control.

WireGuard is used to connect back into the network from outside, usually from a phone or laptop.

Typical use cases:

- manage the router remotely
- access local services
- reach internal dashboards
- test services without public exposure
- avoid opening unnecessary ports
- maintain servers or devices while away from home

## What This Setup Is Meant To Prove

- remote access should be intentional, not a collection of exposed ports
- VPN access is usually safer than exposing admin services publicly
- firewall rules matter as much as WireGuard keys
- testing must be done from outside the local network
- QR setup makes mobile configuration easier
- CGNAT or upstream routers can block inbound VPN access
- a small VPN setup still needs documentation

## Tools and Areas Used

### VPN Layer

- WireGuard
- private/public key pairs
- peer configuration
- allowed IPs
- endpoint configuration
- handshake testing
- QR export for mobile clients

### Network Layer

- OpenWrt interface configuration
- firewall zone/rule setup
- UDP listening port
- port forwarding if behind an upstream router
- LAN access rules
- routing direction

### Testing Layer

- mobile data testing
- external network testing
- `wg show`
- logs
- port reachability checks
- client route checks

## Intended Build

The intended build is a VPN setup where a remote device can securely connect into the home/lab network.

A finished setup should allow a trusted client device to:

- connect from outside the local network
- receive a VPN address
- reach allowed internal resources
- manage local services through private IPs
- avoid exposing those services publicly
- reconnect reliably after network changes where possible

## Core Concepts

### Server Interface

The WireGuard server interface lives on the router or network gateway.

It has:

- private key
- public key
- listening UDP port
- VPN subnet
- peer definitions
- firewall rules

Example direction:

```txt
WireGuard server: 10.7.0.1/24
Client peer:      10.7.0.2/32
Listening port:   51820 or custom UDP port
```

### Client Peer

The client peer is usually a phone or laptop.

It has:

- private key
- public key
- allowed IPs
- endpoint address
- endpoint port
- DNS option if needed
- persistent keepalive if behind NAT

### Allowed IPs

Allowed IPs decide what traffic goes through the tunnel.

Common choices:

```txt
10.7.0.2/32
```

for the client address on the server side.

For client routing:

```txt
192.168.1.0/24
```

to access only the LAN, or:

```txt
0.0.0.0/0
```

to route all traffic through the VPN.

For a home/lab remote access setup, routing only internal networks is often cleaner unless full-tunnel VPN is needed.

## Delivery Scope

### 1. Create WireGuard Interface

Create a WireGuard interface on the router.

The interface should have its own VPN subnet and key pair.

The server interface should not reuse the normal LAN subnet. It should have a dedicated VPN range so it is easier to understand and firewall.

### 2. Create Peer Configuration

Each client should have its own peer.

A good peer setup includes:

- unique private/public key pair
- unique VPN IP
- clear peer name/comment
- allowed IPs
- persistent keepalive if needed

Avoid sharing one peer across many devices. It makes troubleshooting and revocation harder.

### 3. Configure Firewall Rules

WireGuard needs firewall rules in two directions:

1. allow incoming UDP traffic to the WireGuard listening port
2. allow VPN clients to reach the intended internal networks or services

The VPN should not automatically have access to everything unless that is intentional.

### 4. Handle Upstream Router or ISP Situation

If the OpenWrt router is behind another ISP router, the upstream router must forward the WireGuard UDP port to OpenWrt.

If the ISP connection is behind CGNAT, inbound WireGuard may not work with normal port forwarding.

In that case, alternatives include:

- requesting a public IP
- using a VPS as a relay
- using a tunnel service
- reversing the connection direction
- using another remote-access approach

### 5. Export QR Code for Phone

For mobile setup, QR export is the easiest method.

The QR code should include:

- client private key
- server public key
- endpoint
- allowed IPs
- DNS if needed
- persistent keepalive if needed

The QR code contains sensitive configuration. It should not be shared or stored publicly.

### 6. Test from Outside

Testing must be done from a different network.

Good tests:

- phone on mobile data
- laptop from another Wi-Fi
- external network connection
- not the same local Wi-Fi

A VPN can appear configured correctly while still failing from outside because of firewall, port forwarding, CGNAT, or endpoint issues.

## Practical Decisions

### Use VPN instead of exposing admin services

Router panels, dashboards, SSH, and local services should usually stay private.

WireGuard gives one controlled access path instead of many exposed ports.

### Give each device its own peer

Separate peers make it easier to revoke one device without breaking others.

It also makes logs and troubleshooting clearer.

### Use a custom UDP port if helpful

A custom port does not replace security, but it can avoid conflicts and reduce noise.

The real security is in WireGuard keys and firewall rules.

### Document the endpoint

The client needs to know where to connect.

The endpoint can be:

```txt
public-ip:port
domain-name:port
ddns-name:port
```

If the public IP changes often, DDNS is useful.

### Test routing separately from handshake

A successful handshake only proves that the VPN connection is established.

It does not prove that LAN access, DNS, or firewall forwarding is correct.

## Example Configuration Shape

This is not a copy-paste config. It shows the structure.

### Server

```ini
[Interface]
Address = 10.7.0.1/24
ListenPort = 51820
PrivateKey = <server-private-key>

[Peer]
PublicKey = <client-public-key>
AllowedIPs = 10.7.0.2/32
```

### Client

```ini
[Interface]
Address = 10.7.0.2/32
PrivateKey = <client-private-key>
DNS = 192.168.1.1

[Peer]
PublicKey = <server-public-key>
Endpoint = example.duckdns.org:51820
AllowedIPs = 192.168.1.0/24
PersistentKeepalive = 25
```

Use the actual LAN subnet, endpoint, and port for the real network.

## Troubleshooting

### No Handshake

Symptoms:

- client says active but no traffic works
- `wg show` shows no latest handshake
- transfer counters stay at zero

Things to check:

```bash
wg show
logread | grep -i wireguard
```

Likely causes:

- wrong endpoint
- wrong port
- UDP port not forwarded
- firewall rule missing
- CGNAT
- wrong public key
- client not actually on external network
- upstream router blocking inbound traffic

### Handshake Works but LAN Access Fails

Symptoms:

- `wg show` shows handshake
- client cannot reach router/LAN devices
- VPN IP works but internal resources fail

Likely causes:

- firewall zone does not allow forwarding to LAN
- allowed IPs missing LAN subnet
- client route mismatch
- internal device firewall blocks VPN subnet
- wrong LAN subnet in client config
- DNS points to the wrong server

### Works on One Network but Not Another

Likely causes:

- restrictive network blocks UDP
- endpoint DNS not resolving
- mobile carrier behavior
- public IP changed
- DDNS not updated
- upstream NAT issue

### DNS Does Not Work Through VPN

Symptoms:

- IP access works
- domain names do not resolve

Things to check:

- client DNS setting
- router DNS service
- AdGuard/dnsmasq listening address
- firewall allows DNS from VPN subnet
- DNS server reachable over VPN

## Security Notes

WireGuard is secure when configured properly, but the surrounding network still matters.

Good practices:

- keep private keys private
- use one peer per device
- remove old peers
- do not share QR codes publicly
- avoid full LAN access unless needed
- prefer VPN for admin services
- keep router firmware updated
- document exposed UDP port
- monitor unknown connection attempts where possible

## What A Finished Setup Should Show

A strong finished setup should show:

- WireGuard interface active
- client peer created
- QR code generated for phone setup
- external handshake confirmed
- LAN access tested
- DNS behavior tested if needed
- firewall rules documented
- upstream port forwarding documented if used
- DDNS endpoint documented if used
- known limitations recorded

## Evidence Worth Capturing

Useful evidence for this note would include:

- WireGuard interface screenshot
- peer configuration screenshot with keys hidden
- QR generation screenshot with QR hidden or blurred
- `wg show` output with keys removed
- firewall rule screenshot
- port forwarding screenshot
- mobile data test result
- DNS test result over VPN
- LAN ping test over VPN
- notes about endpoint/DDNS

## Technical Assumptions

This setup assumes the network has a reachable path from the internet to the WireGuard server.

If the ISP uses CGNAT or inbound traffic is blocked, normal port forwarding may not be enough.

It also assumes that remote clients should not automatically have unrestricted access unless that is deliberately configured.

## Key Risks

- exposing router/admin services instead of using VPN
- sharing one peer across devices
- losing QR/private keys
- allowing too broad internal access
- forgetting upstream router forwarding
- assuming handshake means everything works
- CGNAT preventing inbound connections
- DNS failing even when VPN routing works
- public IP or DDNS changes breaking the endpoint
- not documenting firewall rules

## Current State

WireGuard is a core part of the remote-access direction for the network.

The value is not only that the VPN connects. The value is that it creates a safer maintenance path for local services and infrastructure without exposing everything publicly.

This note connects directly to other network notes such as OpenWrt setup, AdGuard Home, DDNS, and port forwarding.

## What This Note Does Not Claim

This note does not claim that WireGuard is the only valid remote-access method.

It does not claim that every service should be reachable through the VPN.

It does not claim that VPN setup removes the need for firewall planning.

It is a field note about using WireGuard as a practical remote-access layer for a home/lab network.

## Practical Takeaway

A good WireGuard setup is not just keys and a QR code.

The important parts are:

- a clear VPN subnet
- one peer per device
- correct allowed IPs
- correct firewall rules
- external testing
- documented endpoint
- minimal public exposure
- a plan for CGNAT or upstream router issues

That is what makes the VPN useful instead of just technically installed.
