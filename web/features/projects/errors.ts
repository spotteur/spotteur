export class ProjectNotFoundError extends Error {
  constructor() {
    super('Project not found')
    this.name = 'ProjectNotFoundError'
  }
}

export class InvalidProjectTokenError extends Error {
  constructor() {
    super('Invalid project token')
    this.name = 'InvalidProjectTokenError'
  }
}
