---
resume: false
title: "Building Server-Side Shared-Area Protection"
slug: "building-server-side-shared-area-protection"
summary: "Field notes from building a server-side extension that protects shared areas from unauthorized changes while preserving permitted user actions."
resumeSummary: >-
  Developed a server-side protection extension for shared areas, designed to block unauthorized changes without preventing legitimate use of the environment. The design defines protected regions, intercepts break, placement, and interaction events, applies permission checks, sends useful chat feedback, and handles dependent objects whose behaviour is linked to a protected parent. It also records build and debugging issues encountered while refining rules, showing how event-driven authorization needs to account for edge cases rather than only the obvious action.
category: "Server-side Extensions"
tags:
  - server-side-extension
  - csharp
  - shared-area-protection
  - server-rules
  - anti-grief
  - debugging
date: "2026-07-08"
updated: "2026-07-25"
featured: true
published: true
translations:
  fr:
    title: "Mise en place d’une protection serveur des zones partagées"
    category: "Extensions côté serveur"
    summary: "Notes sur une extension côté serveur protégeant des zones partagées contre les modifications non autorisées tout en conservant les actions permises."
    resumeSummary: >-
      Développé une extension de protection côté serveur pour les zones partagées, conçue pour bloquer les
      changements non autorisés sans empêcher l'utilisation légitime de l'environnement. La conception définit
      les régions protégées, intercepte les événements de rupture, de placement et d'interaction, applique des
      vérifications d'autorisation, envoie des commentaires de chat utiles, et gère les objets dépendants dont
      le comportement est lié à un parent protégé. Il enregistre également les problèmes de construction et de
      débogage rencontrés lors de l'affinage des règles, montrant comment l'autorisation axée sur les
      événements doit tenir compte des cas de bord plutôt que de la seule action évidente.
    body: |-

      ## Pourquoi cette note existe

      Cette note documente une extension personnalisée côté serveur construite pour protéger les zones partagées dans un service multi-utilisateurs.

      L'objectif était d'empêcher toute modification sans restriction des zones partagées tout en préservant l'utilisation normale du service. La surface visible devait être protégée contre les abus et les dommages accidentels, tandis que la zone de travail inférieure restait disponible pour l'activité ordinaire.

      La partie utile de ce projet n'était pas seulement l'écriture de code C#. Il traduisait une règle de comportement de service en un système fiable côté serveur.

      ## contexte

      Le serveur a utilisé ExtensionRuntime.

      L'extension personnalisée a été créée dans le répertoire source ExtensionRuntime :

      ```txt
      /home/opc/tml-arm/ExtensionRuntime/ExtensionSources/SurfaceProtection
      ```

      L'extension a été construite sur le serveur en utilisant une commande en forme de:

      ```bash
      dotnet ExtensionRuntime.dll -build SurfaceProtection -tmlsavedirectory /home/opc/tml-arm/ExtensionRuntime
      ```

      Le chemin exact du serveur peut changer, mais la structure compte :

      ```txt
      ExtensionRuntime/
        ExtensionSources/
          SurfaceProtection/
            SurfaceProtection.csproj
            Common/
              Systems/
              GlobalTiles/
              users/
      ```

      L'extension appartenait à la même configuration plus grande du serveur d'application qui impliquait ExtensionRuntime, hébergement ARM/Linux, configuration du serveur, construction d'extension, et application des règles de comportement de service.

      ## Ce que cette extension signifie prouver

      - Les règles du serveur peuvent être appliquées techniquement au lieu de s'appuyer uniquement sur la confiance
      - extension côté serveurLa logique Runtime a besoin d'une gestion des objets soignée
      - prévenir le chagrin peut créer des cas imprévus de comportement de service
      - les zones protégées et les zones autorisées devraient être séparées clairement
      - une règle doit être testée contre un comportement de service normal, non seulement des cas évidents
      - développement d'extension personnalisée nécessite de débogage à la fois C# build erreurs et comportement de service
      - La conception de serveur multijoueur est en partie la conception de logiciel et en partie la conception de comportement de service

      ## Pioche et outils utilisés

      ### développement de services et d'extension

      - demande
      - ExtensionRuntime
      - C#
      - ExtensionStructure de la source du temps
      - crochets de niveau objet
      - logique de retrait et de placement des objets
      - chat utilisateur feedback

      ### Calque du serveur

      - Linux VPS
      - Environnement ARM/Ampère
      - `.NET` temps d'exécution
      - Commande ExtensionRuntime build
      - journaux des serveurs
      - sortie de construction d'extension

      ### comportement de service Rule Layer

      - zone protégée
      - Zone de travail autorisée
      - modifier les restrictions
      - manipulation d'exception d'objet
      - comportement anti-grief
      - exploiter les essais

      ## Construction prévue

      La construction prévue était une extension de règle côté serveur qui empêche les utilisateurs de modifier une zone protégée tout en préservant les actions autorisées ailleurs.

      Une version terminée devrait :

      - changement de bloc dans la zone protégée
      - bloquer le placement d'objets non autorisés si nécessaire
      - permettre des changements dans la zone de travail autorisée
      - prévenir les utilisateurs lorsqu'une action est bloquée
      - éviter les bugs de duplication des éléments
      - éviter de bloquer l'utilisation normale du service
      - se comporter de façon cohérente en multijoueur
      - être facile à reconstruire et à redéployer après les changements de règles

      ## Règle initiale

      La première directive était :

      ```txt
      Protect the shared area from modification.
      Allow changes in the permitted work area.
      ```

      Des exceptions antérieures ont été envisagées pour:

      - objets dépendants sélectionnés
      - objets portant des ressources
      - marqueurs créés par l'utilisateur

      Plus tard, la règle est devenue plus stricte:

      ```txt
      Prevent all placement in the protected area.
      Keep the permitted work area available.
      ```

      Ce changement est important parce qu'un système de règles plus lâche a besoin de listes d'exception, tandis qu'un système de règles plus strict a besoin de moins d'exceptions mais peut affecter le comportement normal de construction plus.

      ## Définition de zone protégée

      La décision de conception la plus importante est la façon dont l'extension définit l'aire protégée.

      Les données d'un service d'application ont plusieurs couches, et la limite exacte dépend des données de service.

      La règle doit être vérifiée de manière cohérente, par exemple :

      ```txt
      if cellY is inside the protected-area threshold:
          apply protection
      else:
          allow normal behavior
      ```

      Une mauvaise définition des limites peut causer des problèmes :

      - les objets près de la frontière peuvent être protégés incorrectement
      - les actions autorisées peuvent être bloquées
      - les zones adjacentes peuvent être touchées de façon inattendue
      - les différences de taille des données de service peuvent déplacer la limite de la règle
      - les utilisateurs peuvent trouver des cas de bord autour du seuil

      La limite doit être visible en code et facile à régler.

      ## Logique d'interception du changement

      La règle commence quand le service intercepte une tentative de changement.

      L'extension doit intercepter les tentatives d'enlèvement d'objets et décider:

      ```txt
      Is this object in the protected area?
        yes → block the action
        no  → allow normal service behavior
      ```

      L'objectif pratique n'est pas seulement de bloquer le changement direct, mais aussi de prévenir les chutes, les effets secondaires et l'incohérence de l'état client.

      L'action bloquée devrait être claire pour l'utilisateur.

      Un message d'avertissement est utile:

      ```txt
      [Server] This area is protected. Use the permitted work area instead.
      ```

      ## Logique de placement des objets

      Le placement des objets est également important.

      Si la suppression est bloquée mais que le placement est autorisé, les utilisateurs peuvent encore modifier la zone protégée avec de nouveaux objets.

      Une règle de protection de surface plus stricte devrait également bloquer la mise en place:

      ```txt
      if user tries to place an object in the protected area:
          cancel placement
          show message
      ```

      Cela évite les encombrements et maintient la zone partagée cohérente.

      ## Clavardage

      Le serveur doit indiquer aux utilisateurs pourquoi une action a échoué.

      Un bloc silencieux ressemble à un lag ou un bug.

      Le style de message souhaité était un avertissement sur le serveur, quelque chose comme :

      ```txt
      [Server] Surface editing is protected.
      ```

      L'objectif visuel était :

      - Étiquette `[Server]`
      - couleur lisible
      - Pas trop de spammy
      - suffisamment visibles pour expliquer la règle

      Un comportement final utile devrait inclure une logique de limitation de vitesse ou de refroidissement afin que les utilisateurs ne soient pas spammés chaque tique tout en tenant un outil.

      ## Construire et déboguer des erreurs

      Plusieurs problèmes de construction/d'exécution sont apparus au cours du développement.

      ### Nom manquant ou erreur de type

      Un problème concernait un nom `SurfaceRules` manquant.

      Cela signifie généralement:

      - mauvais espace de noms
      - classe non créée
      - classe non importée avec `using`
      - fichier non inclus dans le projet
      - typo entre le nom de la classe et la référence

      Direction pratique:

      ```txt
      check namespace
      check class name
      check file path
      check using statements
      rebuild cleanly
      ```

      ### Erreur d'opérateur non valide

      Un autre problème consistait à comparer un booléen à un entier :

      ```txt
      bool > int
      ```

      Cela se produit habituellement lorsqu'une propriété ou une méthode renvoie `true/false`, mais le code le traite comme une valeur numérique.

      Direction pratique:

      ```txt
      read the ExtensionRuntime API return type
      do not guess from older examples
      compare booleans as booleans
      compare integers as integers
      ```

      ### FNA3D Problème de temps d'exécution

      Un problème `FNA3D.so` est apparu pendant le chemin de construction serveur/extension.

      Cela appartenait plus à l'environnement Linux et ExtensionRuntime que la logique de règle elle-même.

      La leçon était:

      ```txt
      extension code errors and runtime/native library errors are different problems
      ```

      Ne pas déboguer le code de règle C# lorsque l'exécution ne peut pas charger une dépendance native requise.

      ### Drop Override Type de retour

      Une erreur de construction était:

      ```txt
      Drop(int, int, int) must return void
      ```

      Le membre dépassé attendait `void`, mais le code d'extension utilisait le mauvais type de retour.

      C'est un problème courant ExtensionRuntime-version:

      - exemples d'une autre version peuvent utiliser différentes signatures
      - les méthodes de remplacement doivent correspondre exactement
      - erreurs de compilateur sont souvent la meilleure documentation d'API pendant le développement d'extension

      Direction pratique:

      ```txt
      match the exact method signature required by the installed ExtensionRuntime version
      ```

      ## Cas de bord d'objet dépendant

      Un bug important impliquait un objet dépendant : il était attaché à un objet de base, mais les deux étaient traités par des chemins de changement séparés.

      Lorsque l'interaction base-objet a été bloquée incorrectement, l'objet dépendant a pu produire un élément puis réapparaître.

      Cela a montré que la protection n'est pas seulement l'objet que l'utilisateur cible directement. Le modèle de données peut inclure:

      - objets de base et objets dépendants
      - objets avec plusieurs cellules occupées
      - objets qui déclenchent des chutes lorsqu'un objet lié change
      - état visuel côté client qui doit être d'accord avec l'état du serveur

      Bloquer un changement peut encore déclencher des effets secondaires ailleurs. La règle doit donc tester la relation complète, pas un objet isolé.

      ## Prévention de l'exploitation

      Une extension de protection ne doit pas créer de nouveau chemin de duplication.

      Un bon test devrait vérifier:

      - si une action bloquée change un objet dépendant
      - si un élément est créé sans le changement d'état attendu
      - si le même élément peut être créé à plusieurs reprises
      - si l'état du serveur correspond aux visuels du client
      - si des actions répétées produisent des résultats incohérents

      La règle devrait empêcher les deux :

      ```txt
      unauthorised shared-area modification
      and
      unearned item drops
      ```

      Si une action bloquée crée encore des gouttes, la protection est incomplète.

      ## Liste de vérification

      Une épreuve pratique devrait comprendre:

      ### Changements dans les zones protégées

      - essayer de supprimer les objets de base
      - essayer de supprimer les objets dépendants
      - essayer de changer les objets près de la frontière
      - essayer de modifier les objets créés par l'utilisateur
      - essayer de changer les objets décoratifs

      ### Positionnement de l'objet

      - essayer de placer des objets ordinaires
      - essayer de placer des objets multicellules
      - essayer de placer des objets adjacents à des objets protégés

      ### Comportement de zone autorisée

      - effectuer des changements ordinaires dans la zone autorisée
      - placer et enlever les objets ordinaires
      - confirmer l'utilisation normale du service fonctionne toujours

      ### Comportement multijoueur

      - test en tant qu'utilisateur normal
      - test en tant qu'administrateur s'il existe un contournement d'administrateur
      - test répété clic rapide
      - test avec plusieurs utilisateurs à proximité
      - vérifier les journaux du serveur
      - vérifier l'inadéquation de l'état client/serveur

      ### Exploiter le comportement

      - objets dépendants de l'essai
      - changement de base-objet
      - chute d'essai
      - Tester les actions bloquées répétées
      - tester des objets multicellules

      ## Décisions pratiques

      ### Gardez les règles côté serveur

      les utilisateurs ne devraient pas pouvoir contourner la règle en modifiant leur client.

      ### Maintenir le comportement autorisé normal

      Le serveur a encore besoin de progression. Bloquer trop fait que les données du service se sentent cassées.

      ### Blocage et rupture

      Si la protection arrête seulement l'enlèvement, les utilisateurs peuvent toujours modifier la zone par le placement.

      ### Éviter de trop nombreuses exceptions

      Une règle plus stricte est plus facile à raisonner.

      ### Tester les relations entre les objets dépendants

      Le service a des objets dépendants. La protection d'un objet peut affecter un autre.

      ### Afficher les commentaires aux utilisateurs

      Une action bloquée devrait s'expliquer.

      ## Ce qu'une extension terminée devrait montrer

      Une version terminée forte devrait montrer:

      - propre ExtensionRuntime structure du projet
      - règle de zone protégée isolée dans le code lisible
      - protection contre la rupture
      - lieu de protection
      - Allocation de surface autorisée
      - message d'avertissement de l'utilisateur
      - Pas de spam de chat répété
      - aucune voie de duplication dépendante-objet
      - commande build réussie
      - confirmation de chargement du serveur
      - test multijoueur
      - des points de configuration clairs si la règle nécessite un réglage

      ## Preuves à retenir

      Voici quelques éléments de preuve utiles à cette note :

      - Capture d'écran du dépôt d'extension
      - Arbre source `SurfaceProtection`
      - build commande output
      - construction réussie d'extension
      - serveur chargeant l'extension
      - Essai de changement de zone protégée bloqué
      - Essai de changement de zone autorisé
      - Essai de placement dans une zone protégée bloquée
      - chat avertissement capture d'écran
      - avant/après les preuves de bogue d'objet dépendant
      - Essai final de fixation de l'exploitation
      - messages d'erreur pertinents et corrections

      ## Hypothèses techniques

      Cette note suppose que l'extension fonctionne dans un environnement ExtensionRuntime.

      Il suppose que l'application côté serveur est possible grâce aux crochets de niveau objet pertinents disponibles dans la version ExtensionRuntime installée.

      Elle suppose que la règle de la zone protégée s'applique à un service privé ou communautaire ayant un but opérationnel défini.

      ## Principaux risques

      - Mauvaise version de l'API ExtensionRuntime
      - les signatures de remplacement copiées à partir d'exemples dépassés
      - seuil trop strict ou trop lâche
      - bloquer les objets mais toujours permettre les gouttes
      - client/serveur désync
      - chat avertissement spam
      - bloquant accidentellement l'utilisation autorisée du service
      - permettant un placement indésirable tout en bloquant uniquement l'enlèvement
      - listes d'exception fragiles
      - testant un seul type d'objet et manquant un comportement dépendant-objet

      ## État actuel

      Cette note représente la direction d'extension de protection de surface personnalisée.

      La leçon la plus importante a été qu'une règle simple — de protéger cette zone — devient plus complexe lorsqu'elle est traduite dans le modèle d'objet du service.

      Le vrai travail n'était pas seulement de bloquer une action. Il s'agissait de s'assurer que l'action bloquée ne créait pas d'effets secondaires, d'exploitations ou de confusion du comportement de l'utilisateur.

      ## Ce que la présente note ne prétend pas

      La présente note ne prétend pas que l'extension soit un système anti-chaleur général.

      Il ne prétend pas résoudre toutes les méthodes de deuil possibles.

      Il ne prétend pas être un public poli ExtensionRuntime.

      Il documente une extension de serveur personnalisée pratique construite pour une règle de service multi-utilisateurs spécifique.

      ## À emporter pratique

      L'option utile est :

      > Une règle serveur n'est fiable que lorsqu'elle est appliquée en code, testée contre les cas de bord, et vérifiée pour les effets secondaires.

      Pour cette extension, les parties importantes étaient:

      - définir clairement la zone protégée
      - bloc suppression non autorisée
      - bloc placement non autorisé
      - préserver les actions autorisées ailleurs
      - prévenir clairement les utilisateurs
      - correspondre à l'API ExtensionRuntime installée
      - test des relations dépendantes-objets
      - empêcher les exploits de chute d'article

      Cela en fait une vraie note de comportement de service-systèmes, pas seulement une petite extension C#.
seoTitle: "Building Server-Side Shared-Area Protection"
seoDescription: "A practical note about building a server-side extension that enforces shared-area protection, handles build errors, and accounts for operational edge cases."
---

## Why This Note Exists

This note documents a custom server-side extension built to protect shared areas in a multi-user service.

The goal was to prevent unrestricted modification of shared areas while preserving normal use of the service. The visible surface needed protection from abuse and accidental damage, while the lower working area remained available for ordinary activity.

The useful part of this project was not only writing C# code. It was translating a service behavior rule into a reliable server-side enforcement system.

## extension Context

The server used ExtensionRuntime.

The custom extension was created under the ExtensionRuntime source directory:

```txt
/home/opc/tml-arm/ExtensionRuntime/ExtensionSources/SurfaceProtection
```

The extension was built on the server using a command shaped like:

```bash
dotnet ExtensionRuntime.dll -build SurfaceProtection -tmlsavedirectory /home/opc/tml-arm/ExtensionRuntime
```

The exact server path can change, but the structure matters:

```txt
ExtensionRuntime/
  ExtensionSources/
    SurfaceProtection/
      SurfaceProtection.csproj
      Common/
        Systems/
        GlobalTiles/
        users/
```

The extension belonged to the same larger application server setup that involved ExtensionRuntime, ARM/Linux hosting, server configuration, extension building, and service behavior rule enforcement.

## What This extension Is Meant To Prove

- server rules can be enforced technically instead of relying only on trust
- server-side ExtensionRuntime logic needs careful object handling
- preventing griefing can create unexpected service behavior edge cases
- protected and permitted areas should be separated clearly
- a rule should be tested against normal service behavior, not only obvious cases
- custom extension development requires debugging both C# build errors and service behavior
- multiplayer server design is partly software design and partly service behavior design

## Stack and Tools Used

### service and extension development Layer

- application
- ExtensionRuntime
- C#
- ExtensionRuntime source structure
- object-level hooks
- object removal and placement logic
- user chat feedback

### Server Layer

- Linux VPS
- ARM/Ampere environment
- `.NET` runtime
- ExtensionRuntime build command
- server logs
- extension build output

### service behavior Rule Layer

- protected area
- permitted work area
- change restrictions
- object exception handling
- anti-grief behavior
- exploit testing

## Intended Build

The intended build was a server-side rule extension that prevents users from modifying a protected area while preserving permitted actions elsewhere.

A finished version should:

- block changes in the protected area
- block unauthorised object placement where required
- allow changes in the permitted work area
- warn users when an action is blocked
- avoid item duplication bugs
- avoid blocking normal use of the service
- behave consistently in multiplayer
- be easy to rebuild and redeploy after rule changes

## Original Rule Direction

The first rule direction was:

```txt
Protect the shared area from modification.
Allow changes in the permitted work area.
```

Earlier exceptions were considered for:

- selected dependent objects
- resource-bearing objects
- user-created markers

Later the rule became stricter:

```txt
Prevent all placement in the protected area.
Keep the permitted work area available.
```

That change matters because a looser rule system needs exception lists, while a stricter rule system needs fewer exceptions but can affect normal building behavior more.

## Protected-Area Definition

The most important design decision is how the extension defines the protected area.

A application service data has several layers, and the exact boundary depends on service data.

The rule needs a consistent check such as:

```txt
if cellY is inside the protected-area threshold:
    apply protection
else:
    allow normal behavior
```

A bad boundary definition can cause problems:

- objects near the boundary may be protected incorrectly
- permitted actions may be blocked
- adjacent areas may be affected unexpectedly
- service data size differences may shift the rule boundary
- users may find edge cases around the threshold

The boundary should be visible in code and easy to tune.

## Change-Interception Logic

The rule starts when the service intercepts an attempted change.

The extension needs to intercept object-removal attempts and decide:

```txt
Is this object in the protected area?
  yes → block the action
  no  → allow normal service behavior
```

The practical goal is not only to block the direct change. It also needs to prevent drops, side effects, and inconsistent client state.

The blocked action should feel clear to the user.

A warning message is useful:

```txt
[Server] This area is protected. Use the permitted work area instead.
```

## Object-Placement Logic

Object placement also matters.

If removal is blocked but placement is allowed, users can still alter the protected area with new objects.

A stricter surface protection rule should block placing too:

```txt
if user tries to place an object in the protected area:
    cancel placement
    show message
```

This prevents clutter and keeps the shared area consistent.

## Chat Warning Direction

The server should tell users why an action failed.

A silent block feels like lag or a bug.

The desired message style was a server-tagged warning, something like:

```txt
[Server] Surface editing is protected.
```

The visual goal was:

- `[Server]` tag
- readable color
- not too spammy
- visible enough to explain the rule

A useful final behavior should include rate limiting or cooldown logic so users are not spammed every tick while holding a tool.

## Build and Debugging Errors

Several build/runtime issues appeared during development.

### Missing Name or Type Errors

One issue involved a missing `SurfaceRules` name.

This usually means:

- wrong namespace
- class not created
- class not imported with `using`
- file not included in the project
- typo between class name and reference

Practical fix direction:

```txt
check namespace
check class name
check file path
check using statements
rebuild cleanly
```

### Invalid Operator Error

Another issue involved comparing a boolean with an integer:

```txt
bool > int
```

That usually happens when a property or method returns `true/false`, but the code treats it like a numeric value.

Practical fix direction:

```txt
read the ExtensionRuntime API return type
do not guess from older examples
compare booleans as booleans
compare integers as integers
```

### FNA3D Runtime Issue

An `FNA3D.so` issue appeared during the server/extension build path.

That belonged more to the Linux and ExtensionRuntime environment than the rule logic itself.

The lesson was:

```txt
extension code errors and runtime/native library errors are different problems
```

Do not debug C# rule code when the runtime cannot load a required native dependency.

### Drop Override Return Type

One build error was:

```txt
Drop(int, int, int) must return void
```

The overridden member expected `void`, but the extension code used the wrong return type.

This is a common ExtensionRuntime-version problem:

- examples from another version may use different signatures
- override methods must match exactly
- compiler errors are often the best API documentation during extension development

Practical fix direction:

```txt
match the exact method signature required by the installed ExtensionRuntime version
```

## Dependent-Object Edge Case

One important bug involved a dependent object: it was attached to a base terrain object, but the two were handled by separate change paths.

When the base-object interaction was blocked incorrectly, the dependent object could produce an item and then reappear. That created a repeatable duplication path.

That showed that protection is not only about the object the user directly targets. The data model can include:

- base objects and dependent objects
- objects with multiple occupied cells
- objects that trigger drops when a related object changes
- client-side visual state that must agree with server state

Blocking one change can still trigger side effects elsewhere. The rule therefore needs to test the complete relationship, not one object in isolation.

## Exploit Prevention

A protection extension must not create a new duplication path.

A good test should check:

- whether a blocked action changes a dependent object
- whether an item is created without the expected state change
- whether the same item can be created repeatedly
- whether server state matches client visuals
- whether repeated actions produce inconsistent results

The rule should prevent both:

```txt
unauthorised shared-area modification
and
unearned item drops
```

If a blocked action still creates drops, the protection is incomplete.

## Testing Checklist

A practical test pass should include:

### Protected-Area Changes

- try removing base objects
- try removing dependent objects
- try changing objects near the boundary
- try changing user-created objects
- try changing decorative objects

### Object Placement

- try placing ordinary objects
- try placing multi-cell objects
- try placing objects adjacent to protected objects

### Permitted-Area Behavior

- perform ordinary changes in the permitted area
- place and remove ordinary objects
- confirm normal service use still works

### Multiplayer Behavior

- test as normal user
- test as admin if admin bypass exists
- test repeated fast clicking
- test with multiple users nearby
- check server logs
- check client/server state mismatch

### Exploit Behavior

- test dependent objects
- test base-object changes
- test item drops
- test repeated blocked actions
- test multi-cell objects

## Practical Decisions

### Keep rules server-side

users should not be able to bypass the rule by changing their client.

### Keep permitted behavior normal

The server still needs progression. Blocking too much makes the service data feel broken.

### Block placing as well as breaking

If protection only stops removal, users can still alter the area through placement.

### Avoid too many exceptions

Every exception adds edge cases. A stricter rule is easier to reason about.

### Test dependent-object relationships

The service has dependent objects. Protecting one object can affect another.

### Show feedback to users

A blocked action should explain itself.

## What A Finished extension Should Show

A strong finished version should show:

- clean ExtensionRuntime project structure
- protected-area rule isolated in readable code
- break protection
- place protection
- permitted-area allowance
- user warning message
- no repeated chat spam
- no dependent-object duplication path
- successful build command
- server load confirmation
- multiplayer testing
- clear configuration points if the rule needs tuning

## Evidence Worth Capturing

Useful evidence for this note would include:

- extension repository screenshot
- `SurfaceProtection` source tree
- build command output
- successful extension build
- server loading the extension
- blocked protected-area change test
- permitted-area change test
- blocked protected-area placement test
- chat warning screenshot
- before/after dependent-object bug evidence
- final exploit fix test
- relevant error messages and fixes

## Technical Assumptions

This note assumes the extension runs in an ExtensionRuntime environment.

It assumes server-side enforcement is possible through the relevant object-level hooks available in the installed ExtensionRuntime version.

It assumes the protected-area rule is meant for a private or community service with a defined operational purpose.

## Key Risks

- wrong ExtensionRuntime API version
- override signatures copied from outdated examples
- protected-area threshold too strict or too loose
- blocking objects but still allowing drops
- client/server desync
- chat warning spam
- accidentally blocking permitted service use
- allowing unwanted placement while blocking only removal
- fragile exception lists
- testing only one object type and missing dependent-object behavior

## Current State

This note represents the custom Surface Protection extension direction.

The most important lesson was that a simple rule — “protect this area” — becomes more complex when translated into the service’s object model.

The real work was not only blocking an action. It was making sure the blocked action did not create side effects, exploits, or confusing user behavior.

## What This Note Does Not Claim

This note does not claim the extension is a general anti-cheat system.

It does not claim to solve every possible griefing method.

It does not claim to be a polished public ExtensionRuntime release.

It documents a practical custom server extension built for a specific multi-user service rule.

## Practical Takeaway

The useful takeaway is:

> A server rule is only reliable when it is enforced in code, tested against edge cases, and checked for side effects.

For this extension, the important parts were:

- define the protected area clearly
- block unauthorised removal
- block unauthorised placement
- preserve permitted actions elsewhere
- warn users clearly
- match the installed ExtensionRuntime API
- test dependent-object relationships
- prevent item drop exploits

That makes it a real service behavior-systems note, not just a small C# extension.
