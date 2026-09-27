---
resume: false
title: "CGNAT and Self-Managed Infrastructure Limits"
slug: "cgnat-and-self-hosting-limits"
summary: "Field notes explaining how CGNAT affects self-managed infrastructure, port forwarding, public IP scans, shared addresses, and practical alternatives for exposing private services."
resumeSummary: >-
  Produced a practical networking reference explaining why carrier-grade NAT changes the rules for home-hosted services. It distinguishes a router WAN address from a genuinely routable public address, explains why port forwarding and local tests can appear correct while external access fails, and shows what scans reveal when several customers share one public IP. The note evaluates realistic alternatives including VPN-based access, reverse tunnels, relays, and hosted endpoints, while clarifying that dynamic DNS cannot overcome CGNAT by itself.
category: "Networking"
tags:
  - cgnat
  - nat
  - self-managed-infrastructure
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
translations:
  fr:
    title: "CGNAT et limites de l’auto-hébergement"
    category: "Réseau"
    summary: "Notes expliquant l’effet du CGNAT sur l’auto-hébergement, la redirection de port, les analyses d’adresses publiques partagées et les alternatives pratiques."
    resumeSummary: >-
      Il distingue une adresse WAN routeur d'une adresse publique véritablement routable, explique pourquoi
      l'envoi de port et les tests locaux peuvent apparaître corrects alors que l'accès externe échoue, et
      montre ce que les scans révèlent lorsque plusieurs clients partagent une IP publique. La note évalue des
      alternatives réalistes, y compris l'accès basé sur VPN, les tunnels inversés, les relais et les
      terminaux hébergés, tout en précisant que le DNS dynamique ne peut pas surmonter CGNAT par lui-même.
    body: |-

      ## Pourquoi cette note existe

      Cette note explique l'un des problèmes les plus courants dans les infrastructures autogérées : la différence entre avoir accès à Internet et être accessible depuis Internet.

      Un routeur d'origine peut accéder au web normalement tout en restant impossible à atteindre de l'extérieur. Cela arrive souvent à cause de CGNAT.

      CGNAT modifie la façon dont le transfert de port fonctionne, comment les adresses IP publiques se comportent et comment il est réaliste d'accueillir des services publics, des VPN, des applications Web ou des outils d'administration à distance à partir d'un réseau privé.

      Cette note est écrite dans la perspective du dépannage pratique: ce qui se passe, comment le tester, et quelles options existent lorsque l'hébergement entrant est bloqué.

      ## Ce que signifie CGNAT

      CGNAT signifie Carrier-Grade NAT.

      Avec le NAT normal, la disposition est généralement:

      ```txt
      Internet
        ↓
      Public IP on home router
        ↓
      Private LAN devices
      ```

      Avec CGNAT, la disposition devient :

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

      La différence importante est que l'IP public n'est pas directement assigné au routeur client.

      Le FAI possède la couche NAT orientée vers le public, et plusieurs clients peuvent apparaître derrière la même adresse publique.

      ## Pourquoi CGNAT rompt le transfert de port

      Le transfert de port ne fonctionne que lorsque le routeur qui reçoit le trafic public peut le transmettre au dispositif interne.

      Dans une configuration normale:

      ```txt
      WAN public IP:25565
        ↓
      home router port forward
        ↓
      public service
      ```

      En CGNAT:

      ```txt
      WAN public IP:25565
        ↓
      ISP NAT layer
        ↓
      customer router
        ↓
      home server
      ```

      Le client peut configurer le transfert de port sur son propre routeur, mais il ne peut pas configurer la couche NAT ISP.

      Ainsi, le trafic entrant n'atteint jamais le routeur client à moins que le FAI ait créé une cartographie pour ce client.

      C'est pourquoi un port peut être transmis correctement sur OpenWrt et apparaît toujours fermé de l'extérieur.

      ## IP public vs Routeur IP WAN

      Un simple contrôle CGNAT compare:

      ```txt
      public IP shown by an external website
      ```

      avec:

      ```txt
      WAN IP shown on the router
      ```

      S'ils ne correspondent pas, et que le routeur WAN est dans une gamme privée ou CGNAT, alors l'auto-hébergement entrant est probablement bloqué.

      Plages privées communes:

      ```txt
      10.0.0.0/8
      172.16.0.0/12
      192.168.0.0/16
      ```

      Plage commune de CGNAT:

      ```txt
      100.64.0.0/10
      ```

      Si le routeur WAN IP est quelque chose comme `100.64.x.x`, cela suggère fortement CGNAT.

      ## Comportement public partagé en matière de propriété intellectuelle

      Sous CGNAT, plusieurs clients peuvent partager la même IP publique.

      Cela crée une question commune:

      ```txt
      If two customers share the same public IP and both want to host the same port, what happens?
      ```

      La réponse est que la couche NAT ISP décide quel client interne obtient quel mapping public.

      Deux clients ne peuvent pas recevoir en même temps le même IP public et le même port public via le même dispositif NAT.

      Un besoin de cartographie unique en son genre :

      ```txt
      public IP
      public port
      internal customer/session mapping
      ```

      Si le FSI ne crée pas cette cartographie, aucun des clients ne reçoit de trafic entrant non sollicité.

      ## Exemple : Deux services publics derrière le CGNAT

      Imaginez deux clients derrière la même IP publique ISP.

      Les deux veulent accueillir:

      ```txt
      102.x.x.x:25565
      ```

      Depuis Internet, c'est une adresse et un port.

      L'ISP NAT ne peut pas envoyer le même paquet entrant aux deux clients.

      Résultats possibles:

      - le port n'est pas transmis à aucun client
      - le FAI map que le port public à un client spécifique
      - le FAI cartographie différents ports publics à différents clients
      - le trafic entrant est complètement bloqué

      Un seul port côté client ne résout pas cela car la première couche NAT appartient au FAI.

      ## Ce que Nmap montre sur une IP publique partagée

      Si vous scannez votre IP publique avec Nmap, vous scannez l'adresse publique.

      Sous CGNAT, cette adresse peut représenter la couche NAT ISP, pas seulement votre propre routeur.

      Cela soulève une autre question:

      ```txt
      Will Nmap show ports opened by other customers sharing the same public IP?
      ```

      En théorie, Nmap montre ce qui est accessible sur cette IP publique depuis l'emplacement du scanner.

      Si le FAI a des cartes publiques pour d'autres clients sur cette même IP et que ces cartes sont accessibles, elles pourraient apparaître comme des ports ouverts.

      Mais dans la pratique, de nombreuses configurations de CGNAT n'exposent pas les renvois arbitraires du port client. Le FAI contrôle les mappages, et le trafic entrant non sollicité est généralement bloqué à moins qu'un service/mapping existe.

      Ainsi, une analyse Nmap de l'IP public ne vous dit pas automatiquement une histoire propre sur votre propre routeur.

      Il vous dit seulement :

      ```txt
      what is reachable on that public IP from where you scanned
      ```

      Il ne prouve pas que chaque port ouvert appartient à votre appareil.

      ## Pourquoi les tests locaux vers l'avant du port peuvent induire en erreur

      Une erreur courante est de tester depuis le même réseau local.

      Par exemple:

      ```txt
      home PC → public IP/domain → home server
      ```

      Cela peut fonctionner ou échouer en fonction de la réflexion NAT/Hairpin NAT.

      Il ne prouve pas qu'un utilisateur externe peut se connecter.

      De meilleurs tests :

      - essai à partir de données mobiles
      - demander à quelqu'un en dehors de votre réseau de se connecter
      - utiliser un vérificateur de port externe
      - vérifier les journaux du serveur réel après la tentative
      - comparer le routeur WAN IP avec le public IP

      L'accessibilité WAN doit être testée de l'extérieur.

      ## DDNS ne corrige pas CGNAT

      DDNS résout un problème différent.

      DDNS aide lorsque la PI publique change:

      ```txt
      dynamic public IP
        ↓
      domain updates to current IP
      ```

      Mais si l'IP actuel est l'IP public de CGNAT partagé par ISP, DDNS n'indique que cette adresse partagée.

      Il ne crée pas d'itinéraire entrant à travers le NAT du PSI.

      Donc ça peut arriver :

      ```txt
      DDNS updates correctly
      port forwarding is configured correctly
      service still unreachable
      ```

      Cela signifie généralement que le problème n'est pas DNS. Il est accessible à l'intérieur.

      ## WireGuard et CGNAT

      WireGuard peut être affecté par CGNAT selon l'endroit où se trouve le serveur.

      ### Accueil comme serveur WireGuard

      Si le routeur d'origine est derrière CGNAT, les clients extérieurs peuvent ne pas être en mesure d'initier une connexion à celui-ci.

      Problème:

      ```txt
      phone outside home
        ↓
      tries to connect to home public IP
        ↓
      ISP CGNAT blocks inbound traffic
      ```

      ### VPS comme serveur WireGuard

      Une meilleure option est de placer le serveur WireGuard sur un VPS avec une véritable IP publique.

      Puis la maison se connecte vers l'extérieur au VPS:

      ```txt
      home router/client
        ↓ outbound tunnel
      VPS with public IP
        ↓
      remote clients connect to VPS
      ```

      Les connexions sortantes fonctionnent habituellement par CGNAT.

      C'est souvent la solution la plus propre.

      ## Options d'auto-hébergement sous CGNAT

      Lorsque l'hébergement direct est bloqué, les options pratiques sont:

      ### 1. Demandez à un FAI la PI publique

      Certains FAI offrent :

      - réel public IPv4
      - IPv4 public statique
      - public dynamique IPv4
      - plan d'affaires avec propriété intellectuelle publique

      C'est la solution la plus directe si disponible.

      ### 2. Utiliser IPv6

      Si le FAI donne des règles IPv6 réelles et que les règles de pare-feu sont configurées correctement, l'hébergement entrant peut être possible sur IPv6.

      Mais les clients doivent également soutenir IPv6.

      ### 3. Utiliser un tunnel VPS

      HÃ©bergez un petit VPS avec une IP publique et un trafic de tunnel Ã la maison.

      Les options sont les suivantes :

      - Tunnel WireGuard
      - tunnel SSH inversé
      - inverser le proxy par rapport au VPN
      - tunnel de type FRP
      - Superposition à l'échelle/à l'échelle supérieure
      - Tunnel Cloudflare pour les services web

      ### 4. Utiliser un VPN Mesh

      Des outils comme un VPN en maille peuvent faciliter l'accès privé sans exposer les ports publics.

      C'est bon pour l'accès à l'administration, mais moins adapté pour les services publics à moins que chaque utilisateur rejoint le maillage.

      ### 5. Services publics d'accueil sur les SPV

      Pour les services publics, la réponse la plus simple est parfois:

      ```txt
      host it on a VPS
      ```

      L'hébergement à domicile est utile, mais ne vaut pas toujours la peine de combattre le réseau ISP.

      ## Services publics sous CGNAT

      Les services publics d'État sont souvent là où le CGNAT devient évident.

      Pour un service public, les utilisateurs doivent atteindre:

      ```txt
      public IP or domain + port
      ```

      Si CGNAT bloque le trafic entrant, les joueurs ne peuvent pas se connecter directement.

      Solutions possibles:

      - demande de PI publique à l'ISP
      - accueillir la fonction publique sur un VPS
      - utiliser un VPS comme relais/tunnel UDP si possible
      - utiliser un réseau VPN ou maillage pour des services privés
      - choisir une plate-forme de jeu/serveur avec relais intégré/NAT traversal si disponible

      Pour les serveurs communautaires publics, l'hébergement VPS est souvent plus fiable.

      Pour les serveurs privés, un VPN maillage peut suffire.

      ## Port 22, 80 et 443 Scans

      Si Nmap affiche des ports comme:

      ```txt
      22
      80
      443
      ```

      ces ports révèlent des services qui répondent à l'adresse numérisée.

      Inférences possibles:

      - `22` suggère généralement SSH
      - `80` suggère habituellement HTTP
      - `443` suggère généralement HTTPS
      - bannières de service peuvent révéler logiciel/version si non caché
      - Les certificats TLS peuvent révéler des noms d'hôte
      - Les en-têtes HTTP peuvent révéler le type de serveur
      - pages Web peuvent révéler l'identité de pile ou d'application

      Mais un scan de port ne révèle pas automatiquement le nom d'utilisateur SSH valide.

      Les attaquants peuvent deviner des noms d'utilisateur communs, mais Nmap ne connaît pas magiquement le compte correct.

      Ce qu'ils peuvent apprendre souvent, c'est :

      ```txt
      there is an SSH service here
      it may expose a banner
      it may allow password or key auth
      it may reveal implementation details
      ```

      C'est suffisant pour justifier le durcissement de SSH.

      ## Notes d'exposition SSH

      Si SSH est publiquement exposé, les bonnes bases comprennent:

      - désactiver le mot de passe si possible
      - utiliser l'authentification par clé
      - désactiver la connexion root là où c'est pratique
      - utiliser des lists de pare-feu si possible
      - utiliser fail2ban ou équivalent, le cas échéant
      - tenir OpenSSH à jour
      - éviter d'exposer publiquement SSH si l'accès VPN est possible
      - vérifier les bannières de service
      - suivi des journaux

      La sécurité devrait être axée sur la réduction des voies d'accès et la consolidation de l'authentification.

      Changer le port peut réduire le bruit mais ne remplace pas le durcissement approprié.

      ## Règles de renvoi du port du routeur par rapport aux pare-feu

      Sur OpenWrt, un port avant n'est pas seulement un réglage cosmétique.

      Un port de travail avancé nécessite:

      - zone RE correcte
      - zone de destination correcte
      - protocole correct TCP/UDP
      - port extérieur correct
      - IP interne correcte
      - port intérieur correct
      - écoute du périphérique cible
      - accessibilité publique en amont

      Si l'un d'eux se trompe, le service peut paraître fermé.

      Sous CGNAT, tout cela peut être correct et le service peut toujours être inaccessible parce que le NAT du FAI est devant.

      ## Liste de vérification

      ### Vérifier l'adresse du WAN

      Comparer:

      ```txt
      router WAN IP
      external public IP
      ```

      S'ils diffèrent et que WAN est privé/CGNAT, suspectez CGNAT.

      ### Vérifier le service localement

      Pour LAN :

      ```txt
      can I connect to the service by local IP?
      ```

      Si l'accès local échoue, fixez d'abord le service.

      ### Vérifiez le routeur vers l'avant

      Confirmer :

      ```txt
      protocol
      external port
      internal IP
      internal port
      firewall zone
      ```

      ### Vérifier de l'extérieur

      Utilisation:

      - données mobiles
      - machine extérieure
      - ami de confiance
      - Essai VPS

      Ne pas se fier uniquement aux tests LAN.

      ### Vérifier les journaux

      Regarde :

      - carnets de pare-feu du routeur si disponible
      - registres des services
      - console de service
      - Registres VPN
      - tentative de connexion

      Si aucune tentative n'arrive au service, le bloc peut être en amont.

      ## Arbre de décision pratique

      Un arbre de décision simple:

      ```txt
      Need private admin access only?
        → Use WireGuard/Tailscale/VPN.

      Need public web app?
        → Use VPS, Cloudflare Tunnel, or reverse proxy through VPS.

      Need public service?
        → Prefer public IP or VPS.

      Need home-only service?
        → Keep it LAN/VPN only.

      Behind CGNAT and cannot get public IP?
        → Use outbound tunnel or VPS.
      ```

      Cela évite de perdre du temps sur des correctifs de transfert de port impossibles.

      ## Décisions pratiques

      ### Ne blâmez pas OpenWrt d'abord

      Si WAN IP est CGNAT, le renvoi du port OpenWrt peut être très bien. La pièce manquante est accessible en amont.

      ### Le DDNS n'est pas un transfert de port

      DDNS résout les adresses changeantes, pas les chemins d'entrée bloqués.

      ### Essai extérieur

      Les tests locaux ne sont pas suffisants pour permettre l'accès du public.

      ### Préférez VPN pour les panneaux d'administration

      Les tableaux de bord Admin, Proxmox, les panneaux routeurs, les bases de données et SSH ne devraient pas être directement exposés si l'accès VPN est possible.

      ### Utiliser VPS lorsque la fiabilité du public est importante

      Pour un service public sérieux, un VPS avec une PI publique réelle est généralement plus propre que de combattre CGNAT.

      ## Ce qu'une explication terminée devrait montrer

      Une note bien terminée doit montrer :

      - CGNAT topologie
      - différence entre le routeur WAN IP et le public IP
      - pourquoi le transfert de port échoue
      - pourquoi les IP publiques partagées ne peuvent pas cartographier un port à plusieurs clients
      - ce que Nmap peut et ne peut pas prouver
      - pourquoi DDNS ne résout pas CGNAT
      - alternatives pratiques
      - liste de contrôle
      - arbre de décision pour les options d'auto-hébergement

      ## Preuves à retenir

      Voici quelques éléments de preuve utiles à cette note :

      - routeur Prise d'écran IP WAN avec des pièces sensibles cachées
      - contrôle externe public IP avec des pièces sensibles cachées
      - Exemple de port avant OpenWrt
      - Essai de port extérieur raté
      - test de service local réussi
      - traceroute ou notes de chemin si utile
      - Résultat Nmap avec interprétation
      - Diagramme du tunnel VPS
      - Diagramme de topologie WireGuard
      - Notes publiques IP/CGNAT des FAI

      ## Hypothèses techniques

      Cette note suppose qu'un utilisateur d'une maison essaie d'accueillir des services à partir d'une connexion résidentielle.

      Il suppose que le FAI peut placer le client derrière CGNAT.

      Il suppose également que l'utilisateur contrôle sa configuration routeur/OpenWrt, mais ne contrôle pas la couche NAT ISP.

      ## Principaux risques

      - en supposant qu'un port avant fonctionne parce qu'il est configuré
      - test uniquement à partir du LAN
      - DDNS déroutant avec accessibilité en entrée
      - exposant publiquement les panneaux SSH ou admin
      - penser que les ports ouverts Nmap appartiennent toujours à votre routeur
      - essayant d'accueillir des services publics sur une connexion qui ne peut recevoir de trafic entrant
      - ignorer les différences UDP vs TCP
      - ne pas vérifier les journaux du serveur pendant les tests
      - s'appuyant sur une IP dynamique sans mécanisme de mise à jour
      - choisir des tunnels compliqués quand un VPS serait plus simple

      ## État actuel

      Cette note représente la compréhension pratique nécessaire avant d'exploiter les services d'un réseau privé.

      Il se connecte à OpenWrt, WireGuard, DDNS, services publics, ports publics et limitations des FAI.

      La valeur principale est d'éviter le dépannage gaspillé lorsque le vrai bloqueur n'est pas le serveur local, mais le chemin réseau ISP.

      ## Ce que la présente note ne prétend pas

      Cette note ne prétend pas que CGNAT est mauvais pour chaque utilisateur.

      Il ne prétend pas que chaque configuration d'ISP se comporte de la même façon.

      Elle ne prétend pas que l'hébergement à domicile est impossible dans toutes les conditions du CGNAT.

      Il explique pourquoi l'hébergement direct en entrée échoue souvent et comment choisir la bonne solution de rechange.

      ## À emporter pratique

      La leçon importante est:

      > Un service peut être parfaitement configuré localement et toujours inaccessible depuis Internet si l'itinéraire public n'atteint pas votre routeur.

      Pour l'auto-hébergement, vérifiez toujours:

      - routeur WAN IP
      - IP publique
      - disponibilité du service local
      - protocole/port correct
      - accessibilité externe
      - Statut ISP/CGNAT

      Après cela, choisissez le bon chemin :

      ```txt
      public IP
      IPv6
      VPS
      VPN
      tunnel
      or local-only access
      ```

      Cela rend le dépannage pratique au lieu de deviner.
seoTitle: "CGNAT and Self-Managed Infrastructure Limits"
seoDescription: "A practical note about CGNAT, self-managed infrastructure, port forwarding, public IP scans, shared public IP behavior, and alternatives like VPS tunnels and VPN access."
---

## Why This Note Exists

This note explains one of the most common problems in self-managed infrastructure: the difference between having internet access and being reachable from the internet.

A home router can access the web normally while still being impossible to reach from outside. This often happens because of CGNAT.

CGNAT changes how port forwarding works, how public IP addresses behave, and how realistic it is to host public services, VPNs, web applications, or remote administration tools from a private network.

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
public service
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

## Example: Two Public Services Behind CGNAT

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

This is good for administration access, but less suitable for public services unless every user joins the mesh.

### 5. Host Public Services on VPS

For public services, sometimes the simpler answer is:

```txt
host it on a VPS
```

Home hosting is useful, but not always worth fighting the ISP network.

## Public Services Under CGNAT

Stateful public services are often where CGNAT becomes obvious.

For a public service, users need to reach:

```txt
public IP or domain + port
```

If CGNAT blocks inbound traffic, players cannot connect directly.

Possible solutions:

- request public IP from ISP
- host the public service on a VPS
- use a VPS as a UDP relay/tunnel if practical
- use a VPN or mesh network for private services
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
- service console
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

Need public service?
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

This note represents the practical understanding needed before operating services from a private network.

It connects to OpenWrt, WireGuard, DDNS, public services, public ports, and ISP limitations.

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
