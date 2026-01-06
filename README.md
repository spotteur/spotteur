# Spotteur

The visual regression tools.

## Requirements

- [Docker](https://docs.docker.com/engine/install/)
- [Taskfile](https://taskfile.dev/docs/getting-started) (for task automation)
- [VS Code Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) (recommended for development)

## Development Setup

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
