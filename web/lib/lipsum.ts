const STATIC_LOREM_IPSUM_TEXT =
  'Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident sunt in culpa qui officia deserunt mollit anim id est laborum.'

export function getLoremIpsumWords(n: number): string {
  const words = STATIC_LOREM_IPSUM_TEXT.split(' ')
  if (n <= words.length) {
    return words.slice(0, n).join(' ')
  }

  const repeatedWords = []
  while (repeatedWords.length < n) {
    repeatedWords.push(...words)
  }
  return repeatedWords.slice(0, n).join(' ')
}
