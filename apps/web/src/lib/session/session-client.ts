import {ActivityEvent} from '@/types/auth/session';

type AddActivity = (activity: ActivityEvent) => void;

function record(addActivity: AddActivity, type: ActivityEvent['type'], context?: string) {
	addActivity({
		type,
		timestamp: Date.now(),
		context,
	});
}

export function attachActivityListeners(addActivity: AddActivity, context?: string): () => void {
	if (typeof window === 'undefined') {
		return () => undefined;
	}

	const onMouse = () => record(addActivity, 'mouse', context);
	const onKey = () => record(addActivity, 'keyboard', context);
	const onClick = () => record(addActivity, 'click', context);
	const onScroll = () => record(addActivity, 'scroll', context);
	const onFocus = () => record(addActivity, 'focus', context);

	window.addEventListener('mousemove', onMouse, {passive: true});
	window.addEventListener('keydown', onKey, {passive: true});
	window.addEventListener('click', onClick, {passive: true});
	window.addEventListener('scroll', onScroll, {passive: true});
	window.addEventListener('focus', onFocus, {passive: true});

	return () => {
		window.removeEventListener('mousemove', onMouse);
		window.removeEventListener('keydown', onKey);
		window.removeEventListener('click', onClick);
		window.removeEventListener('scroll', onScroll);
		window.removeEventListener('focus', onFocus);
	};
}
