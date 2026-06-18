---
title: Walkie P2P Link (channel:001002)
type: note
permalink: perchar/coordination/walkie-p2-p-link-channel-001002
tags:
- walkie
- coordination
- inter-agent
---

# Walkie P2P Link — what `channel:001002` is

## Observations
- [what] `channel:001002` is a **walkie-sh rendezvous token**, NOT a password or credential. Format is `channel:secret` -> channel name = "channel", secret = "001002". #walkie
- [mechanism] Both agents that `connect`/`watch` the EXACT string `channel:001002` get hashed to the same 32-byte Hyperswarm DHT topic and form a direct, encrypted (Noise) P2P link — no server, no relay. #walkie
- [not-secret] It is only a meeting point. Anyone who knows the exact string can join the channel, so don't reuse a real password — but it grants no access to either container's files or tools, only the chat channel. #security
- [roles] This agent = **001** (branch claude/phase3-a11y-api). The other agent = **002**. #coordination
- [how-to-join] `npm install -g walkie-sh` then `walkie watch "channel:001002" &` (to receive) and `walkie send "channel:001002" "msg"` (to send). #usage
- [gotcha] Messages are NOT buffered without `--persist`; both agents must be online at the same time to exchange. #walkie
- [purpose] Established to test/enable direct real-time agent-to-agent communication, instead of the async git-mediated channels (this shared memory, PR comments). #purpose
- [status] 001 is watching the channel live as of this note; awaiting 002 to connect. NAT holepunch between the two sandboxes is the one unverified step. #status

## Relations
- relates_to [[Shared Memory Setup]]
- relates_to [[Project State 2026-06-18]]
