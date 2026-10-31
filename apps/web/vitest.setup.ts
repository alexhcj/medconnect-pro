import '@testing-library/jest-dom/vitest';

// jsdom has no ResizeObserver; Headless UI popovers and comboboxes (FE-057 date and time fields) use it.
if (typeof globalThis.ResizeObserver === 'undefined') {
	globalThis.ResizeObserver = class ResizeObserver {
		observe() {}
		unobserve() {}
		disconnect() {}
	};
}
