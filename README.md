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
- Configure `NOVU_SECRET_KEY` and `NOVU_APP_IDENTIFIER`. If you don't have one, you may need to create Nuvo account at https://dashboard.novu.co/auth/sign-up. Check this docs on how to get your secret keys https://docs.novu.co/platform/developer/api-keys.
- Run `task up` to start all services
- Open the project folder in VS Code
- Open VS Code command pallete (`Cmd+Shift+P` on macOS or `Ctrl+Shift+P` on Windows and Linux), then run **Reopen in Container**

## Build & Publish Docker Image

> [!TIP]
> You may change `SPOTTEUR_DOCKER_IMAGE_NAMESPACE` env variable to change the Docker image namespace. By default its set to `ghcr.io/spotteur`.

- Run `task image:build` to build the Docker image. You may specify `IMAGE_TAG` env variable to set the image tag, default to `latest`.

  ```bash
  IMAGE_TAG=latest task image:build
  ```

- Run `task image:push` to push the Docker image to registry. You may specify `IMAGE_TAG` env variable to set the image tag, default to `latest`.

  ```bash
  IMAGE_TAG=latest task image:push
  ```

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
- http://localhost:18006: Nuvo local studio, available to help test Nuvo workflows locally

## Production Setup

- Copy `taskfile.yml` and `compose.yml` file
- Copy file `.env.example` to `.env` file
- Configure secret for Better Auth by setting up `BETTER_AUTH_SECRET` variable, you generate one using the following command:
  ```bash
  openssl rand -base64 32
  ```
- Configure `NOVU_SECRET_KEY` and `NOVU_APP_IDENTIFIER`. If you don't have one, you may need to create Nuvo account at https://dashboard.novu.co/auth/sign-up. Check this docs on how to get your secret keys https://docs.novu.co/platform/developer/api-keys.
