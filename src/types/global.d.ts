// Generic for anything that can be null
type Nullable<T> = T | null;

// Anything that can be rendered in a React component
type RenderableElement = JSX.Element | string | null;
