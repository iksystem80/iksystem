export function formatDateTime(
    value: string | Date | null | undefined
): string {
    if (!value) return '---'

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
        return '---'
    }

    return new Intl.DateTimeFormat('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    }).format(date)
}