/**
 * Validates a capacity input string entered by the user.
 *
 * @param value Raw input value.
 * @returns Validation error message, or `null` when value is valid.
 */
export function validateCapacityInput(value: string): string | null {
    const trimmed = value.trim();

    if (trimmed === "") {
        return null;
    }

    const num = Number(trimmed);
    if (isNaN(num)) {
        return "Value should be a number";
    }

    if (num < 0) {
        return "Value can't be negative";
    }

    return null;
}

/**
 * Parses a capacity input string into a safe numeric value.
 *
 * @param value Raw input value.
 * @returns Parsed non-negative number. Returns `0` for invalid/empty input.
 */
export function parseCapacityValue(value: string): number {
    const trimmed = value.trim();
    if (trimmed === "") return 0;

    const num = Number(trimmed);
    if (isNaN(num) || num < 0) return 0;

    return num;
}
