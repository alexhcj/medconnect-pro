export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface UINotification {
	id: string;
	type: NotificationType;
	title: string;
	message: string;
}

export interface FormUIState {
	hasUnsavedChanges: boolean;
}

export interface UIState {
	notifications: UINotification[];
	formState: Record<string, FormUIState>;
}

export interface UIActions {
	addNotification: (notification: Omit<UINotification, 'id'>) => void;
	removeNotification: (id: string) => void;
	setFormState: (formId: string, state: Partial<FormUIState>) => void;
}
