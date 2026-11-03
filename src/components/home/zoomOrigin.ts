/** Remembers the rect of the tapped homescreen icon so the module can zoom out of it. */
let origin: DOMRect | null = null;

export function setZoomOrigin(rect: DOMRect | null) {
  origin = rect;
}

export function takeZoomOrigin(): DOMRect | null {
  const r = origin;
  origin = null;
  return r;
}
