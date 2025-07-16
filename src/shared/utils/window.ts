export function getTopWindow(): Window {
  return isSameOrigin(window.top)
    ? window.top!
    : window;
}

export function isSameOrigin(iFrame: Window | HTMLIFrameElement | null): boolean {
  try {
    return !!(iFrame instanceof HTMLIFrameElement ? iFrame.contentDocument : iFrame?.document);
  } catch {
    return false;
  }
}
