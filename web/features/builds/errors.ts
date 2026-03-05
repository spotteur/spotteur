export class PendingBuildAlreadyExistError extends Error {
  constructor() {
    super('Pending build still exists!')
    this.name = 'PendingBuildAlreadyExistError'
  }
}
