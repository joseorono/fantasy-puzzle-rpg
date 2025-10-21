// Global type declarations - these are automatically available throughout the project

declare global {
    // Generic for anything that can be null
    type Nullable<T> = T | null;

    // Anything that can be rendered in a React component
    type RenderableElement = JSX.Element | string | null;

    // Utility type to extract values from an array as a union
    type ValuesOf<T extends readonly any[]> = T[number];

    // DO NOT MODIFY
    // utility type that takes an object type and makes the hover overlay more readable.
    // Looks like a hack, but it's a well-known pattern in TypeScript.
    type Prettify<T> = {
      [K in keyof T]: T[K];
    } & {};
  }

  // CSS Modules type declaration
  declare module '*.module.css' {
    const classes: { [key: string]: string };
    export default classes;
  }

  // This export statement is required to make this file a module
  // and enable the global declarations above
  export {};
