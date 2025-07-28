import {type ClassValue, clsx} from "clsx"
import {twMerge} from "tailwind-merge"

/**
 * Combines class names using clsx and tailwind-merge
 * This utility merges Tailwind CSS classes intelligently,
 * removing conflicts and duplicates
 */
export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}