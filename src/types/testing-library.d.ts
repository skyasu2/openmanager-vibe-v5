// Temporary type declarations for @testing-library/react
declare module '@testing-library/react' {
  export * from '@testing-library/react/dist/index';
  
  export const fireEvent: any;
  export const screen: any;
  export const waitFor: (callback: () => void | Promise<void>) => Promise<void>;
}