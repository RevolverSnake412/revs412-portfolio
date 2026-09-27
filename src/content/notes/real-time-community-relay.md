---
resume: false
title: "Real-Time Event and Message Relay"
slug: "real-time-community-relay"
summary: "Field notes from building a server-side relay that connects live service events and application messaging with an external communication platform."
resumeSummary: >-
  Built a server-side relay that connects real-time service events and application messaging with an external communication platform. The design covers message flow in both directions, channel filtering, consistent formatting, configuration, event selection, and loop prevention so automated messages do not echo indefinitely between systems. It treats the integration as an operational communication bridge: useful events must be delivered promptly and clearly, while permissions, message origin, and failure behaviour remain controlled enough for the relay to be trusted in day-to-day use.
category: "Real-Time Integrations"
tags:
  - server-side-extension
  - external-messaging
  - relay
  - csharp
  - real-time-integration
  - server-events
  - integration
date: "2026-07-08"
updated: "2026-07-25"
featured: true
published: true
translations:
  fr:
    title: "Relais communautaire en temps réel"
    category: "Intégrations temps réel"
    summary: "Notes sur un relais côté serveur connectant les événements d’un service en direct et un canal de discussion."
    resumeSummary: >-
      Construit un relais côté serveur qui relie les événements de service en temps réel et la messagerie
      d'application à une plate-forme de communication externe. La conception couvre le flux des messages dans
      les deux directions, le filtrage des canaux, le formatage cohérent, la configuration, la sélection des
      événements et la prévention des boucles, de sorte que les messages automatisés ne font pas écho
      indéfiniment entre les systèmes. Il traite l'intégration comme un pont de communication opérationnel:
      les événements utiles doivent être livrés rapidement et clairement, tandis que les permissions,
      l'origine du message et le comportement d'échec restent suffisamment contrôlés pour que le relais puisse
      être utilisé quotidiennement.
    body: |-

      ## Pourquoi cette note existe

      Cette note documente un événement personnalisé côté serveur et un relais de message.

      L'objectif était de connecter le service hébergé à un canal de communication externe afin que les opérateurs et les utilisateurs puissent suivre l'activité d'application sans être connectés tout le temps.

      La direction du relais comprenait:

      - chat de service hébergé à Discord
      - Discorder les messages au service hébergé
      - événements du serveur vers Discord
      - joignez/levez les messages de l'utilisateur
      - Événements possibles de réalisation ou de progression
      - configuration pour le comportement du jeton bot/canal/serveur
      - formatage clair des messages
      - filtrage sûr pour éviter les boucles indésirables ou les fuites de commandes

      C'était un vrai problème d'intégration : un côté est un service hébergé, l'autre est une connexion bot/API Discord, et les deux ont leur propre modèle d'événement.

      ## Contexte du projet

      Le relais appartient à la même configuration de service hébergée plus grande que:

      - ExtensionRuntime hébergement
      - Extension personnalisée de protection de surface
      - règles de comportement du service côté serveur
      - Discorder le flux de travail de la communauté
      - journaux de serveurs et administration

      Le but n'était pas seulement d'envoyer des messages de chat.

      ## Ce que cette extension signifie prouver

      - Les services hébergés peuvent être étendus avec des intégrations pratiques
      - La logique du relais de discorde nécessite une gestion prudente de la direction des messages
      - Le chat bidirectionnel nécessite la prévention des boucles
      - les messages d'événements du serveur doivent être utiles mais pas bruyants
      - configuration doit garder les jetons et les identifiants de canal hors du code
      - intégrations doivent échouer en toute sécurité si Discord n'est pas disponible
      - une extension de service peut agir comme outillage opérationnel, pas seulement le contenu comportemental de service

      ## Pioche et outils utilisés

      ### couche de service

      - service hébergé
      - ExtensionRuntime
      - C#
      - cycle de vie de l'extension côté serveur
      - Crochets de chat
      - l'utilisateur joint/leave manipulation
      - hameçons de l'événement serveur, le cas échéant

      ### Couche de communication externe

      - Compte bot discord
      - jeton bot
      - Numéro de canal de discorde
      - message envoyer la direction
      - message reçu direction
      - filtrage des canaux
      - formatage et désinfection

      ### Calque du serveur

      - Environnement du serveur Linux
      - ExtensionService rapide
      - fichiers de configuration
      - journaux
      - redémarrer/recharger le flux de travail
      - déploiement à travers les fichiers GitHub / dépôt

      ## Construction prévue

      La construction prévue était une extension qui relaie l'activité sélectionnée entre le service hébergé et Discord.

      Une version terminée devrait prendre en charge:

      - chat dans l'application apparaît dans un canal Discord configuré
      - Les messages discordants de ce canal apparaissent dans la demande
      - les messages bot ne retournent pas dans le service à plusieurs reprises
      - les messages de jointure/leave de l'utilisateur peuvent être affichés sur Discord
      - les messages de démarrage/arrêt/état du serveur peuvent être affichés lorsque cela est utile
      - configuration est modifiable sans changement de code source
      - secrets ne sont pas engagés à GitHub
      - les erreurs sont enregistrées clairement
      - le serveur reste jouable si la connexion Discord échoue

      ## Flux de messages

      Le relais a besoin de deux directions claires.

      ### Service hébergé à la plateforme externe

      ```txt
      user sends in-application chat
        ↓
      ExtensionRuntime chat hook receives message
        ↓
      Relay formats message
        ↓
      Discord bot sends message to configured channel
      ```

      Format de l'exemple :

      ```txt
      [hosted service] PlayerName: message
      ```

      ### Plateforme externe vers le service hébergé

      ```txt
      Discord user sends message in configured channel
        ↓
      Bot receives message
        ↓
      Relay filters and formats it
        ↓
      Message appears in hosted service chat
      ```

      Format de l'exemple :

      ```txt
      [Discord] Username: message
      ```

      Les deux directions doivent être visiblement différentes afin que les utilisateurs sachent d'où vient un message.

      ## Prévention des boucles

      Le relais bidirectionnel peut créer accidentellement des boucles.

      Par exemple:

      ```txt
      Discord message → hosted service
      hosted service relay sees message → sends back to Discord
      Discord bot sees its own message → sends again
      ```

      L'extension nécessite des règles comme:

      - ignorer les messages envoyés par le robot lui-même
      - accepter uniquement les messages d'un canal Discord configuré
      - marquer les messages relayés afin qu'ils ne soient pas relayés à nouveau
      - éviter de transmettre les messages du système à moins que cela ne soit prévu
      - éviter les commandes de relais si la sortie de commande doit rester privée

      La prévention des boucles est l'une des parties les plus importantes de la conception des relais.

      ## Filtrage du canal de communication

      Le bot ne devrait pas écouter chaque canal.

      Il ne devrait relayer que depuis l'ID du canal configuré.

      Exemple de direction de configuration:

      ```txt
      DiscordChannelId = 123456789012345678
      ```

      Cela empêche les messages aléatoires de Discord d'apparaître dans le service.

      Il rend également le relais plus facile à modérer car un canal devient le pont officiel.

      ## Direction de configuration

      Une extension de relais pratique devrait avoir une configuration pour:

      ```txt
      bot token
      channel ID
      server name/prefix
      enable Discord-to-service
      enable service-to-Discord
      enable join/leave messages
      enable server event messages
      message format
      admin bypass or filter rules
      ```

      Les secrets ne devraient pas être confiés à GitHub.

      Le jeton bot doit être stocké dans un fichier de configuration, une variable d'environnement ou un emplacement côté serveur privé selon l'implémentation.

      Le contenu du dépôt public ne devrait comporter que des exemples comme :

      ```txt
      BotToken = "PUT_TOKEN_HERE"
      ChannelId = "PUT_CHANNEL_ID_HERE"
      ```

      ## Formatage de la discussion

      Le formatage doit rester lisible.

      Bons formats de messages :

      ```txt
      [hosted service] PlayerName: Hello
      [Discord] Username: Hello from Discord
      [Server] PlayerName joined the service data
      [Server] PlayerName left the service data
      ```

      Évitez le formatage exagéré qui devient ennuyeux dans le chat actif.

      Objectifs de formatage utiles :

      - source est évidente
      - Nom d'utilisateur visible
      - le contenu du message est conservé
      - les événements du serveur sont distincts
      - les messages de modération/système ne ressemblent pas à un chat utilisateur

      ## Événements du serveur

      Événements utiles à relayer:

      - serveur démarré
      - arrêt du serveur
      - utilisateur rejoint
      - utilisateur gauche
      - événement de service important
      - changement de statut pertinent
      - messages de décès si désiré
      - messages de réussite/progression si disponibles

      Chaque événement ne devrait pas être activé par défaut.

      Trop d'événements peuvent rendre Discord bruyant.

      Un bon relais devrait permettre d'activer ou de désactiver les catégories d'événements.

      ## Risques externes liés à la plate-forme vers le service

      La discorde au service est plus sensible que le service à la discorde.

      Si des messages discordants apparaissent dans la demande, l'extension devrait tenir compte :

      - Les noms d'utilisateur de discord peuvent ne pas correspondre aux noms de service hébergés
      - Les messages de discorde peuvent être trop longs
      - Le balisage de la discorde peut nuire à l'application
      - mention comme `@everyone` ne devrait pas devenir perturbateur
      - les commandes bot ne doivent pas être transmises
      - les pièces jointes/images ne peuvent pas être affichées directement dans le chat de service hébergé
      - les règles de modération peuvent différer entre Discord et le serveur

      Le filtrage n'est pas facultatif pour un relais stable.

      ## Risques liés au service à la production

      service-to-Discord est plus facile mais a encore besoin de soins.

      Problèmes potentiels:

      - sortie de commande de fuite
      - fuite de messages administratifs seulement
      - Spamming Discorde avec des événements répétés
      - relais des messages de débogage du serveur
      - exposant les détails du serveur privé
      - formater les messages d'une manière qui pings les gens accidentellement

      Le relais ne devrait envoyer que les messages utiles à la visibilité normale du serveur.

      ## Gestion des défaillances

      Discord peut ne pas être disponible.

      Le relais doit gérer :

      - Mauvais jeton bot
      - ID du canal manquant
      - bot non invité au serveur
      - permissions manquantes
      - défaillance du réseau
      - limites de taux
      - Erreurs d'API de discorde
      - redémarrer le serveur pendant que le bot se reconnecte

      Le service hébergé ne devrait pas s'écraser parce que le relais ne peut pas atteindre Discord.

      Un comportement plus sûr :

      ```txt
      log the relay error
      disable relay temporarily if needed
      keep hosted service running
      retry or require restart depending on implementation
      ```

      ## Autorisations

      Le robot Discord n'a besoin que des autorisations nécessaires pour le relais.

      Il est probable que :

      ```txt
      View Channel
      Send Messages
      Read Message History
      ```

      Selon la mise en œuvre, il peut également être nécessaire:

      ```txt
      Use External Emojis
      Embed Links
      ```

      Mais le relais devrait éviter les autorisations administratives inutiles.

      Un bot pour le relais de chat n'a pas besoin de permissions complètes de l'administrateur Discord.

      ## Liste de vérification

      ### Service à la plateforme externe

      - envoyer le chat de service hébergé normal
      - vérifier que Discord reçoit le message
      - vérifier que le nom d'utilisateur apparaît correctement
      - symboles d'essai et ponctuation
      - tester les messages longs
      - tester les messages vides/invalides
      - tester plusieurs utilisateurs bavarder
      - tester les événements de jointure/de sortie si activé

      ### Plateforme externe vers le service

      - envoyer le message Discord dans le canal configuré
      - vérifier que le service hébergé le reçoit
      - vérifier que les messages bot sont ignorés
      - tester les messages d'un autre canal
      - test Mentions de discorde
      - marquage d ' essai
      - tester les messages longs
      - Pièces d'essai
      - tester les messages d'apparence de commande

      ### Prévention des boucles

      - envoyer un message de Discord
      - confirmer qu'il apparaît dans la demande une fois
      - confirmer qu'il ne rebondit pas à plusieurs reprises
      - envoyer un message du service hébergé
      - confirmer qu'il apparaît dans Discord une fois
      - confirmer que la sortie du disque est ignorée

      ### Essai de défaillance

      - faux jeton
      - mauvaise identification du canal
      - bot accès manquant au canal
      - bot déconnecté
      - Discorde non disponible
      - redémarrage du serveur
      - recharger la configuration si prise en charge

      ## Décisions pratiques

      ### Garder un canal de relais spécifique

      Le relais ne devrait ponter qu'un canal Discord prévu.

      ### Faire apparaître les sources

      les utilisateurs doivent savoir si un message provient du service ou de Discord.

      ### Ne pas tout relayer

      La visibilité utile du serveur est bonne.

      ### Garder le jeton hors de GitHub

      Une repo publique ou privée devrait encore éviter de commettre de véritables jetons de bot.

      ### Échec sans tuer le service hébergé

      L'intégration des discordes est utile, mais la stabilité des services hébergés est plus importante.

      ### Éviter les fuites de commande

      Les commandes Admin, la sortie de console et les messages de serveur cachés ne doivent pas être relayés à moins d'être explicitement prévus.

      ## Ce qu'une extension terminée devrait montrer

      Un relais fini solide devrait montrer:

      - structure de source d'extension propre
      - fichier de configuration ou classe de configuration
      - jeton/canal ID manipulé en toute sécurité
      - chat de service hébergé à Discord
      - Discord canal pour le chat de service hébergé
      - filtre auto-message bot
      - filtrage des canaux
      - joint/leave event relais si activé
      - messages utiles pour les événements du serveur
      - formatage lisible
      - journaux d'erreur
      - pas de crash si Discord échoue
      - ExtensionRuntime build réussi
      - confirmation de chargement du serveur
      - Dépôt GitHub sans secret

      ## Preuves à retenir

      Voici quelques éléments de preuve utiles à cette note :

      - Structure de la réserve GitHub
      - exemple de configuration avec faux jeton
      - construire la sortie
      - ExtensionRuntime charger l'extension
      - chat de service hébergé apparaissant dans Discord
      - Message de discorde apparaissant dans le service hébergé
      - joignez / laissez la capture d'écran de l'événement
      - test de prévention de boucle
      - Configuration de la permission de discorder
      - Gestion des journaux d'erreur
      - Instructions de configuration README

      ## Hypothèses techniques

      Cette note suppose que le relais est construit comme une extension ExtensionRuntime ou un composant compagnon connecté au service hébergé.

      Il suppose que l'intégration Discord utilise un jeton bot et un canal configuré.

      Il suppose que le relais est destiné à un serveur privé/communautaire contrôlé, pas un grand serveur public avec des exigences de modération élevées.

      ## Principaux risques

      - commettre un vrai jeton de bot Discord
      - relais de messages bot et création de boucles
      - transmission de messages du mauvais canal Discord
      - Défaillance de l'API de discorde plantant le service hébergé
      - permissions de robot manquantes
      - relais de messages privés/admin
      - événements de serveur spammy
      - Balisage discord ou mention de perturbations dans le chat de la demande
      - pas de différence claire entre le service et les messages Discord
      - ne pas tester le comportement de reconnect

      ## État actuel

      Cette note représente la direction d'extension du relais Discord pour le service hébergé.

      Il appartient à côté de la note d'hébergement ExtensionRuntime et de la note de protection partagée parce que les trois font partie du même système opérationnel:

      - héberge le serveur
      - appliquer les règles relatives aux données de service
      - connecter le service à Discord

      La valeur principale est que le serveur devient plus facile à suivre et à gérer depuis l'extérieur du service.

      ## Ce que la présente note ne prétend pas

      La présente note ne prétend pas remplacer un robot de modération complet.

      Elle ne prétend pas que chaque événement Discord devrait être relayé.

      Il ne prétend pas que le relais soit adapté aux grands serveurs publics sans contrôles de modération supplémentaires.

      Il documente une extension d'intégration pratique pour connecter l'activité de service hébergé avec un canal Discord.

      ## À emporter pratique

      Un relais Discord semble simple, mais les parties dures sont la fiabilité et les limites.

      Les éléments importants sont les suivants:

      - direction claire du message
      - aucune boucle
      - filtrage des canaux
      - jeton de sécurité
      - formatage lisible
      - relais d'événements optionnel
      - comportement de défaillance sûr
      - Aucune fuite de commande

      Cela en fait une note d'intégration et d'opérations, pas seulement un pont de chat.
seoTitle: "Real-Time Event and Message Relay"
seoDescription: "A practical note about building a server-side relay for application messaging, external messages, service events, configuration, and testing."
---

## Why This Note Exists

This note documents a custom server-side event and message relay.

The goal was to connect the hosted service with an external communication channel so operators and users could follow application activity without being connected all the time.

The relay direction included:

- hosted service chat to Discord
- Discord messages to hosted service
- server events to Discord
- user join/leave messages
- possible achievement or progression events
- configuration for bot token/channel/server behavior
- clear message formatting
- safe filtering to avoid unwanted loops or command leaks

This was a real integration problem: one side is a hosted service, the other side is a Discord bot/API connection, and both have their own event model.

## Project Context

The relay belongs to the same larger hosted service setup as:

- ExtensionRuntime hosting
- custom Surface Protection extension
- server-side service behavior rules
- Discord community workflow
- server logs and administration

The purpose was not only “send chat messages.” The purpose was to make the server easier to follow, moderate, and operate from Discord.

## What This extension Is Meant To Prove

- hosted services can be extended with practical integrations
- Discord relay logic needs careful message direction handling
- bidirectional chat needs loop prevention
- server event messages should be useful but not noisy
- configuration should keep tokens and channel IDs out of code
- integrations should fail safely if Discord is unavailable
- a service extension can act as operational tooling, not only service behavior content

## Stack and Tools Used

### service Layer

- hosted service
- ExtensionRuntime
- C#
- server-side extension lifecycle
- chat hooks
- user join/leave handling
- server event hooks where available

### External Communication Layer

- Discord bot account
- bot token
- Discord channel ID
- message send direction
- message receive direction
- channel filtering
- formatting and sanitization

### Server Layer

- Linux server environment
- ExtensionRuntime service
- configuration files
- logs
- restart/reload workflow
- deployment through GitHub/repository files

## Intended Build

The intended build was a extension that relays selected activity between hosted service and Discord.

A finished version should support:

- in-application chat appears in a configured Discord channel
- Discord messages from that channel appear in-application
- bot messages do not loop back into the service repeatedly
- user join/leave messages can be posted to Discord
- server start/stop/status messages can be posted when useful
- configuration is editable without changing source code
- secrets are not committed to GitHub
- errors are logged clearly
- the server remains playable if Discord connection fails

## Message Flow

The relay needs two clear directions.

### Hosted Service to External Platform

```txt
user sends in-application chat
  ↓
ExtensionRuntime chat hook receives message
  ↓
Relay formats message
  ↓
Discord bot sends message to configured channel
```

Example format:

```txt
[hosted service] PlayerName: message
```

### External Platform to Hosted Service

```txt
Discord user sends message in configured channel
  ↓
Bot receives message
  ↓
Relay filters and formats it
  ↓
Message appears in hosted service chat
```

Example format:

```txt
[Discord] Username: message
```

The two directions should be visibly different so users know where a message came from.

## Loop Prevention

Bidirectional relay can accidentally create loops.

For example:

```txt
Discord message → hosted service
hosted service relay sees message → sends back to Discord
Discord bot sees its own message → sends again
```

The extension needs rules like:

- ignore messages sent by the bot itself
- only accept messages from one configured Discord channel
- mark relayed messages so they are not relayed again
- avoid relaying system messages unless intended
- avoid relaying commands if command output should stay private

Loop prevention is one of the most important parts of relay design.

## Communication Channel Filtering

The bot should not listen to every channel.

It should only relay from the configured channel ID.

Example configuration direction:

```txt
DiscordChannelId = 123456789012345678
```

That prevents random Discord messages from appearing in the service.

It also makes the relay easier to moderate because one channel becomes the official bridge.

## Configuration Direction

A practical relay extension should have configuration for:

```txt
bot token
channel ID
server name/prefix
enable Discord-to-service
enable service-to-Discord
enable join/leave messages
enable server event messages
message format
admin bypass or filter rules
```

Secrets should not be committed to GitHub.

The bot token should be stored in a config file, environment variable, or private server-side location depending on the implementation.

Public repository content should only include examples like:

```txt
BotToken = "PUT_TOKEN_HERE"
ChannelId = "PUT_CHANNEL_ID_HERE"
```

## Chat Formatting

Formatting should stay readable.

Good message formats:

```txt
[hosted service] PlayerName: Hello
[Discord] Username: Hello from Discord
[Server] PlayerName joined the service data
[Server] PlayerName left the service data
```

Avoid overdesigned formatting that becomes annoying in active chat.

Useful formatting goals:

- source is obvious
- username is visible
- message content is preserved
- server events are distinct
- moderation/system messages do not look like user chat

## Server Events

Useful events to relay:

- server started
- server stopping
- user joined
- user left
- significant service event
- relevant status change
- death messages if desired
- achievement/progression messages if available

Not every event should be enabled by default.

Too many events can make Discord noisy.

A good relay should allow event categories to be enabled or disabled.

## External Platform-to-Service Risks

Discord-to-service is more sensitive than service-to-Discord.

If Discord messages appear in-application, the extension should consider:

- Discord usernames may not match hosted service names
- Discord messages may be too long
- Discord markdown may render badly in-application
- mentions like `@everyone` should not become disruptive
- bot commands should not be forwarded
- attachments/images cannot be shown directly in hosted service chat
- moderation rules may differ between Discord and the server

Filtering is not optional for a stable relay.

## Service-to-Platform Risks

service-to-Discord is easier but still needs care.

Potential issues:

- leaking command output
- leaking admin-only messages
- spamming Discord with repeated events
- relaying server debug messages
- exposing private server details
- formatting messages in a way that pings people accidentally

The relay should only send the messages that are useful for normal server visibility.

## Failure Handling

Discord may be unavailable.

The relay should handle:

- wrong bot token
- missing channel ID
- bot not invited to the server
- missing permissions
- network failure
- rate limits
- Discord API errors
- server restart while bot reconnects

The hosted service should not crash because the relay cannot reach Discord.

A safer behavior:

```txt
log the relay error
disable relay temporarily if needed
keep hosted service running
retry or require restart depending on implementation
```

## Permissions

The Discord bot needs only the permissions required for the relay.

Likely permissions:

```txt
View Channel
Send Messages
Read Message History
```

Depending on implementation, it may also need:

```txt
Use External Emojis
Embed Links
```

But the relay should avoid unnecessary admin-level permissions.

A bot for chat relay does not need full Discord administrator permissions.

## Testing Checklist

### Service to External Platform

- send normal hosted service chat
- verify Discord receives the message
- verify username appears correctly
- test symbols and punctuation
- test long messages
- test empty/invalid messages
- test multiple users chatting
- test join/leave events if enabled

### External Platform to Service

- send Discord message in the configured channel
- verify hosted service receives it
- verify bot messages are ignored
- test messages from another channel
- test Discord mentions
- test markdown
- test long messages
- test attachments
- test command-looking messages

### Loop Prevention

- send message from Discord
- confirm it appears in-application once
- confirm it does not bounce back repeatedly
- send message from hosted service
- confirm it appears in Discord once
- confirm bot’s Discord output is ignored

### Failure Testing

- wrong token
- wrong channel ID
- bot missing channel access
- bot disconnected
- Discord unavailable
- server restart
- reload config if supported

## Practical Decisions

### Keep relay channel-specific

The relay should only bridge one intended Discord channel.

### Make sources obvious

users should know whether a message came from the service or Discord.

### Do not relay everything

Useful server visibility is good. Noise is not.

### Keep token out of GitHub

A public or private repo should still avoid committing real bot tokens.

### Fail without killing the hosted service

Discord integration is useful, but hosted service stability is more important.

### Avoid command leakage

Admin commands, console output, and hidden server messages should not be relayed unless explicitly intended.

## What A Finished extension Should Show

A strong finished relay should show:

- clean extension source structure
- config file or config class
- token/channel ID handled safely
- hosted service chat to Discord
- Discord channel to hosted service chat
- bot self-message filtering
- channel filtering
- join/leave event relay if enabled
- useful server event messages
- readable formatting
- error logs
- no crash if Discord fails
- successful ExtensionRuntime build
- server load confirmation
- GitHub repository with no secrets

## Evidence Worth Capturing

Useful evidence for this note would include:

- GitHub repo structure
- config example with fake token
- build output
- ExtensionRuntime loading the extension
- hosted service chat appearing in Discord
- Discord message appearing in hosted service
- join/leave event screenshot
- loop prevention test
- Discord permission setup
- error handling logs
- README setup instructions

## Technical Assumptions

This note assumes the relay is built as an ExtensionRuntime extension or companion component connected to the hosted service.

It assumes Discord integration uses a bot token and a configured channel.

It assumes the relay is intended for a controlled private/community server, not a large public server with heavy moderation requirements.

## Key Risks

- committing a real Discord bot token
- relaying bot messages and creating loops
- forwarding messages from the wrong Discord channel
- Discord API failure crashing the hosted service
- missing bot permissions
- relaying private/admin messages
- spammy server events
- Discord markdown or mentions disrupting in-application chat
- no clear difference between service and Discord messages
- not testing reconnect behavior

## Current State

This note represents the Discord relay extension direction for the hosted service.

It belongs next to the ExtensionRuntime hosting note and the shared-area protection note because all three are part of the same operational system:

- host the server
- enforce service data rules
- connect the service to Discord

The main value is that the server becomes easier to follow and manage from outside the service.

## What This Note Does Not Claim

This note does not claim to replace a full moderation bot.

It does not claim that every Discord event should be relayed.

It does not claim the relay is suitable for large public servers without additional moderation controls.

It documents a practical integration extension for connecting hosted service activity with a Discord channel.

## Practical Takeaway

A Discord relay sounds simple, but the hard parts are reliability and boundaries.

The important parts are:

- clear message direction
- no loops
- channel filtering
- token safety
- readable formatting
- optional event relay
- safe failure behavior
- no command leakage

That makes it an integration and operations note, not just a chat bridge.
