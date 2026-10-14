---
resume: true
title: "Resilient Zabbix Monitoring Platform"
slug: "resilient-zabbix-monitoring-platform"
summary: "Designed and validated a private Zabbix monitoring platform for cloud servers, game services, Docker workloads, and an OpenWrt home router, with WireGuard-only access, layered alerts, encrypted backups, and a tested restore path."
resumeSummary: >-
  Designed and validated a resilient monitoring platform for self-managed cloud and home infrastructure. The
  deployment uses Zabbix 7 LTS with PostgreSQL/TimescaleDB on a cloud control plane, an active OpenWrt proxy
  for buffered home-site telemetry, and WireGuard-only monitoring and administration paths. It covers Linux
  hosts, Docker workloads, Minecraft and Valheim services, WAN state, latency, loss, SQM, storage, and system
  health. High-severity alerts use independent Discord and ntfy routes, while an external heartbeat monitors the
  monitoring control plane itself. Encrypted backups are replicated off-site and were validated through an
  isolated database restore drill.
category: "Infrastructure Operations"
tags:
  - zabbix
  - monitoring
  - wireguard
  - openwrt
  - docker
  - postgresql
  - timescaledb
  - alerting
  - backup-recovery
  - game-server-hosting
  - infrastructure-operations
date: "2026-10-14"
featured: true
published: true
translations:
  fr:
    title: "Plateforme de supervision Zabbix résiliente"
    category: "Opérations d’infrastructure"
    summary: "Conception et validation d’une plateforme Zabbix privée pour serveurs cloud, services de jeu, charges Docker et routeur OpenWrt, avec accès WireGuard, alertes redondantes, sauvegardes chiffrées et restauration testée."
    resumeSummary: >-
      Conçu et validé une plateforme de supervision résiliente pour une infrastructure cloud et domestique
      auto-gérée. Le déploiement utilise Zabbix 7 LTS avec PostgreSQL/TimescaleDB sur un plan de contrôle
      cloud, un proxy OpenWrt actif pour la télémétrie locale mise en tampon, ainsi que des chemins de
      supervision et d’administration limités à WireGuard. La couverture inclut les hôtes Linux, les charges
      Docker, les services Minecraft et Valheim, l’état WAN, la latence, la perte, SQM, le stockage et la
      santé du système. Les alertes graves utilisent Discord et ntfy, tandis qu’un heartbeat externe surveille
      le plan de contrôle. Les sauvegardes chiffrées sont répliquées hors site et ont été validées par une
      restauration isolée de base de données.
    body: |-

      ## Pourquoi cette note existe

      Une infrastructure composée de serveurs cloud, services de jeu, conteneurs Docker et d’un routeur domestique a besoin d’une vue opérationnelle cohérente. Sans cela, un service peut être indisponible longtemps avant qu’une personne ne le remarque, et les pannes du routeur, du WAN ou du plan de supervision sont faciles à confondre.

      L’objectif n’était pas seulement d’afficher des graphiques. Il était de construire une supervision exploitable : accès privé, alertes par plusieurs chemins, données mises en tampon pour le site domestique et preuve que la configuration peut être restaurée.

      ## Architecture retenue

      Le plan de contrôle Zabbix est hébergé sur un VPS cloud avec PostgreSQL et TimescaleDB. L’interface Zabbix, le serveur et les agents ne sont accessibles que par WireGuard ; seul le point d’entrée UDP du VPN est exposé publiquement.

      Le routeur Raspberry Pi sous OpenWrt exécute un proxy Zabbix actif. Le proxy collecte les données du réseau domestique et peut conserver temporairement des mesures non envoyées lorsqu’une liaison cloud est interrompue. La perte du proxy devient elle-même un signal utile indiquant un problème de site, de routeur ou de WAN.

      ```text
      Linux hosts and game services
                |
                | private WireGuard transport
                v
      Zabbix control plane on cloud VPS
                |
                +--> Discord and ntfy alerts
                |
                +--> encrypted off-site backups

      OpenWrt router + active proxy
                |
                +--> buffered home-site telemetry
      ```

      ## Ce qui est supervisé

      La couverture Linux standard comprend disponibilité, CPU, mémoire, swap, systèmes de fichiers, inodes, I/O, réseau et charge.

      Les contrôles spécifiques ajoutent :

      - état des composants Docker nécessaires
      - disponibilité des services Minecraft
      - service Valheim, processus du serveur, écoute UDP du jeu et relais Discord
      - état PPPoE/WAN, trafic, erreurs, latence et perte de paquets du routeur
      - état CAKE/SQM, température, charge et stockage overlay OpenWrt
      - fraîcheur des sauvegardes du plan de contrôle

      La supervision ne se limite donc pas à un ping. Elle relie les signaux du système, des services et du réseau à des causes opérationnelles plausibles.

      ## Alertes et indépendance

      Les événements High et Disaster sont envoyés à Discord et ntfy en parallèle. Un service de heartbeat externe vérifie que le plan de contrôle peut toujours signaler sa propre santé. Il fournit un chemin indépendant si le VPS Zabbix, sa base de données ou son traitement d’alertes devient indisponible.

      Une alerte ne peut pas être réellement « impossible à arrêter » : une coupure électrique, une absence de réseau ou des permissions de notification refusées peuvent toujours empêcher une livraison. Le but est donc de réduire les points de défaillance communs, pas de faire une promesse impossible.

      ## Sauvegarde et restauration

      Des archives quotidiennes chiffrées contiennent un dump PostgreSQL cohérent, la configuration opérationnelle et des sommes de contrôle. Elles sont conservées localement et répliquées vers un stockage objet hors site.

      Une restauration réelle a été effectuée vers une base de données PostgreSQL temporaire et isolée. La vérification a confirmé la présence des hôtes, éléments, déclencheurs et actions avant de supprimer la base de validation. La production n’a pas été modifiée pendant ce test.

      Cette différence est importante : une tâche de sauvegarde réussie n’est pas, à elle seule, une preuve de récupérabilité.

      ## Limites et décisions

      Cette configuration est résiliente au niveau opérationnel, mais ce n’est pas un cluster Zabbix HA complet. Un vrai basculement de serveur Zabbix exigerait un second plan de contrôle et une base de données partagée hautement disponible, ce qui est volontairement reporté jusqu’à la mise en place d’une infrastructure centralisée dédiée.

      Les appareils futurs ne sont pas approuvés automatiquement parce qu’ils atteignent le VPN. Chaque nouvel hôte reçoit une identité WireGuard, une identité Zabbix, un secret TLS distinct, le rôle de supervision approprié et une vérification initiale avant d’être considéré comme intégré.

      ## Résultat pratique

      La plateforme fournit une vue privée et centralisée de l’infrastructure actuelle, avec des alertes indépendantes et une restauration déjà testée. Elle établit aussi un modèle reproductible pour intégrer de futurs VPS, SBC, routeurs, machines virtuelles et services sans transformer la sécurité ou la supervision en travail manuel improvisé.
seoTitle: "Resilient Zabbix Monitoring Platform"
seoDescription: "A practical Zabbix 7 monitoring platform using WireGuard-only access, an OpenWrt active proxy, layered alert delivery, encrypted off-site backups, and a tested restore workflow."
---

## Why This Note Exists

An environment with cloud servers, game services, Docker workloads, and a home router needs one operational view. Without it, a service can be down for a long time before anyone notices, and router, WAN, and monitoring-control-plane failures are easy to confuse.

The goal was not simply to display graphs. It was to build monitoring that can be operated: private access, alerts through more than one path, buffered home-site data, and proof that the monitoring configuration can be restored.

## Architecture Direction

The Zabbix control plane runs on a cloud VPS with PostgreSQL and TimescaleDB. The Zabbix UI, server, and agents are reachable only through WireGuard; the VPN UDP endpoint is the only intentionally public monitoring-related service.

The Raspberry Pi OpenWrt router runs an active Zabbix proxy. It collects home-network data and can temporarily retain unsent measurements when the cloud link is interrupted. Losing the proxy is itself a useful signal for a site, router, or WAN issue.

```text
Linux hosts and game services
          |
          | private WireGuard transport
          v
Zabbix control plane on cloud VPS
          |
          +--> Discord and ntfy alerts
          |
          +--> encrypted off-site backups

OpenWrt router + active proxy
          |
          +--> buffered home-site telemetry
```

## What Is Monitored

The standard Linux profile covers availability, CPU, memory, swap, filesystems, inodes, I/O, network, and load.

Service-specific checks add:

- required Docker component state
- Minecraft service availability
- Valheim service, server process, game UDP listener, and Discord relay
- router PPPoE/WAN state, traffic, errors, latency, and packet loss
- CAKE/SQM state, temperature, load, and OpenWrt overlay storage
- control-plane backup freshness

This means monitoring is not limited to a ping. It connects host, service, and network signals to plausible operational causes.

## Alerting and Independence

High and Disaster events route to Discord and ntfy in parallel. An external heartbeat service verifies that the control plane can still report its own health, providing an independent path if the Zabbix VPS, database, or alert processing is unavailable.

No alert delivery can be literally unstoppable: a power loss, lack of network, or denied notification permission can always prevent delivery. The objective is to reduce shared failure points rather than make an impossible promise.

## Backup and Restore Validation

Daily encrypted archives contain a consistent PostgreSQL dump, operational configuration, and checksums. They are retained locally and replicated to off-site object storage.

A real restore was performed into a disposable, isolated PostgreSQL database. The validation confirmed that hosts, items, triggers, and actions were present before the temporary database was removed. Production was not altered during the test.

That distinction matters: a successful backup job is not, by itself, evidence of recoverability.

## Limits and Decisions

This is an operationally resilient configuration, not a full Zabbix HA cluster. True server failover would require a separate control plane and a highly available shared database, which is intentionally deferred until dedicated central infrastructure exists.

Future devices are not automatically trusted merely because they reach the VPN. Each receives a unique WireGuard peer, Zabbix identity, TLS credential, appropriate monitoring role, and initial verification before onboarding is complete.

## Practical Result

The platform provides a private, central view of current infrastructure with independent alert paths and a tested restore workflow. It also establishes a repeatable model for adding future VPSs, SBCs, routers, virtual machines, and services without turning monitoring or security into ad-hoc manual work.

