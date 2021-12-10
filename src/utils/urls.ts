export function getDomain(urlString: string): string{
    return new URL(urlString).hostname
}

export function getOrigin(urlString: string): string{
    return new URL(urlString).origin;
}
