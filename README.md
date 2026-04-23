# Spotteur

The visual regression tools.

## Requirements

- [Docker](https://docs.docker.com/engine/install/)
- [Taskfile](https://taskfile.dev/docs/getting-started) (for task automation)
- [VS Code Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) (recommended for development)

## Development Setup

This project is using [Dev Containers](https://code.visualstudio.com/docs/devcontainers/containers) for easier development setup.

Initial setup:

- Copy file `.env.example` to `.env` file
- Change `APP_ENV` variable value to `development`
- Configure secret for Better Auth by setting up `BETTER_AUTH_SECRET` variable, you generate one using the following command:
  ```bash
  openssl rand -base64 32
  ```
- Configure `NOVU_SECRET_KEY` and `NOVU_APP_IDENTIFIER`. If you don't have one, you may need to create Novu account at https://dashboard.novu.co/auth/sign-up. Check this docs on how to get your secret keys https://docs.novu.co/platform/developer/api-keys.
- (Optional) Run `docker compose up --build` to start the dependencies first.
- If you have the `devcontainer` CLI tool installed, simply run `devcontainer build && devcontainer up` and wait for the services to come online.
- Open the project directory in your IDE (preferably VSCode or Jetbrains).
- When using VSCode, open the command pallete (`Cmd+Shift+P` on macOS or `Ctrl+Shift+P` on Windows and Linux), and then select "Reopen in Container" or "Rebuild and Reopen in Container" if `devcontainer` CLI is not being used.
- When using Jetbrains https://www.jetbrains.com/help/webstorm/start-dev-container-inside-ide.html

The initial setup might take longer (up to 30 minutes when setting up from scratch). After the setup is done, follow these steps to run the project within the Dev Container:

- Connect to the Dev Container's terminal. You can use the IDE's integrated terminal if supported.
- Within the terminal, run `cd web` and run `npm run db:migrate` to perform database migration.
- Run `npm run dev` to run the NextJS web app.
- Open another Dev Container terminal and run `cd web` and then `npm run worker:dev` to run the Temporal worker.

Upon opening this project in Dev Container again after the initial setup is done, it should automatically start all the necessary stack via Docker Compose. Repeat the local run steps above to continue development and testing locally.

## Build & Publish Docker Image

This is performed automatically via GitHub Actions.

### Troubleshooting

- Next.js Error `Module not found: Can't resolve ...`:
  - Make sure there are no `node_modules` folder in the host machine.
  - Try to rebuild the container without cache if the issue persist
- Selenium error `Pull appears to have succeeded, but image not present locally: ...`:
  - Please try to pull the image manually, most likely this happens because your platform are not supported. You may try to pull it manualy like this `docker pull --platform linux/amd64 selenium/standalone-chrome:4.39.0-20251202`

### Available Services

- http://localhost:18000: Web App
- http://localhost:18001: Temporal UI, availbale to help manage and monitor Temporal
- http://localhost:18003: RustFS console, available to help manage S3-compatible storage
- http://localhost:18004: InBucket, available to help view email for testing
- http://localhost:18005: React Email, available to help design email components
- http://localhost:18006: Novu local studio, available to help test Novu workflows locally

## Production Setup

- Copy `taskfile.yml` and `compose.yml` file
- Copy file `.env.example` to `.env` file
- Configure secret for Better Auth by setting up `BETTER_AUTH_SECRET` variable, you generate one using the following command:
  ```bash
  openssl rand -base64 32
  ```
- Configure `NOVU_SECRET_KEY` and `NOVU_APP_IDENTIFIER`. If you don't have one, you may need to create Novu account at https://dashboard.novu.co/auth/sign-up. Check this docs on how to get your secret keys https://docs.novu.co/platform/developer/api-keys.
