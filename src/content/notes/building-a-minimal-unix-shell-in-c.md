---
resume: true
title: "Building a Minimal Unix Shell in C"
slug: "building-a-minimal-unix-shell-in-c"
summary: "Field notes from building a small Unix-like shell in C to understand process creation, command parsing, PATH lookup, environment handling, and low-level Linux behavior."
resumeSummary: >-
  Implemented a minimal Unix-style shell in C to study how command execution works beneath a terminal interface. The work follows the complete loop of reading input, tokenizing commands, handling built-ins, resolving executables through PATH and environment variables, then coordinating fork, exec, and wait behaviour. It also records parsing and error-handling edge cases, making the project a practical exploration of processes, memory boundaries, exit status, and the distinction between a shell command and the program it launches.
category: "Systems Programming"
tags:
  - c
  - linux
  - unix
  - shell
  - processes
  - fork
  - exec
  - wait
  - memory-management
  - systems-programming
date: "2024-01-01"
updated: "2026-07-25"
featured: true
published: true
translations:
  fr:
    title: "Création d’un shell Unix minimal en C"
    category: "Programmation système"
    summary: "Notes sur un petit shell de type Unix en C pour comprendre la création de processus, l’analyse des commandes, la recherche PATH, l’environnement et Linux de bas niveau."
    resumeSummary: >-
      Implémenté un shell de style Unix minimal en C pour étudier comment l'exécution des commandes fonctionne
      sous une interface terminal. Le travail suit la boucle complète de lecture, tokenizing commandes, la
      gestion intégrée, la résolution des exécutables à travers PATH et variables d'environnement, puis la
      coordination de la fourche, de l'exec et du comportement d'attente. Il enregistre également l'analyse et
      la gestion des cas de bord d'erreur, faisant du projet une exploration pratique des processus, des
      limites de mémoire, de l'état de sortie et de la distinction entre une commande shell et le programme
      qu'il lance.
    body: |-

      ## Pourquoi cette note existe

      Cette note documente le processus de construction d'un shell minimal Unix en C.

      Le projet est précieux parce qu'un shell se trouve près du système d'exploitation. Même une petite version vous oblige à comprendre comment Linux démarre les programmes, passe les arguments, gère les variables d'environnement, attend les processus enfant et signale les échecs.

      Le but n'était pas de remplacer Bash ou Zsh.

      Le but était de comprendre les mécanismes de niveau inférieur derrière une commande comme:

      ```bash
      ls -la
      ```

      Un utilisateur normal voit une commande. Un shell doit :

      ```txt
      read input
      split arguments
      find the executable
      create a child process
      run the command
      wait for it
      return to the prompt
      ```

      Cela en fait une note de programmation de systèmes utile.

      ## Contexte du projet

      Le shell a été construit en C comme un projet fondamental axé sur le comportement du processus Linux.

      Il fait partie d'un portefeuille comme note technique de niveau inférieur, pas comme un projet d'entreprise/client.

      La valeur est de montrer la compréhension de:

      - C programmation
      - Création de processus Unix
      - analyse de commande
      - recherche exécutable
      - variables environnementales
      - Gestion des erreurs
      - répartition de la mémoire
      - cas bord
      - simples programmes interactifs

      Ce projet est différent des notes d'infrastructure comme WireGuard, OpenWrt, ou l'hébergement de serveur de jeux. Il montre le côté système d'exploitation de la pile.

      ## Ce que ce projet veut prouver

      - un shell est un gestionnaire de processus, et pas seulement une invite de texte
      - L'exécution de la commande Linux dépend de `fork`, `exec` et `wait`
      - arguments doivent être analysés avant l'exécution
      - commandes sans `/` besoin de résolution PATH
      - les commandes intégrées doivent être gérées par le shell lui-même
      - la mémoire doit être attribuée et libérée avec soin
      - les messages d'erreur devraient être prévisibles
      - les petits programmes C exigent une discipline parce qu'il n'y a pas de filet de sécurité

      ## Pioche et outils utilisés

      ### Langue et temps d'exécution

      - C
      - Linux
      - Appels système de type POSIX
      - GCC
      - bibliothèque standard C

      ### Appels et fonctions système

      - `fork`
      - `execve`
      - `wait` / `waitpid`
      - `getline`
      - `malloc`
      - `free`
      - `strtok` ou tokenisation manuelle
      - `access`
      - `stat`
      - gestion variable de l'environnement

      ### Concepts Shell

      - boucle rapide
      - analyse de commande
      - vecteur d'argument
      - Recherche PATH
      - exécution de processus pour enfants
      - commandes intégrées
      - État de sortie
      - Gestion des erreurs

      ## Construction prévue

      La construction prévue est un shell minimal qui peut:

      - afficher une invite
      - lire la saisie utilisateur
      - analyse une commande en arguments
      - exécuter des binaires
      - Recherche par PATH
      - gérer les erreurs de commande
      - soutien intégré de base
      - sortie proprement
      - éviter les fuites de mémoire évidentes
      - travail en mode interactif et non interactif

      Un shell minimal n'a pas besoin de fonctionnalités avancées au début.

      Elle n'a pas besoin de soutenir:

      - tuyaux
      - redirection
      - contrôle de l'emploi
      - historique des commandes
      - fin de l'onglet
      - syntaxe de script
      - alias
      - citation avancée

      Ce sont des couches plus tard.

      ## Loop Shell de base

      La boucle du noyau est simple dans le concept:

      ```txt
      while shell is running:
          display prompt
          read line
          parse line into arguments
          check if command is built-in
          if built-in, run inside shell
          else fork child process
          child executes command
          parent waits
      ```

      Cette boucle est au cœur du programme.

      Le défi n'est pas d'écrire la boucle une fois. Le défi est de gérer tous les cas bizarres autour de lui.

      ## Entrée de lecture

      Un shell doit lire des lignes complètes à partir de l'entrée standard.

      L'utilisation de `getline` est pratique car elle peut gérer l'entrée de longueur variable.

      La coque doit gérer:

      - Entrée normale
      - lignes vides
      - fin de fichier
      - entrée non interactive
      - défaillance de l'allocation mémoire

      Exemple de comportement :

      ```txt
      $ ls
      $
      $ exit
      ```

      Si l'utilisateur appuie sur Ctrl+D, le shell devrait sortir proprement plutôt que s'écraser.

      ## Parsing Commands

      Entrée comme & #160;:

      ```bash
      ls -la /tmp
      ```

      doit devenir un vecteur d'arguments:

      ```txt
      argv[0] = "ls"
      argv[1] = "-la"
      argv[2] = "/tmp"
      argv[3] = NULL
      ```

      Le `NULL` final compte parce que `execve` attend un tableau d'arguments null-terminé.

      Un tokenizer simple peut se diviser sur les espaces et les onglets.

      L'analyse plus avancée supporte les citations et l'évasion, mais un shell minimal peut commencer par des règles plus simples.

      ## Exécution des commandes

      Si la commande contient un chemin :

      ```bash
      /bin/ls
      ```

      le shell peut essayer de l'exécuter directement.

      Si la commande ne contient pas de slash :

      ```bash
      ls
      ```

      le shell doit chercher dans PATH.

      Cela signifie :

      ```txt
      read PATH environment variable
      split PATH by :
      join each directory with command name
      check if executable exists
      run the first match
      ```

      Exemple :

      ```txt
      /usr/local/bin
      /usr/bin
      /bin
      ```

      La coque vérifie :

      ```txt
      /usr/local/bin/ls
      /usr/bin/ls
      /bin/ls
      ```

      jusqu'à ce qu'il trouve un exécutable valide.

      ## Fourche, Exec, attendez

      Le modèle de processus de base Unix est:

      ```txt
      fork creates a child process
      exec replaces the child process image with the target program
      wait lets the parent wait for the child to finish
      ```

      Le shell parent ne devrait pas devenir la commande.

      Au lieu de :

      ```txt
      parent shell
        ↓ fork
      child process
        ↓ execve("/bin/ls", argv, envp)
      parent shell
        ↓ wait
      prompt returns
      ```

      C'est pourquoi `exec` est habituellement appelé dans le processus de l'enfant, pas le parent.

      Si le parent appelle directement `exec`, le shell disparaît et devient la commande.

      ## Commandes intégrées

      Certaines commandes ne peuvent pas être gérées en exécutant simplement un autre exécutable.

      Exemples:

      ```txt
      cd
      exit
      env
      ```

      `cd` doit changer le répertoire de travail du processus shell lui-même.

      Si `cd` fonctionne uniquement à l'intérieur d'un processus enfant, l'enfant change de répertoire et sort, mais le shell parent reste dans l'ancien répertoire.

      C'est pourquoi les éléments intégrés sont manipulés avant `fork`.

      Un débit minimal intégré:

      ```txt
      if command is "exit":
          clean up and quit

      if command is "cd":
          call chdir in parent shell

      if command is "env":
          print environment variables
      ```

      ## Résolution PATH

      La résolution PATH est l'un des premiers bugs apparaissent.

      La coque doit être manipulée:

      - PATH manquant
      - Entrées PATH vides
      - commande avec chemin absolu
      - commande avec chemin relatif
      - exécutable existe mais la permission est refusée
      - commande non trouvée
      - répertoires confondus avec les commandes

      Un shell fiable ne devrait pas supposer que chaque commande vit dans `/bin`.

      Il devrait utiliser l'environnement.

      ## Gestion de l'environnement

      Un shell transmet les variables d'environnement aux processus enfant.

      Par exemple, les commandes dépendent souvent de :

      ```txt
      PATH
      HOME
      USER
      PWD
      SHELL
      ```

      Un shell minimal peut utiliser l'environnement hérité et le transmettre à `execve`.

      Si le shell prend en charge la modification des variables d'environnement plus tard, cela devient une fonctionnalité plus grande.

      Au minimum, le shell doit comprendre que l'environnement fait partie de l'exécution de commande.

      ## Gestion des erreurs

      Les erreurs doivent être claires et cohérentes.

      Erreurs courantes & #160;:

      ```txt
      command not found
      permission denied
      no such file or directory
      fork failed
      malloc failed
      execve failed
      ```

      Un mauvais obus s'écrase dessus.

      Un meilleur shell signale l'erreur et retourne à l'invite si possible.

      Exemple de comportement :

      ```txt
      $ unknowncmd
      unknowncmd: not found
      $
      ```

      L'obus devrait rester en vie après un échec à moins que l'échec ne soit fatal.

      ## État de sortie

      Les vrais obus suivent l'état de sortie.

      Une version minimale peut commencer en attendant le processus de l'enfant et en lisant son statut.

      Cas utiles:

      - la commande sort normalement
      - sorties de commande avec statut non-zéro
      - le commandement est tué par un signal
      - `execve` échoue

      Même si le shell n'expose pas `$?`, comprendre l'état de sortie est important.

      ## Gestion de la mémoire

      C fait de la gestion de la mémoire une partie du projet.

      Le shell peut attribuer la mémoire pour:

      - ligne d'entrée
      - tableau token
      - chaînes copiées
      - Répertoires PATH
      - chemin de commande complet
      - tampons temporaires

      Chaque allocation a besoin d'un chemin de nettoyage.

      Un bug shell commun fuit la mémoire à chaque boucle.

      Une règle plus sûre :

      ```txt
      allocate for one command
      execute command
      free command resources
      return to prompt
      ```

      Les shells à long terme rendent les fuites visibles parce que le processus ne sort pas après chaque commande.

      ## Mode interactif et mode non interactif

      Un shell peut fonctionner de manière interactive :

      ```txt
      ./shell
      $ ls
      $ exit
      ```

      ou non interactifs:

      ```bash
      echo "ls" | ./shell
      ```

      Le mode interactif affiche habituellement une invite.

      Le mode non-interactif ne devrait souvent pas être rapide, selon les besoins.

      Cette distinction est importante pour les tests.

      ## Liste de vérification

      ### Entrée de base

      - ligne vide
      - espaces réservés
      - une commande
      - commande avec arguments
      - Ctrl+D
      - `exit`

      ### Exécution des commandes

      - `/bin/ls`
      - `ls`
      - `pwd`
      - commande invalide
      - commande avec chemin relatif
      - commande sans autorisation d'exécution

      ### Gestion du PATH

      - PATH normal
      - PATH manquant
      - PATH vide
      - commande dans `/bin`
      - commande dans `/usr/bin`
      - répertoire invalide dans PATH

      ### Éléments intégrés

      - `exit`
      - `env`
      - `cd`
      - `cd` sans argument si supporté
      - cible `cd` non valide

      ### Gestion des erreurs

      - direction de défaillance du malloc
      - direction de rupture de fourche
      - défaillance exec
      - autorisation refusée
      - fichier non trouvé
      - répertoire passé comme commande

      ### Mémoire

      - commandes répétées
      - longue session
      - Valgrind vérifier si disponible
      - nettoyage après erreurs
      - nettoyage avant sortie

      ## Bogues courantes

      ### Shell disparaît après avoir exécuté la commande

      Cause:

      ```txt
      exec was called in parent instead of child
      ```

      Correction :

      ```txt
      fork first, exec only in child
      ```

      ### `cd` ne fonctionne pas

      Cause:

      ```txt
      cd was executed in a child process
      ```

      Correction :

      ```txt
      handle cd as a built-in in the parent shell
      ```

      ### Commande fonctionne avec `/bin/ls` mais pas `ls`

      Cause:

      ```txt
      PATH lookup not implemented
      ```

      Correction :

      ```txt
      search directories listed in PATH
      ```

      ### Défaut de segmentation sur entrée vide

      Cause:

      ```txt
      parser assumes argv[0] exists
      ```

      Correction :

      ```txt
      check for empty command before execution
      ```

      ### La mémoire grandit pour toujours

      Cause:

      ```txt
      allocated command data not freed after each loop
      ```

      Correction :

      ```txt
      free line/token/path buffers consistently
      ```

      ### Message d'erreur incorrect

      Cause:

      ```txt
      all failures are treated as command not found
      ```

      Correction :

      ```txt
      distinguish not found, permission denied, and execution failure
      ```

      ## Décisions pratiques

      ### Commencez par un petit ensemble de fonctionnalités

      Un shell minimal devrait exécuter les commandes de manière fiable avant d'ajouter des pipes, des redirections ou de l'historique.

      ### Poignée intégrée séparément

      Des commandes comme `cd` et `exit` appartiennent au processus shell lui-même.

      ### Traiter la recherche PATH comme une véritable fonctionnalité

      La plupart des commandes types utilisateurs ne sont pas des chemins absolus.

      ### Continuez à analyser en premier

      L'analyse basique de l'espace blanc suffit pour une première version.

      ### Vérifier chaque allocation

      En C, le défaut d'attribution doit être pris en considération.

      ### Mémoire gratuite par commande

      Une coquille est de longue durée, de petites fuites se répètent pour toujours.

      ### Préférez des erreurs claires

      Une petite coquille devrait encore expliquer ce qui a échoué.

      ## Ce qu'une version terminée devrait montrer

      Un shell minimal fortement fini devrait montrer:

      - prompt interactif
      - commande boucle de lecture
      - analyse des arguments
      - exécution directe du chemin
      - Recherche PATH
      - `fork` / `execve` / `wait`
      - `exit` intégré
      - `env` intégré
      - `cd` intégré si implémenté
      - Gestion propre des erreurs
      - nettoyage de la mémoire
      - support d'entrée non interactif
      - README avec des exemples
      - essais ou cas d'essais documentés

      ## Preuves à retenir

      Voici quelques éléments de preuve utiles à cette note :

      - shell prompt screenshot
      - exécutant `/bin/ls`
      - exécuter `ls` à travers la recherche PATH
      - sortie de commande invalide
      - comportement `cd`
      - Essai non interactif
      - arbre source
      - extrait de code de boucle principal
      - Extrait de code de recherche PATH
      - Sortie Valgrind si disponible
      - Section d'utilisation du README

      ## Hypothèses techniques

      Cette note suppose un environnement semblable à Linux/POSIX.

      Il suppose que le shell est écrit en C et se concentre sur les fondamentaux, pas la pleine compatibilité Bash.

      Il suppose également que le projet vise à démontrer la gestion des processus et la discipline de programmation de bas niveau.

      ## Principaux risques

      - appelant `exec` dans le processus parent
      - ne pas gérer l'entrée vide
      - `argv` n'a pas de valeur nulle
      - fuites de mémoire dans la boucle de commande
      - Mauvaise manipulation du PATH
      - confusion entre les intégrations et les commandes externes
      - mauvais environnement passé à l'enfant processus
      - ignorant les erreurs de fork/exec
      - s'écraser sur Ctrl+D
      - essayant d'implémenter des fonctionnalités shell avancées trop tôt

      ## État actuel

      Cette note représente un projet de programmation de systèmes axé sur la compréhension du fonctionnement interne des shells Unix.

      Il n'est pas aussi orienté vers l'entreprise que l'ERP, le VPN ou l'outil de déploiement, mais il ajoute une couche inférieure utile au portefeuille.

      Il montre que la base technique n'est pas seulement les applications web et la configuration du serveur, mais aussi le comportement Linux au niveau du processus.

      ## Ce que la présente note ne prétend pas

      La présente note ne prétend pas remplacer Bash, Zsh, Fish ou d'autres coquilles réelles.

      Il ne prétend pas supporter la syntaxe complète du shell.

      Il ne prétend pas inclure toutes les fonctionnalités avancées comme les pipes, la redirection, les tâches, les signaux, les alias ou les scripts.

      Il documente un shell minimal C utilisé pour comprendre la mécanique de processus de base Unix.

      ## À emporter pratique

      La leçon utile est:

      > Un shell est une boucle qui transforme le texte en processus.

      Pour construire même un petit, vous devez comprendre:

      - lecture des entrées
      - analyse des jetons
      - vecteurs d'arguments
      - Recherche PATH
      - processus pour enfants
      - remplacement exécutable
      - Attendre
      - intégrés
      - erreurs
      - nettoyage de la mémoire

      Cela fait du projet un élément fondamental important lorsqu'il est conçu comme une programmation de systèmes, et non comme un exercice de formation générique.
seoTitle: "Building a Minimal Unix Shell in C"
seoDescription: "A practical note about building a minimal Unix-like shell in C, covering command parsing, fork/exec/wait, PATH resolution, environment variables, memory management, and Linux process fundamentals."
---

## Why This Note Exists

This note documents the process of building a minimal Unix-like shell in C.

The project is valuable because a shell sits close to the operating system. Even a small version forces you to understand how Linux starts programs, passes arguments, handles environment variables, waits for child processes, and reports failures.

The goal was not to replace Bash or Zsh.

The goal was to understand the lower-level mechanics behind a command like:

```bash
ls -la
```

A normal user sees a command. A shell needs to:

```txt
read input
split arguments
find the executable
create a child process
run the command
wait for it
return to the prompt
```

That makes it a useful systems-programming note.

## Project Context

The shell was built in C as a fundamentals project focused on Linux process behavior.

It belongs in a portfolio as a lower-level technical note, not as a business/client project.

The value is in showing understanding of:

- C programming
- Unix process creation
- command parsing
- executable lookup
- environment variables
- error handling
- memory allocation
- edge cases
- simple interactive programs

This project is different from infrastructure notes like WireGuard, OpenWrt, or game-server hosting. It shows the operating-system side of the stack.

## What This Project Is Meant To Prove

- a shell is a process manager, not just a text prompt
- Linux command execution depends on `fork`, `exec`, and `wait`
- arguments must be parsed before execution
- commands without `/` need PATH resolution
- built-in commands must be handled by the shell itself
- memory must be allocated and freed carefully
- error messages should be predictable
- small C programs require discipline because there is no runtime safety net

## Stack and Tools Used

### Language and Runtime

- C
- Linux
- POSIX-style system calls
- GCC
- standard C library

### System Calls and Functions

- `fork`
- `execve`
- `wait` / `waitpid`
- `getline`
- `malloc`
- `free`
- `strtok` or manual tokenization
- `access`
- `stat`
- environment variable handling

### Shell Concepts

- prompt loop
- command parsing
- argument vector
- PATH lookup
- child process execution
- built-in commands
- exit status
- error handling

## Intended Build

The intended build is a minimal shell that can:

- display a prompt
- read user input
- parse a command into arguments
- execute binaries
- search through PATH
- handle command errors
- support basic built-ins
- exit cleanly
- avoid obvious memory leaks
- work in interactive and non-interactive modes

A minimal shell does not need advanced features at first.

It does not need to support:

- pipes
- redirection
- job control
- command history
- tab completion
- scripting syntax
- aliases
- advanced quoting

Those are later layers.

## Basic Shell Loop

The core shell loop is simple in concept:

```txt
while shell is running:
    display prompt
    read line
    parse line into arguments
    check if command is built-in
    if built-in, run inside shell
    else fork child process
    child executes command
    parent waits
```

This loop is the heart of the program.

The challenge is not writing the loop once. The challenge is handling all the weird cases around it.

## Reading Input

A shell needs to read complete lines from standard input.

Using `getline` is practical because it can handle variable-length input.

The shell should handle:

- normal input
- empty lines
- end-of-file
- non-interactive input
- memory allocation failure

Example behavior:

```txt
$ ls
$ 
$ exit
```

If the user presses Ctrl+D, the shell should exit cleanly rather than crash.

## Parsing Commands

Input like:

```bash
ls -la /tmp
```

needs to become an argument vector:

```txt
argv[0] = "ls"
argv[1] = "-la"
argv[2] = "/tmp"
argv[3] = NULL
```

The final `NULL` matters because `execve` expects a null-terminated argument array.

A simple tokenizer can split on spaces and tabs.

More advanced parsing would support quotes and escaping, but a minimal shell can start with simpler rules.

## Executing Commands

If the command contains a path:

```bash
/bin/ls
```

the shell can try to execute it directly.

If the command does not contain a slash:

```bash
ls
```

the shell needs to search through PATH.

That means:

```txt
read PATH environment variable
split PATH by :
join each directory with command name
check if executable exists
run the first match
```

Example:

```txt
/usr/local/bin
/usr/bin
/bin
```

The shell checks:

```txt
/usr/local/bin/ls
/usr/bin/ls
/bin/ls
```

until it finds a valid executable.

## Fork, Exec, Wait

The core Unix process model is:

```txt
fork creates a child process
exec replaces the child process image with the target program
wait lets the parent wait for the child to finish
```

The parent shell should not become the command.

Instead:

```txt
parent shell
  ↓ fork
child process
  ↓ execve("/bin/ls", argv, envp)
parent shell
  ↓ wait
prompt returns
```

This is why `exec` is usually called in the child process, not the parent.

If the parent calls `exec` directly, the shell disappears and becomes the command.

## Built-in Commands

Some commands cannot be handled by simply running another executable.

Examples:

```txt
cd
exit
env
```

`cd` must change the working directory of the shell process itself.

If `cd` runs only inside a child process, the child changes directory and exits, but the parent shell remains in the old directory.

That is why built-ins are handled before `fork`.

A minimal built-in flow:

```txt
if command is "exit":
    clean up and quit

if command is "cd":
    call chdir in parent shell

if command is "env":
    print environment variables
```

## PATH Resolution

PATH resolution is one of the first places bugs appear.

The shell needs to handle:

- missing PATH
- empty PATH entries
- command with absolute path
- command with relative path
- executable exists but permission denied
- command not found
- directories mistaken for commands

A reliable shell should not assume every command lives in `/bin`.

It should use the environment.

## Environment Handling

A shell passes environment variables to child processes.

For example, commands often depend on:

```txt
PATH
HOME
USER
PWD
SHELL
```

A minimal shell may use the inherited environment and pass it to `execve`.

If the shell supports modifying environment variables later, that becomes a bigger feature.

At minimum, the shell should understand that the environment is part of command execution.

## Error Handling

Errors should be clear and consistent.

Common errors:

```txt
command not found
permission denied
no such file or directory
fork failed
malloc failed
execve failed
```

A bad shell crashes on these.

A better shell reports the error and returns to the prompt when possible.

Example behavior:

```txt
$ unknowncmd
unknowncmd: not found
$
```

The shell should stay alive after a failed command unless the failure is fatal.

## Exit Status

Real shells track exit status.

A minimal version can start by waiting for the child process and reading its status.

Useful cases:

- command exits normally
- command exits with non-zero status
- command is killed by signal
- `execve` fails

Even if the shell does not expose `$?`, understanding exit status is important.

## Memory Management

C makes memory management part of the project.

The shell may allocate memory for:

- input line
- token array
- copied strings
- PATH directories
- full command path
- temporary buffers

Every allocation needs a cleanup path.

A common shell bug is leaking memory every loop.

A safer rule:

```txt
allocate for one command
execute command
free command resources
return to prompt
```

Long-running shells make leaks visible because the process does not exit after each command.

## Interactive vs Non-Interactive Mode

A shell can run interactively:

```txt
./shell
$ ls
$ exit
```

or non-interactively:

```bash
echo "ls" | ./shell
```

Interactive mode usually shows a prompt.

Non-interactive mode often should not show a prompt, depending on requirements.

This distinction matters for testing.

## Testing Checklist

### Basic Input

- empty line
- spaces only
- one command
- command with arguments
- Ctrl+D
- `exit`

### Command Execution

- `/bin/ls`
- `ls`
- `pwd`
- invalid command
- command with relative path
- command without execute permission

### PATH Handling

- normal PATH
- missing PATH
- empty PATH
- command in `/bin`
- command in `/usr/bin`
- invalid directory in PATH

### Built-ins

- `exit`
- `env`
- `cd`
- `cd` with no argument if supported
- invalid `cd` target

### Error Handling

- malloc failure direction
- fork failure direction
- exec failure
- permission denied
- file not found
- directory passed as command

### Memory

- repeated commands
- long session
- Valgrind check if available
- cleanup after errors
- cleanup before exit

## Common Bugs

### Shell Disappears After Running Command

Cause:

```txt
exec was called in parent instead of child
```

Fix:

```txt
fork first, exec only in child
```

### `cd` Does Not Work

Cause:

```txt
cd was executed in a child process
```

Fix:

```txt
handle cd as a built-in in the parent shell
```

### Command Works With `/bin/ls` But Not `ls`

Cause:

```txt
PATH lookup not implemented
```

Fix:

```txt
search directories listed in PATH
```

### Segmentation Fault On Empty Input

Cause:

```txt
parser assumes argv[0] exists
```

Fix:

```txt
check for empty command before execution
```

### Memory Grows Forever

Cause:

```txt
allocated command data not freed after each loop
```

Fix:

```txt
free line/token/path buffers consistently
```

### Wrong Error Message

Cause:

```txt
all failures are treated as command not found
```

Fix:

```txt
distinguish not found, permission denied, and execution failure
```

## Practical Decisions

### Start with a small feature set

A minimal shell should execute commands reliably before adding pipes, redirects, or history.

### Handle built-ins separately

Commands like `cd` and `exit` belong to the shell process itself.

### Treat PATH lookup as a real feature

Most commands users type are not absolute paths.

### Keep parsing simple first

Basic whitespace parsing is enough for a first version.

### Check every allocation

In C, allocation failure must be considered.

### Free per-command memory

A shell is long-running. Small leaks repeat forever.

### Prefer clear errors

A small shell should still explain what failed.

## What A Finished Version Should Show

A strong finished minimal shell should show:

- interactive prompt
- command reading loop
- argument parsing
- direct path execution
- PATH lookup
- `fork` / `execve` / `wait`
- built-in `exit`
- built-in `env`
- built-in `cd` if implemented
- clean error handling
- memory cleanup
- non-interactive input support
- README with examples
- tests or documented test cases

## Evidence Worth Capturing

Useful evidence for this note would include:

- shell prompt screenshot
- running `/bin/ls`
- running `ls` through PATH lookup
- invalid command output
- `cd` behavior
- non-interactive test
- source tree
- main loop code excerpt
- PATH lookup code excerpt
- Valgrind output if available
- README usage section

## Technical Assumptions

This note assumes a Linux/POSIX-like environment.

It assumes the shell is written in C and focuses on fundamentals, not full Bash compatibility.

It also assumes the project is meant to demonstrate process handling and low-level programming discipline.

## Key Risks

- calling `exec` in the parent process
- not handling empty input
- not null-terminating `argv`
- memory leaks in the command loop
- poor PATH handling
- confusing built-ins with external commands
- wrong environment passed to child process
- ignoring fork/exec errors
- crashing on Ctrl+D
- trying to implement advanced shell features too early

## Current State

This note represents a systems-programming project focused on understanding how Unix shells work internally.

It is not as business-facing as ERP, VPN, or deployment tooling, but it adds a useful lower-level layer to the portfolio.

It shows that the technical foundation is not only web apps and server configuration, but also process-level Linux behavior.

## What This Note Does Not Claim

This note does not claim to replace Bash, Zsh, Fish, or other real shells.

It does not claim to support full shell syntax.

It does not claim to include every advanced feature like pipes, redirection, jobs, signals, aliases, or scripting.

It documents a minimal C shell used to understand core Unix process mechanics.

## Practical Takeaway

The useful lesson is:

> A shell is a loop that turns text into processes.

To build even a small one, you need to understand:

- input reading
- token parsing
- argument vectors
- PATH lookup
- child processes
- executable replacement
- waiting
- built-ins
- errors
- memory cleanup

That makes the project a strong fundamentals note when framed as systems programming, not as a generic training exercise.
