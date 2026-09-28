import type {Metadata} from 'next';

export function marketingMetadata(title: string, description: string): Metadata {
	return {title, description};
}
