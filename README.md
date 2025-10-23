# Markdown Static Server

Serve the static files from this repository using the bundled Node.js server.

## Prerequisites

- Node.js 18+ (or any modern Node.js runtime available as `node` on `PATH`).

## Local development

Install dependencies (none besides Node itself) and run the server:

```bash
npm install # no dependencies, but creates a lockfile if desired
npm start   # serves on http://0.0.0.0:3001
```

The server will listen on `PORT` and `HOST` environment variables if provided. It defaults to port `3001` and binds to all interfaces.

While running, use the `Upload Markdown` button in the editor pane to load an existing `.md` file. The left panel displays the raw Markdown, and the preview pane renders it in real time.

## systemd service

1. Copy the provided unit file into place:
   ```bash
   sudo cp $(pwd)/systemd/markdown.service /etc/systemd/system/markdown.service
   ```
2. Adjust `User`, `Group`, and paths inside the unit if necessary (they default to `andy`). The service uses the Node binary installed via nvm at `/home/andy/.nvm/versions/node/v24.9.0/bin/node` and runs it in `--watch` mode so changes to project files trigger automatic reloads.
3. Reload systemd and start the service:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable --now markdown.service
   ```
4. Check status and logs:
   ```bash
   systemctl status markdown.service
   journalctl -u markdown.service -f
   ```

The service runs `node server.js` from this repository directory and will automatically restart on failure.
