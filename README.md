# Spotteur - Open-source visual regression testing.

Detect UI changes by comparing screenshots across builds.

## What is Spotteur?

Spotteur (pronounced "spot-ter") comes from "spot" + the "-eur", meaning one who does something. Naturally, Spotteur spots visual changes by comparing screenshots across builds.

## Why Spotteur?

Modern UI changes are fast, frequent and subtle. Visual regressions can slip through code reviews, manual and automated tests, only to be discovered by users later.

Spotteur exists to make visual changes visible and protect UI from unintended regressions.

Spotteur automatically comparing screenshots across builds, Spotteur helps teams spot unintended UI changes early, before they reach production. This reduces review fatigue, increase confidence in UI changes, and creates a clear visual record of how an interface evolves over time.

Spotteur is open-source by design. It can be self-hosted, audited, and adapted to environments where SaaS solutions are not suitable.

## Features

- **Visual regression testing** by comparing screenshots across build.
- **Pixel-level diffs** to highlight unintended UI changes.
- **CI integrations** for pull requests and automated tests.
- **Open-source and self-hostable** by design.

## Getting started with cloud-based Spotteur

TODO

## Getting started with self-hosted Spotteur

TODO

## Development

### Requirements

- [Docker](https://docs.docker.com/engine/install/)
- [Taskfile](https://taskfile.dev/docs/getting-started) (for task automation)
- [VS Code Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) (recommended for development)

### Development setup

This project are using [Dev Containers](https://code.visualstudio.com/docs/devcontainers/containers) for easier development setup.

- Copy file `.env.example` to `.env` file
- Change `APP_ENV` variable value to `development`
- Configure secret for Better Auth by setting up `BETTER_AUTH_SECRET` variable, you generate one using the following command:
  ```bash
  openssl rand -base64 32
  ```
- Run `task up` to start all services
- Open the project folder in VS Code
- Open VS Code command pallete, and run **Reopen in Container**

## About Kororo

TODO
