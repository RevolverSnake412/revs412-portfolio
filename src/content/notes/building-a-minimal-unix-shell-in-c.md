---
title: "Building a Minimal Unix Shell in C"
slug: "building-a-minimal-unix-shell-in-c"
summary: "Field notes from building a small Unix-like shell in C to understand process creation, command parsing, PATH lookup, environment handling, and low-level Linux behavior."
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
