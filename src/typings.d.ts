declare module '*.svg' {
  const content: string;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.css' {
  const content: string;
  export default content;
}

declare const acquireVsCodeApi: () => {
  postMessage(message: unknown): void;
  setState(state: unknown): void;
  getState(): unknown;
};