// 🌐 process-browser polyfill
//
// In some runtimes like React Server Components or edge environments,
// the Node.js "process" global may be undefined. Certain legacy modules
// in our codebase (and third-party dependencies) still expect
// "process.env" to exist. We create a minimal polyfill so that any
// reference to process.env will not throw.

// NOTE: We purposefully keep the object minimal. Only "env" is provided
// and it is an empty object by default. During Next.js compilation
// values for environment variables prefixed with NEXT_PUBLIC_ will be
// inlined, so we do not attempt to mirror that behaviour here – the
// goal is simply to prevent runtime crashes.

if (typeof process === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore – We are intentionally adding a global variable.
  globalThis.process = { env: {} } as any;
}

export {};
