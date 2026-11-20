---
name: consult
description: "Ask the whole expert team a question: picks the right experts, runs them in parallel, reconciles their views, and returns one combined answer."
argument-hint: "[question for the expert team]"
disable-model-invocation: true
---

Consult the Miami specialty coffee shop expert team on this question:

$ARGUMENTS

Run the `orchestrate-experts` procedure **here in the main conversation**: load that skill (and `expert-routing`) if they aren't already in context, then frame the question, pick the experts, spawn them in parallel with the Agent tool, run a collaboration round if needed, and return ONE combined answer in the `executive-briefing` format. Experts must actually run. Don't write their answers yourself.
