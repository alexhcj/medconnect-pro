import {create} from 'zustand';
import {UIActions, UINotification, UIState, FormUIState} from '@/types/store/ui-store';

type UIStore = UIState & UIActions;

export const useUIStore = create<UIStore>((set) => ({
	notifications: [],
	formState: {},
	addNotification: (notification) =>
		set((state) => ({
			notifications: [
				...state.notifications,
				{
					...notification,
					id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
				} satisfies UINotification,
			],
		})),
	removeNotification: (id) =>
		set((state) => ({
			notifications: state.notifications.filter((item) => item.id !== id),
		})),
	setFormState: (formId, next) =>
		set((state) => ({
			formState: {
				...state.formState,
				[formId]: {
					...state.formState[formId],
					hasUnsavedChanges: false,
					...next,
				},
			},
		})),
}));

export const useUISelectors = {
	useAddNotification: () => useUIStore((state) => state.addNotification),
	useNotificationActions: () => ({
		addNotification: useUIStore.getState().addNotification,
		removeNotification: useUIStore.getState().removeNotification,
	}),
	useFormState: (formId: string) => ({
		setFormState: (state: Partial<FormUIState>) => useUIStore.getState().setFormState(formId, state),
		formState: useUIStore((store) => store.formState[formId]),
	}),
};
