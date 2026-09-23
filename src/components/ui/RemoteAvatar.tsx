/**
 * A user avatar loaded from an arbitrary remote URL.
 *
 * Deliberately a plain <img> rather than next/image. The source is either an
 * OAuth provider's CDN or a URL the user typed into settings, so there is no
 * finite host list to put in images.remotePatterns -- covering it would mean
 * wildcarding every hostname, which turns the image optimiser into an open
 * proxy that anyone can point at any URL, at our bandwidth cost. Serving these
 * directly is the safer trade, so the rule is disabled here, once, instead of
 * being worked around at six call sites.
 *
 * referrerPolicy keeps our URLs out of the request to whatever host the user
 * named, which would otherwise hand a third party the board pages a viewer is
 * looking at.
 */
interface RemoteAvatarProps {
    src: string;
    alt: string;
    className?: string;
    width?: number;
    height?: number;
    style?: React.CSSProperties;
    onError?: () => void;
}

export function RemoteAvatar({ src, alt, className, width, height, style, onError }: RemoteAvatarProps) {
    return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
            src={src}
            alt={alt}
            width={width}
            height={height}
            className={className}
            style={style}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            onError={onError}
        />
    );
}
