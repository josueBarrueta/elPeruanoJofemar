import { Observable, retry, timeout, timer } from 'rxjs';

// A sleeping API must not leave the public page waiting indefinitely.
// Keep retrying briefly while the existing contact fallback is displayed.
export function publicMenuRequest<T>(request: Observable<T>, onRetry: () => void): Observable<T> {
  return request.pipe(
    timeout({ first: 12_000 }),
    retry({ count: 3, delay: () => {
      onRetry();
      return timer(1800);
    } })
  );
}
