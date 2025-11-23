// UUID generator with fallback for browsers without crypto.randomUUID
export function generateUUID(): string {
    if (typeof crypto !== "undefined" && (crypto as any).randomUUID) {
        return (crypto as any).randomUUID();
    }
    // Fallback UUID generator (RFC4122 v4 style)
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}
