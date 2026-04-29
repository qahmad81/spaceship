# Agent Guide

لغة التواصل بين الوكلاء والمستخدم: **العربية**.  
لغة التطبيق داخل اللعبة + لغة التوثيق التقنية: **English**.

## Purpose
This file is the entry point for any new agent joining the project.  
Do not start from source code first. Start from `ai_docs/` documentation.

## Documentation Index
1. `ai_docs/project-structure.md`  
   High-level folders, key files, and responsibilities.
2. `ai_docs/agent_memory.md`  
   Stable decisions, conventions, and historical context.
3. `ai_docs/current-status.md`  
   Current implementation state and known behavior.
4. `ai_docs/done_tasks.md`  
   Completed tasks log.
5. `ai_docs/pending_tasks.md`  
   Open tasks and next priorities.

## Mandatory Update Rule
After **every update** to gameplay, structure, assets usage, maps, controls, or UI:
- Update `current-status.md`
- Append to `done_tasks.md`
- Adjust `pending_tasks.md`
- If architecture changed, update `project-structure.md`
- If a durable decision was made, update `agent_memory.md`

This rule ensures any new agent can understand the project without reading code files.
