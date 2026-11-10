'use client';

import {Dialog, DialogBackdrop, DialogPanel, DialogTitle, Tab, TabGroup, TabList, TabPanel, TabPanels} from '@headlessui/react';
import {X} from 'lucide-react';
import {SelectField} from '@/components/ui/select-field';
import {BackgroundPicker} from '@/components/telehealth/green-room-parts';
import type {CallDevices, DeviceOption} from '@/lib/hooks/use-daily-media-session';
import {SYNTHETIC_CAMERA_LABEL} from '@/lib/telehealth/demo-personas';
import type {BackgroundChoice} from '@/lib/telehealth/prejoin-backgrounds';

export type DevicesTab = 'video' | 'audio' | 'background';
const TAB_ORDER: DevicesTab[] = ['video', 'audio', 'background'];
const TAB_LABEL: Record<DevicesTab, string> = {video: 'Video', audio: 'Audio', background: 'Background'};

function DeviceSelect({
	label,
	options,
	value,
	onChange,
	emptyText,
}: {
	label: string;
	options: DeviceOption[];
	value: string | undefined;
	onChange: (deviceId: string) => void;
	emptyText: string;
}) {
	if (options.length === 0) {
		return (
			<div className="space-y-1.5">
				<p className="text-sm font-medium text-gray-900">{label}</p>
				<p className="text-sm text-gray-600">{emptyText}</p>
			</div>
		);
	}
	return (
		<SelectField
			label={label}
			size="large"
			value={value ?? options[0].deviceId}
			onChange={onChange}
			options={options.map((option) => ({value: option.deviceId, label: option.label}))}
		/>
	);
}

/**
 * Video, Audio and Background tabs. A change applies to the live call immediately; there is no Save.
 * Device ids and the background choice stay in the browser (SEC-013 scope 7). Headless UI traps
 * focus inside and returns it to the control that opened the modal.
 */
export function DevicesModal({
	open,
	onClose,
	tab,
	onTabChange,
	devices,
	background,
	personaActive = false,
	onChooseDevice,
	onSetBackground,
	disabled,
}: {
	open: boolean;
	onClose: () => void;
	tab: DevicesTab;
	onTabChange: (tab: DevicesTab) => void;
	devices: CallDevices;
	background: BackgroundChoice;
	personaActive?: boolean;
	onChooseDevice: (kind: 'camera' | 'microphone' | 'speaker', deviceId: string) => void;
	onSetBackground: (choice: BackgroundChoice) => void;
	disabled: boolean;
}) {
	return (
		<Dialog open={open} onClose={onClose} className="relative z-[60]">
			<DialogBackdrop className="fixed inset-0 bg-black/60" />
			<div className="fixed inset-0 flex items-center justify-center p-4">
				<DialogPanel className="max-h-full w-full max-w-[560px] overflow-y-auto rounded-2xl bg-white p-6 text-gray-900 shadow-xl">
					<div className="flex items-center justify-between gap-3">
						<DialogTitle className="text-xl font-semibold">Devices</DialogTitle>
						<button
							type="button"
							aria-label="Close devices"
							onClick={onClose}
							className="flex size-11 cursor-pointer items-center justify-center rounded-full border border-gray-300 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
						>
							<X aria-hidden="true" className="size-5" />
						</button>
					</div>

					<TabGroup selectedIndex={TAB_ORDER.indexOf(tab)} onChange={(index) => onTabChange(TAB_ORDER[index])}>
						<TabList className="mt-4 grid grid-cols-3 gap-0.5 rounded-md border border-border bg-subtle">
							{TAB_ORDER.map((name) => (
								<Tab
									key={name}
									className="min-h-11 cursor-pointer rounded-md border border-transparent text-sm text-foreground-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-selected:border-border data-selected:bg-surface data-selected:font-medium data-selected:text-brand-strong"
								>
									{TAB_LABEL[name]}
								</Tab>
							))}
						</TabList>
						<TabPanels className="mt-5">
							<TabPanel className="space-y-4 focus-visible:outline-none">
								{personaActive ? (
									<div className="space-y-1.5">
										<p className="text-sm font-medium text-gray-900">Camera</p>
										<p className="text-sm text-gray-600">
											Using the demo persona camera ({SYNTHETIC_CAMERA_LABEL}). Leave and rejoin from the green room to use your
											camera.
										</p>
									</div>
								) : (
									<DeviceSelect
										label="Camera"
										options={devices.cameras}
										value={devices.cameraId}
										onChange={(id) => onChooseDevice('camera', id)}
										emptyText="No camera found."
									/>
								)}
							</TabPanel>
							<TabPanel className="space-y-4 focus-visible:outline-none">
								<DeviceSelect
									label="Microphone"
									options={devices.microphones}
									value={devices.microphoneId}
									onChange={(id) => onChooseDevice('microphone', id)}
									emptyText="No microphone found."
								/>
								<DeviceSelect
									label="Speaker"
									options={devices.speakers}
									value={devices.speakerId}
									onChange={(id) => onChooseDevice('speaker', id)}
									emptyText="This browser chooses the speaker for you."
								/>
							</TabPanel>
							<TabPanel className="focus-visible:outline-none">
								<BackgroundPicker value={background} onChange={onSetBackground} disabled={disabled} />
							</TabPanel>
						</TabPanels>
					</TabGroup>
					<p className="mt-5 text-xs text-gray-600">Changes apply right away. Device and background choices stay in this browser.</p>
				</DialogPanel>
			</div>
		</Dialog>
	);
}
