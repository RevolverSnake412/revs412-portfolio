---
client: ""
title: "Recharge Wallet / SIM-Bank Platform Architecture"
slug: "recharge-wallet-sim-bank-platform-architecture"
summary: "A planned merchant recharge platform architecture combining wallet logic, mobile app flows, admin operations, and SIM-bank based telecom recharge infrastructure."
resumeSummary: >-
  Architected a phased merchant recharge platform in which operators maintain wallet balances, request customer mobile recharges through an app, and receive controlled status updates from recharge infrastructure. The design covers mobile and admin workflows, backend balance validation and accounting, SIM-bank or SIM-pool hardware, VPN and network access, monitoring, exception handling, and operational controls. It intentionally treats operator authorization, hardware reliability, financial state changes, security, and support procedures as prerequisites to scaling—not details to add after the application is built.
problem: "The client needed a way for merchants to perform mobile recharges through an app-based wallet system, while the operational recharge execution would rely on controlled SIM-bank infrastructure instead of a direct operator API in the first version."
constraints: "The architecture had to account for merchant wallet balances, manual funding validation, telecom operator differences, SIM-bank hardware limits, secure remote access, admin control, auditability, and legal/operator authorization boundaries."
approach: "Designed the high-level system architecture around merchant and admin workflows, wallet balance management, recharge requests, SIM-bank operations, network/server infrastructure, VPN access, and phased deployment planning."
outcome: "The project produced a clearer technical direction for building the platform: apps, admin dashboard, backend services, wallet logic, SIM-bank infrastructure, hardware planning, network access, and client-facing documentation."
tools:
  - System architecture
  - Wallet workflow design
  - Merchant app planning
  - Admin dashboard planning
  - Backend/API planning
  - Database planning
  - SIM-bank/SIM-pool infrastructure
  - Telecom recharge workflow
  - VPN access planning
  - Network architecture
  - Hardware planning
  - Documentation
date: "2026-06-10"
featured: true
published: true
translations:
  fr:
    title: "Architecture d’une plateforme de recharges portefeuille et SIM-bank"
    type: "Projet concret"
    summary: "Architecture planifiée d’une plateforme de recharges pour commerçants combinant logique de portefeuille, flux applicatifs, opérations d’administration et infrastructure télécom fondée sur des SIM-banks."
    problem: "Le client devait permettre aux commerçants d’effectuer des recharges mobiles via un portefeuille applicatif, avec une exécution opérationnelle reposant d’abord sur une infrastructure SIM-bank contrôlée plutôt que sur une API opérateur directe."
    constraints: "L’architecture devait prendre en compte les soldes des commerçants, la validation manuelle des financements, les différences entre opérateurs, les limites matérielles, l’accès distant sécurisé, le contrôle administratif, l’auditabilité et les cadres d’autorisation."
    approach: "Conception de l’architecture générale autour des flux commerçant et administrateur, de la gestion des soldes, des demandes de recharge, des opérations SIM-bank, de l’infrastructure serveur et réseau, de l’accès VPN et d’un déploiement par phases."
    outcome: "Le projet a produit une direction technique plus claire couvrant applications, tableau d’administration, services backend, logique de portefeuille, infrastructure SIM-bank, matériel, accès réseau et documentation client."
    resumeSummary: >-
      Architecté une plate-forme de recharge commerciale progressive dans laquelle les opérateurs maintiennent
      des soldes de portefeuille, demandent des recharges mobiles client par l'intermédiaire d'une
      application, et reçoivent des mises à jour d'état contrôlées de l'infrastructure de recharge. La
      conception couvre les flux de travail mobiles et administratifs, la validation et la comptabilité du
      solde moteur, le matériel SIM-bank ou SIM-pool, l'accès VPN et réseau, la surveillance, le traitement
      des exceptions et les contrôles opérationnels. Il traite intentionnellement l'autorisation de
      l'opérateur, la fiabilité du matériel, les changements d'état financier, la sécurité et les procédures
      de soutien comme des conditions préalables à la mise à l'échelle.
    body: |-

      ## Rôle

      Ce travail est le mieux aligné sur l'architecture du système, la planification des flux de travail, la conception de l'infrastructure et la prise de décisions techniques.

      Il démontre la capacité de regarder une idée d'entreprise comme un système complet plutôt que seulement un écran d'application. Le projet implique les utilisateurs, les commerçants, les soldes de portefeuille, la validation administrative, l'exécution de recharge de télécommunications, le matériel, les serveurs, l'accès VPN, l'auditabilité et le risque opérationnel.

      La valeur du travail n'est pas de prétendre que la plate-forme entière est déjà déployée. La valeur est de convertir un processus d'affaires complexe en une architecture réaliste qui peut être discutée, évaluée, documentée et mise en œuvre en phases.

      ## Résumé du projet

      Le projet est une plateforme de portefeuille de recharge prévue pour les marchands.

      L'idée est de permettre aux commerçants d'utiliser une application pour effectuer des recharges mobiles pour les clients. Les commerçants auraient un solde portefeuille à l'intérieur du système. Lorsqu'ils demandent une recharge, la plate-forme validerait l'équilibre et orienterait l'opération à travers une infrastructure de recharge contrôlée.

      La première direction de l'architecture repose sur l'infrastructure SIM-bank/SIM-pool au lieu de dépendre d'une API opérateur direct au début. Cela signifie que la plate-forme n'est pas seulement un logiciel.

      Le système a été conçu comme un projet échelonné parce que plusieurs parties doivent être validées avec soin : les règles d'exploitation, l'autorisation de l'exploitant, la fiabilité des banques SIM, la comptabilité de portefeuille, le traitement des états de recharge, la sécurité et les opérations quotidiennes.

      ## Ce que ce projet veut prouver

      - une plate-forme de recharge est un système opérationnel, pas seulement une application mobile
      - La logique du bilan de portefeuille doit être conçue avant que l'automatisation de la recharge ne devienne utile
      - L'infrastructure SIM-bank crée des contraintes matérielles, de réseau, de surveillance et de conformité
      - les flux de travail administratifs sont importants parce que la validation du financement et les exceptions de recharge doivent être contrôlées
      - l'architecture technique devrait définir les responsabilités entre les applications, le moteur, le matériel et les opérateurs
      - une architecture progressive est plus sûre que d'essayer de construire chaque couche d'automatisation immédiatement
      - la documentation orientée vers les entreprises est importante lorsque le système mélange les opérations de logiciels, de matériel et de télécommunications;

      ## Pioche et outils utilisés

      Ce projet est axé sur l'architecture et la planification. La pile de production exacte peut encore être finalisée au cours de la mise en oeuvre, mais la direction de l'architecture comprend ces domaines.

      ### Couche d'application

      - Planification de l'application mobile Merchant
      - Concept d'application client au besoin
      - Planification du tableau de bord
      - Authentification et orientation de la séparation des rôles
      - Vue de l'équilibre du portefeuille
      - Débit de la demande de recharge
      - Historique des transactions
      - Direction de la gestion des erreurs/états

      ### Doset et couche de données

      - Planification du moteur/de l'API
      - Planification des bases de données
      - Direction du registre du portefeuille
      - Structure des comptes marchands
      - Dossiers de demande de recharge
      - Dossiers de validation du financement
      - Enregistrements des actions administratives
      - Orientation de la piste de vérification
      - Direction logique du routage opérateur/SIM

      ### Layer Télécom et Matériel

      - Infrastructure SIM-bank/SIM-pool
      - Cartes SIM regroupées par opérateur
      - Direction de recharge orange / IAM / Inwi
      - Planification du crédit/charge SIM
      - Exigences de connectivité SIM-bank
      - Planification du matériel lié à l'antenne/SIM
      - Considérations de fiabilité matérielle

      ### Couche réseau et infrastructure

      - Planification du routeur
      - Direction du commutateur gérée
      - Mini PC / planification de serveur
      - Direction d'accès à distance VPN
      - Direction de la segmentation du réseau local
      - Voie d'accès Admin
      - Direction du placement du matériel
      - Direction de la maintenance du serveur et du périphérique

      ### Documentation et planification

      - PDF orienté vers le client
      - Listes d ' équipements
      - diagrammes d'architecture
      - simple explication de la pile
      - notes de recommandation matérielle
      - phases de déploiement
      - direction des prix et de la justification de la portée

      ## Construction prévue

      La construction prévue est une plate-forme de recharge marchande avec trois principaux côtés:

      ### 1. Côté marchand

      Les commerçants utilisent une application pour :

      - afficher le solde du portefeuille
      - demander une recharge
      - sélectionner le type d'opérateur/service
      - saisir le numéro du client
      - voir le statut de la demande
      - afficher l'historique des transactions
      - recevoir des erreurs claires lorsqu'une recharge ne peut pas continuer

      ### 2. Côté administratif

      Les administrateurs utilisent un tableau de bord pour :

      - créer et gérer des marchands
      - valider le financement des négociants
      - ajuster ou approuver les mises à jour du solde du portefeuille
      - demandes de recharge de piste
      - des opérations en cours ou en échec
      - surveiller le statut de la banque SIM
      - inspecter les journaux et l'historique des transactions
      - gérer les litiges ou les corrections manuelles

      ### 3. Côté infrastructure

      La plateforme utilise une infrastructure contrôlée pour exécuter ou soutenir des opérations de recharge:

      - Services de soutien
      - bases de données et dossiers de portefeuille
      - Matériel SIM-bank/SIM-pool
      - cartes SIM opérateur
      - configuration routeur/réseau
      - Accès VPN pour administration à distance
      - serveur/mini matériel PC au besoin
      - procédures opérationnelles et de suivi

      ## Portée de la prestation

      ### 1. Architecture des flux de travail des entreprises

      Définir comment les demandes d'argent et de recharge passent à travers le système.

      Le flux de travail important est :

      1. marchand reçoit ou demande un solde
      2. admin valide le financement
      3. solde du portefeuille est mis à jour
      4. marchand demande une recharge
      5. contrôle du système solde disponible
      6. La demande de recharge est créée
      7. opération est acheminée par le chemin de l'opérateur correct
      8. l'état est mis à jour
      9. des dossiers d'historique et d'audit sont conservés

      Ce flux est important parce que les systèmes de recharge sont sensibles aux erreurs d'équilibre, aux opérations ratées et aux responsabilités peu claires.

      ### 2. Direction logique du portefeuille

      Planifiez le portefeuille comme une couche de comptabilité contrôlée, pas seulement un nombre affiché dans l'application.

      Le portefeuille a besoin de dossiers de transaction, de changements de solde, de dossiers de financement, de retenues de recharge, de traitement d'opérations défaillantes et de traçabilité administrative.

      Une conception de portefeuille solide devrait permettre d'expliquer pourquoi un équilibre a changé à tout moment.

      ### 3. Direction de l'infrastructure SIM-banque

      Planifiez comment le matériel SIM-bank/SIM-pool s'intègre dans le système.

      Cela comprend:

      - nombre de SIM par opérateur
      - groupement d'opérateurs
      - la planification des crédits/charges
      - connectivité matérielle
      - accès à distance
      - Gestion des défaillances
      - direction de la surveillance
      - placement physique
      - considérations de sécurité et d'entretien

      La banque SIM est traitée comme une dépendance opérationnelle, et non comme un simple dispositif de connexion.

      ### 4. Direction de l'application marchande

      Définir l'application marchande comme un simple outil opérationnel, pas un marché de consommation complet.

      L'application marchande devrait se concentrer sur :

      - Solde du portefeuille
      - création de la demande de recharge
      - historique des transactions
      - visibilité de l'état
      - messages d'erreur clairs
      - simple utilisation quotidienne

      L'application devrait éviter des fonctionnalités inutiles dans la première version.

      ### 5. Direction du tableau de bord

      Définissez le tableau de bord administrateur comme point de contrôle du système.

      Le tableau de bord administratif doit appuyer la validation du financement, la gestion marchande, la surveillance de la recharge, les corrections de portefeuille et l'examen opérationnel.

      Ceci est important parce que tous les cas de bord ne devraient pas être poussés à l'application marchande.

      ### 6. Direction du serveur et du réseau

      Planifiez l'infrastructure nécessaire à l'exploitation et à l'entretien du système.

      Cela comprend:

      - rôle serveur ou mini PC
      - rôle du routeur
      - Accès VPN
      - séparation du dispositif
      - contrôle de l'accès au réseau
      - chemin d'entretien à distance
      - planification matérielle

      L'architecture suppose que la plateforme a à la fois des responsabilités en matière de logiciels et d'infrastructure sur place.

      ### 7. Direction de la documentation du client

      Préparer des explications, des diagrammes et des listes d'équipement destinés aux clients afin qu'ils puissent comprendre le projet avant sa mise en oeuvre.

      La documentation devait rester compréhensible sans exposer les détails inutiles de sa mise en œuvre.

      ## Décisions pratiques

      ### Commencez par une validation de financement contrôlée

      La validation automatique du financement peut être ajoutée plus tard, mais la première orientation plus sûre est la validation manuelle ou approuvée par l'administration.

      Cela réduit le risque d'inexactitude des soldes de portefeuille pendant que le processus opérationnel est encore en cours de finalisation.

      ### Traiter le solde du portefeuille comme un grand livre vérifiable

      L'équilibre du portefeuille ne doit pas être traité comme un simple numéro modifiable.

      Chaque augmentation, déduction, correction, fonctionnement raté et ajustement administratif doit avoir une raison et un enregistrement traçable.

      ### Gardez l'application marchande concentrée

      L'application marchande devrait se concentrer sur le flux de recharge quotidien.

      Ajouter trop de fonctionnalités tôt rendrait le système plus difficile à tester, expliquer et fonctionner.

      ### Séparer le contrôle administratif des actions marchandes

      Les commerçants devraient pouvoir demander des opérations, mais les administrateurs doivent avoir une visibilité et un contrôle sur le financement, les exceptions et les corrections opérationnelles.

      ### Traiter le matériel SIM-bank comme une véritable dépendance à l'infrastructure

      Le matériel SIM-bank affecte la fiabilité, la capacité, la séparation des opérateurs, la maintenance, la surveillance et l'accès à distance.

      Il devrait être planifié comme une infrastructure, pas comme un petit accessoire.

      ### Utiliser VPN pour un accès à distance contrôlé

      L'accès à distance aux serveurs et à l'infrastructure devrait être géré par VPN plutôt que d'exposer directement les services sensibles.

      Cela permet de contrôler l'accès à la maintenance.

      ## Ce qu'une version terminée devrait montrer

      Une solide version terminée de cette architecture devrait montrer:

      - flux d'application marchand pour les demandes de recharge
      - Tableau de bord administratif pour le financement et la surveillance
      - modèle de registre de portefeuille
      - cycle de vie de la demande de recharge
      - Rôle matériel SIM-bank/SIM-pool
      - direction de groupement de l'opérateur
      - Responsabilités du moteur/de l'API
      - Responsabilités en matière de base de données
      - schéma d'infrastructure
      - diagramme d'accès réseau et VPN
      - liste matérielle
      - procédures opérationnelles pour les recharges en échec ou en attente
      - piste d'audit pour les changements de solde et les actions de recharge
      - séparation claire entre les responsabilités de l'application, du moteur, de l'administration et du matériel

      ## Preuves à retenir

      Les preuves utiles de ce projet seraient les suivantes :

      - diagrammes d'architecture
      - diagrammes de flux de portefeuille
      - diagrammes de flux d'administration
      - les images filaires de l'application marchande
      - croquis de base de données/entité
      - Liste des équipements
      - Billets de matériel de banque SIM
      - Schéma VPN/réseau
      - exportations de PDF vers le client
      - les documents de portée
      - prix/notes de justification de la portée
      - Plan de phase de mise en œuvre
      - screenshots de prototypes ou d'écrans d'administration lorsque disponibles
      - test logs une fois l'exécution de la recharge mise en œuvre

      ## Hypothèses techniques

      La plate-forme suppose que le client a ou obtiendra l'autorisation requise pour effectuer des opérations de recharge par les chemins d'opérateur choisis.

      La première version suppose une validation de financement manuelle ou contrôlée par l'administration plutôt qu'un rapprochement entièrement automatisé entre les opérations bancaires et les paiements.

      L'architecture suppose que l'exécution SIM-bank n'est possible que si le matériel, les cartes SIM, les règles d'exploitation et les procédures opérationnelles sont correctement validés.

      La plate-forme suppose également qu'une demande de recharge doit être traitée comme un événement financier/opérationnel, pas seulement une action d'application normale.

      ## Principaux risques

      - problèmes juridiques ou de conformité de l'exploitant si les opérations de recharge ne sont pas correctement autorisées
      - erreurs de solde de portefeuille si la comptabilité n'est pas traçable
      - L'instabilité matérielle ou les limites de capacité SIM-bank
      - opérations de recharge défaillantes sans manipulation claire de l'état
      - responsabilité incertaine entre le marchand, l'administrateur et le système
      - exposer l'infrastructure sans contrôle d'accès à distance sécurisé
      - sur-automatisme avant que les règles d'affaires ne soient stables
      - sous-estimation du suivi, des registres et du soutien opérationnel
      - en supposant que tous les opérateurs se comportent de la même manière
      - rendre l'application mobile polie avant la logique de backend et portefeuille sont fiables

      ## État actuel

      Le projet en est à l'étape de l'architecture et de la planification.

      La principale valeur produite jusqu'à présent est une orientation technique plus claire: la plate-forme n'est pas seulement une application, mais une entreprise combinée, un logiciel, un réseau et un système d'infrastructure de télécommunications.

      Le travail actuel définit ce qui doit exister avant la mise en œuvre peut être fiable: logique de portefeuille, flux marchand, contrôles administratifs, planification SIM-banque, accès au réseau, sélection du matériel, documentation et livraison progressive.

      ## Ce que ce projet ne prétend pas

      Ce projet ne prétend pas que la plate-forme de production complète soit déjà déployée.

      Elle ne prétend pas que toutes les opérations de recharge sont automatisées.

      Elle ne prétend pas que chaque chemin d'exploitation a été validé dans la production.

      Elle ne prétend pas que l'infrastructure de la banque SIM supprime le besoin d'autorisation de l'exploitant ou d'examen de la conformité.

      Le projet est mieux compris comme l'architecture et la planification d'un véritable système opérationnel, les limites techniques et opérationnelles étant rendues explicites avant sa mise en œuvre complète.

      ## Entrevue / Point de discussion avec le client

      Une explication utile pour ce projet est:

      > J'ai traité la plate-forme de recharge comme un système opérationnel plutôt qu'une simple application mobile. Les pièces importantes étaient la comptabilité de portefeuille, la validation administrative, le cycle de vie de la demande de recharge, l'infrastructure SIM-bank, l'accès sécurisé à distance et la gestion claire des défaillances.

      ## Travaux connexes

      - Documentation technique destinée aux clients
      - Site Web des entreprises de GOPC
      - Intégration des produits et des stocks d'Odoo
---

## Role Fit

This work is best aligned with system architecture, business workflow planning, infrastructure design, and technical decision-making.

It demonstrates the ability to look at a business idea as a complete system rather than only an app screen. The project involves users, merchants, wallet balances, admin validation, telecom recharge execution, hardware, servers, VPN access, auditability, and operational risk.

The value of the work is not in claiming that the entire platform is already deployed. The value is in converting a complex business process into a realistic architecture that can be discussed, priced, documented, and implemented in phases.

## Project Summary

The project is a planned recharge wallet platform for merchants.

The idea is to allow merchants to use an app to perform mobile recharges for customers. Merchants would have a wallet balance inside the system. When they request a recharge, the platform would validate balance and route the operation through controlled recharge infrastructure.

The first architecture direction relied on SIM-bank/SIM-pool infrastructure instead of depending on a direct operator API at the beginning. This means the platform is not just software. It requires mobile app flows, admin operations, backend logic, telecom hardware, network setup, VPN access, monitoring direction, and clear operating rules.

The system was planned as a phased project because several parts need to be validated carefully: business rules, operator authorization, SIM-bank reliability, wallet accounting, recharge status handling, security, and daily operations.

## What This Project Is Meant To Prove

- a recharge platform is an operational system, not only a mobile app
- wallet balance logic must be designed before recharge automation becomes useful
- SIM-bank infrastructure creates hardware, network, monitoring, and compliance constraints
- admin workflows matter because funding validation and recharge exceptions need control
- technical architecture should define responsibilities between apps, backend, hardware, and operators
- a phased architecture is safer than trying to build every automation layer immediately
- business-facing documentation is important when the system mixes software, hardware, and telecom operations

## Stack and Tools Used

This project is architecture and planning focused. The exact production stack can still be finalized during implementation, but the architecture direction includes these areas.

### Application Layer

- Merchant mobile app planning
- Customer app concept where needed
- Admin dashboard planning
- Authentication and role separation direction
- Wallet balance views
- Recharge request flow
- Transaction history direction
- Error/status handling direction

### Backend and Data Layer

- Backend/API planning
- Database planning
- Wallet ledger direction
- Merchant account structure
- Recharge request records
- Funding validation records
- Admin action records
- Audit trail direction
- Operator/SIM routing logic direction

### Telecom and Hardware Layer

- SIM-bank/SIM-pool infrastructure
- SIM cards grouped by operator
- Orange / IAM / Inwi recharge direction
- SIM credit/load planning
- SIM-bank connectivity requirements
- Antenna/SIM-related hardware planning
- Hardware reliability considerations

### Network and Infrastructure Layer

- Router planning
- Managed switch direction
- Mini PC/server planning
- VPN remote access direction
- Local network segmentation direction
- Admin access path
- Hardware placement direction
- Server and device maintenance direction

### Documentation and Planning

- client-facing PDFs
- equipment lists
- architecture diagrams
- simple stack explanation
- hardware recommendation notes
- deployment phases
- pricing/scope justification direction

## Intended Build

The intended build is a merchant recharge platform with three major sides:

### 1. Merchant Side

Merchants use an app to:

- view wallet balance
- request a recharge
- select operator/service type
- enter customer number
- see request status
- view transaction history
- receive clear errors when a recharge cannot continue

### 2. Admin Side

Admins use a dashboard to:

- create and manage merchants
- validate merchant funding
- adjust or approve wallet balance updates
- track recharge requests
- review failed or pending operations
- monitor SIM-bank related status
- inspect logs and transaction history
- handle disputes or manual corrections

### 3. Infrastructure Side

The platform uses controlled infrastructure to execute or support recharge operations:

- backend services
- database and wallet records
- SIM-bank/SIM-pool hardware
- operator SIM cards
- router/network setup
- VPN access for remote administration
- server/mini PC hardware where needed
- monitoring and operational procedures

## Delivery Scope

### 1. Business Workflow Architecture

Define how money and recharge requests move through the system.

The important workflow is:

1. merchant receives or requests balance
2. admin validates funding
3. wallet balance is updated
4. merchant requests a recharge
5. system checks available balance
6. recharge request is created
7. operation is routed through the correct operator path
8. status is updated
9. history and audit records are kept

This flow matters because recharge systems are sensitive to balance mistakes, failed operations, and unclear responsibility.

### 2. Wallet Logic Direction

Plan the wallet as a controlled accounting layer, not just a number displayed in the app.

The wallet needs transaction records, balance changes, funding records, recharge deductions, failed-operation handling, and admin traceability.

A strong wallet design should make it possible to explain why a balance changed at any time.

### 3. SIM-Bank Infrastructure Direction

Plan how the SIM-bank/SIM-pool hardware fits into the system.

This includes:

- number of SIMs per operator
- operator grouping
- credit/load planning
- hardware connectivity
- remote access
- failure handling
- monitoring direction
- physical placement
- security and maintenance considerations

The SIM-bank is treated as an operational dependency, not as a simple plug-in device.

### 4. Merchant App Direction

Define the merchant app as a simple operational tool, not a full consumer marketplace.

The merchant app should focus on:

- wallet balance
- recharge request creation
- transaction history
- status visibility
- clear error messages
- simple daily usability

The app should avoid unnecessary features in the first version.

### 5. Admin Dashboard Direction

Define the admin dashboard as the control point of the system.

The admin dashboard needs to support funding validation, merchant management, recharge monitoring, wallet corrections, and operational review.

This is important because not every edge case should be pushed to the merchant app.

### 6. Server and Network Direction

Plan the infrastructure needed to run and maintain the system.

This includes:

- server or mini PC role
- router role
- VPN access
- device separation
- network access control
- remote maintenance path
- physical hardware planning

The architecture assumes the platform has both software and on-site infrastructure responsibilities.

### 7. Client Documentation Direction

Prepare client-facing explanations, diagrams, and equipment lists so the client can understand the project before implementation.

The documentation had to stay understandable without exposing unnecessary implementation detail.

## Practical Decisions

### Start with controlled funding validation

Automatic funding validation can be added later, but the first safer direction is manual or admin-approved funding validation.

This reduces the risk of incorrect wallet balances while the business process is still being finalized.

### Treat wallet balance as an auditable ledger

Wallet balance should not be treated as a simple editable number.

Every increase, deduction, correction, failed operation, and admin adjustment should have a reason and traceable record.

### Keep the merchant app focused

The merchant app should focus on the daily recharge workflow.

Adding too many features early would make the system harder to test, explain, and operate.

### Separate admin control from merchant actions

Merchants should be able to request operations, but admins need visibility and control over funding, exceptions, and operational corrections.

### Treat SIM-bank hardware as a real infrastructure dependency

SIM-bank hardware affects reliability, capacity, operator separation, maintenance, monitoring, and remote access.

It should be planned like infrastructure, not like a small accessory.

### Use VPN for controlled remote access

Remote access to servers and infrastructure should be handled through VPN rather than exposing sensitive services directly.

This keeps maintenance access more controlled.

## What A Finished Version Should Show

A strong finished version of this architecture should show:

- merchant app flow for recharge requests
- admin dashboard flow for funding and monitoring
- wallet ledger model
- recharge request lifecycle
- SIM-bank/SIM-pool hardware role
- operator grouping direction
- backend/API responsibilities
- database responsibilities
- infrastructure diagram
- network and VPN access diagram
- hardware list
- operational procedures for failed or pending recharges
- audit trail for balance changes and recharge actions
- clear separation between app, backend, admin, and hardware responsibilities

## Evidence Worth Capturing

Useful evidence for this project would include:

- architecture diagrams
- wallet flow diagrams
- admin flow diagrams
- merchant app wireframes
- database/entity sketches
- equipment list
- SIM-bank hardware notes
- VPN/network diagram
- client-facing PDF exports
- scope documents
- pricing/scope justification notes
- implementation phase plan
- screenshots of prototypes or admin screens when available
- test logs once recharge execution is implemented

## Technical Assumptions

The platform assumes that the client has or will obtain the required authorization to perform recharge operations through the chosen operator paths.

The first version assumes manual or admin-controlled funding validation rather than fully automated banking/payment reconciliation.

The architecture assumes that SIM-bank execution is possible only if the hardware, SIM cards, operator rules, and operational procedures are properly validated.

The platform also assumes that a recharge request must be treated as a financial/operational event, not just a normal app action.

## Key Risks

- legal or operator compliance issues if recharge operations are not properly authorized
- wallet balance mistakes if accounting is not traceable
- SIM-bank hardware instability or capacity limits
- failed recharge operations without clear status handling
- unclear responsibility between merchant, admin, and system
- exposing infrastructure without secure remote access controls
- over-automating before business rules are stable
- underestimating monitoring, logs, and operational support
- assuming all operators behave the same way
- making the mobile app polished before the backend and wallet logic are reliable

## Current State

The project is in the architecture and planning stage.

The main value produced so far is a clearer technical direction: the platform is not only an app, but a combined business, software, network, and telecom infrastructure system.

The current work defines what needs to exist before implementation can be trusted: wallet logic, merchant flow, admin controls, SIM-bank planning, network access, hardware selection, documentation, and phased delivery.

## What This Project Does Not Claim

This project does not claim that the complete production platform is already deployed.

It does not claim that all recharge operations are automated.

It does not claim that every operator path has been validated in production.

It does not claim that SIM-bank infrastructure removes the need for operator authorization or compliance review.

The project is best understood as architecture and planning for a real operational system, with the technical and business boundaries made explicit before full implementation.

## Interview / Client Talking Point

A useful explanation for this project is:

> I treated the recharge platform as an operational system rather than just a mobile app. The important parts were wallet accounting, admin validation, recharge request lifecycle, SIM-bank infrastructure, secure remote access, and clear failure handling. The architecture was designed so the client could understand what needed to be built before committing to a full implementation.

## Related Work

- Client-Facing Technical Documentation
- GOPC Business Website
- Odoo Product & Inventory Integration
