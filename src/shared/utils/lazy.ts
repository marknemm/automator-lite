import { injectStyles } from './mount.js';

export async function lazyLoadCss(
  pathname: string,
  injectNode?: Node
): Promise<string> {
  const extPathname = chrome.runtime.getURL(pathname);
  const response = await fetch(extPathname);
  const css = await response.text();
  if (injectNode && css) {
    injectStyles(injectNode, css);
  }
  return css;
}

export async function lazyLoadJs<T = unknown>(
  pathname: string
): Promise<T> {
  const extPathname = chrome.runtime.getURL(pathname);
  return import(extPathname);
}

export async function lazyLoadLib<T = unknown>(
  pathname: string,
  injectNode?: Node
): Promise<[T, string]> {
  const css = await lazyLoadCss(`${pathname}.css`, injectNode);
  const module = await lazyLoadJs(`${pathname}.js`) as T;
  return [module, css];
}
