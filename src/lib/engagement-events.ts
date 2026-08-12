// Tiny pub/sub so ContentFeedback (deep in page trees) and GrowthPrompt (mounted
// once in Layout) can communicate without a shared ancestor or Context provider.
const EVENT_NAME = 'engagement:helpful';

export function emitContentHelpful(contentId: string) {
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { contentId } }));
}

export function onContentHelpful(callback: (contentId: string) => void) {
  const handler = (e: Event) => callback((e as CustomEvent<{ contentId: string }>).detail.contentId);
  window.addEventListener(EVENT_NAME, handler);
  return () => window.removeEventListener(EVENT_NAME, handler);
}