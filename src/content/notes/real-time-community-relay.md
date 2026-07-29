---
title: "Real-Time Community Relay"
slug: "real-time-community-relay"
summary: "Field notes from building a server-side relay that connects live service events and chat with a Discord channel."
category: "Real-Time Integrations"
tags:
  - server-side-extension
  - discord
  - relay
  - csharp
  - real-time-integration
  - server-events
  - integration
date: "2026-07-08"
updated: "2026-07-25"
featured: true
published: true
seoTitle: "Real-Time Community Relay"
seoDescription: "A practical note about building a server-side relay for live chat, Discord messages, service events, configuration, and testing."
---

## Why This Note Exists

This note documents a custom server-side Discord relay integration.

The goal was to connect the hosted service with a Discord text channel so the community could see what was happening in-application without being connected to the server all the time.

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

### Discord Layer

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

### hosted service to Discord

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

### Discord to hosted service

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

## Discord Channel Filtering

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

## Discord to service Risks

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

## service to Discord Risks

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

### service to Discord

- send normal hosted service chat
- verify Discord receives the message
- verify username appears correctly
- test symbols and punctuation
- test long messages
- test empty/invalid messages
- test multiple users chatting
- test join/leave events if enabled

### Discord to service

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
