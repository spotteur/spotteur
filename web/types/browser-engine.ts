export interface IBrowserEngine {
  enableReducedMotion(): Promise<void>
  executeScript<T>(script: string): Promise<T>
  getViewportSize(): Promise<{ width: number; height: number }>
  setViewportSize({ width, height }: { width: number; height: number }): Promise<void>
  /**
   * Hide all element matching the selector using CSS visibility property.
   */
  hideElements(selector: string): Promise<void>
  quit(): Promise<void>
  /**
   * Make all element matching the selector not be displayed using CSS display property.
   */
  removeElements(selector: string): Promise<void>
  replaceElementInnerText(selector: string, text: string): Promise<void>
  resetTimeBasedMedia(): Promise<void>
  scrollPageToBottom(): Promise<void>
  scrollPageToTop(): Promise<void>
  sleep(timeout: number): Promise<void>
  takeScreenshot(): Promise<Buffer>
  visit(url: string): Promise<void>
  waitForNetworkIdle(timeout: number): Promise<void>
  waitForPageLoad(timeout: number): Promise<void>
  waitForSelector(selector: string, timeout: number, dontThrow?: boolean): Promise<void>
}
