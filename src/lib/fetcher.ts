export async function fetcher<T = any>(
  input: RequestInfo,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(input, { ...init, cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Fetch error: ${res.status}`);
  }
  return res.json() as Promise<T>;
}
