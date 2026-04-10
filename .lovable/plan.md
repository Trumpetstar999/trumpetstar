

## Plan: Create `llms.txt` for LLM Indexing

### Approach
Place a static `llms.txt` file in the `public/` directory. Vite serves files from `public/` at the root path, so `public/llms.txt` will be accessible at `trumpetstar.app/llms.txt` without any router changes.

### Steps
1. Create `public/llms.txt` with the provided content

That's it — one file, no code changes needed.

