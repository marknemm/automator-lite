/**
 * Represents either a {@link Window} or an {@link HTMLIFrameElement}.
 */
export type Frame = Window | HTMLIFrameElement;

/**
 * Represents the location of a frame in the window hierarchy.
 *
 * Either a {@link Location}, {@link URL},
 * or a href ({@link URL} convertible) string representation of the location.
 */
export type FrameLocation = Location | URL | string;
