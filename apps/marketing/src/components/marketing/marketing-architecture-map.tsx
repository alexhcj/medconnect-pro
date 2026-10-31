'use client';

import {useEffect, useLayoutEffect, useRef, useState} from 'react';
import {
	Cloud,
	Database,
	FileLock,
	Globe,
	KeyRound,
	LayoutDashboard,
	type LucideIcon,
	Server,
	Video,
	Zap,
} from 'lucide-react';
import {
	type ArchitectureNode,
	type ArchitectureNodeId,
	MARKETING_ARCHITECTURE_GROUPS,
	MARKETING_ARCHITECTURE_MAP,
	MARKETING_ARCHITECTURE_NODES,
} from '@/components/marketing/marketing-architecture-copy';
import {marketingStatusTone} from '@/components/marketing/marketing-status-tones';
import {Badge} from '@/components/ui/badge';
import {cn} from '@/lib/utils/utils';

const ICONS: Record<ArchitectureNodeId, LucideIcon> = {
	'public-site': Globe,
	'web-app': LayoutDashboard,
	api: Server,
	database: Database,
	'video-calls': Video,
	'sign-in': KeyRound,
	hosting: Cloud,
	cache: Zap,
	'document-storage': FileLock,
	'production-cloud': Cloud,
};

/** `md`+ grid cells. DOM order stays clients, API, database, external, planned for tab order. */
const PLACEMENT: Partial<Record<ArchitectureNodeId, string>> = {
	'public-site': 'col-start-1 row-start-2',
	'web-app': 'col-start-2 row-start-2',
	api: 'col-span-2 col-start-1 row-start-3',
	database: 'col-span-2 col-start-1 row-start-4',
	'video-calls': 'col-start-3 row-start-2',
	'sign-in': 'col-start-3 row-start-3',
	hosting: 'col-start-3 row-start-4',
};

/** Decorative connectors: `down` joins bottom to top, `right` joins right edge to left edge. */
const CONNECTORS: readonly [ArchitectureNodeId, ArchitectureNodeId, 'down' | 'right'][] = [
	['public-site', 'api', 'down'],
	['web-app', 'api', 'down'],
	['api', 'database', 'down'],
	['web-app', 'video-calls', 'right'],
	['api', 'sign-in', 'right'],
];

interface Line {
	id: string;
	x1: number;
	y1: number;
	x2: number;
	y2: number;
}

const NODE_IDS = new Set<string>(MARKETING_ARCHITECTURE_NODES.map((node) => node.id));

function isNodeId(value: string): value is ArchitectureNodeId {
	return NODE_IDS.has(value);
}

const NODE_STATE_CLASS_NAME: Record<ArchitectureNode['state'], string> = {
	Current: 'border-border bg-surface shadow-sm',
	External: 'border-border-strong bg-surface',
	Planned: 'border-dashed border-border-strong bg-warning-subtle',
};

function NodeSummary({node}: {node: ArchitectureNode}) {
	const Icon = ICONS[node.id];
	return (
		<>
			<span className="flex items-center justify-between gap-2">
				<Icon aria-hidden className="size-5 shrink-0 text-brand" />
				<Badge tone={marketingStatusTone(node.state)}>{node.state}</Badge>
			</span>
			<span className="block text-sm font-medium text-foreground">{node.name}</span>
			<span className="block text-xs leading-relaxed text-foreground-secondary">
				{node.technical}
			</span>
		</>
	);
}

/**
 * Selection must not resize the content box, or text re-wraps and the grid jumps. Solid nodes keep
 * a 1px border and add a 1px inset shadow for the 2px look. Planned nodes need a real dashed 2px
 * border, so unselected ones carry 1px of extra padding that the wider border takes over.
 */
function nodeButtonClassName(node: ArchitectureNode, selected: boolean): string {
	const planned = node.state === 'Planned';
	return cn(
		'flex h-full min-h-11 w-full flex-col gap-2 rounded-lg border p-4 text-left transition-colors',
		'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-canvas',
		NODE_STATE_CLASS_NAME[node.state],
		planned && !selected && 'p-[17px]',
		selected && 'border-border-brand bg-brand-subtle',
		selected && (planned ? 'border-2' : 'shadow-[inset_0_0_0_1px_var(--color-border-brand)]'),
		!selected && 'hover:border-border-brand',
	);
}

function DetailField({label, children}: {label: string; children: React.ReactNode}) {
	return (
		<div>
			<dt className="text-xs font-medium text-foreground-secondary">{label}</dt>
			<dd className="mt-1 text-sm leading-relaxed text-foreground">{children}</dd>
		</div>
	);
}

function NodeDetailFields({node}: {node: ArchitectureNode}) {
	return (
		<dl className="space-y-4">
			<DetailField label="What it does">{node.whatItDoes}</DetailField>
			{node.modules ? (
				<DetailField label="Domain modules (one deployable app)">
					<ul className="flex flex-wrap gap-2">
						{node.modules.map((module) => (
							<li key={module}>
								<Badge>{module}</Badge>
							</li>
						))}
					</ul>
				</DetailField>
			) : null}
			{node.controls ? (
				<DetailField label="Controls enforced here">{node.controls.join(' · ')}</DetailField>
			) : null}
			<DetailField label="Connects to">{node.connectsTo.join(' · ')}</DetailField>
		</dl>
	);
}

/**
 * System map from `md` (SVG connectors under HTML node buttons, plus a live detail panel) and an
 * accordion list below `md`. Both share one selection; `/architecture#<node-id>` preselects.
 */
export function MarketingArchitectureMap() {
	const [selectedId, setSelectedId] = useState<ArchitectureNodeId | null>(
		MARKETING_ARCHITECTURE_MAP.defaultNodeId,
	);
	const [lines, setLines] = useState<Line[]>([]);
	const mapRef = useRef<HTMLDivElement>(null);
	const nodeRefs = useRef(new Map<ArchitectureNodeId, HTMLButtonElement>());

	const activeId = selectedId ?? MARKETING_ARCHITECTURE_MAP.defaultNodeId;
	const activeNode =
		MARKETING_ARCHITECTURE_NODES.find((node) => node.id === activeId) ??
		MARKETING_ARCHITECTURE_NODES[0];
	const ActiveIcon = ICONS[activeNode.id];

	useEffect(() => {
		function selectFromHash() {
			const id = window.location.hash.slice(1);
			if (!isNodeId(id)) return;
			setSelectedId(id);
			document.getElementById(MARKETING_ARCHITECTURE_MAP.headingId)?.scrollIntoView();
		}
		const frame = window.requestAnimationFrame(selectFromHash);
		window.addEventListener('hashchange', selectFromHash);
		return () => {
			window.cancelAnimationFrame(frame);
			window.removeEventListener('hashchange', selectFromHash);
		};
	}, []);

	useLayoutEffect(() => {
		const map = mapRef.current;
		if (!map || typeof ResizeObserver === 'undefined') return;
		const observer = new ResizeObserver(() => {
			const origin = map.getBoundingClientRect();
			// Hidden below `md`: nothing to draw.
			if (origin.width === 0) {
				setLines([]);
				return;
			}
			const rect = (id: ArchitectureNodeId) => {
				const box = nodeRefs.current.get(id)?.getBoundingClientRect();
				return box
					? {
							left: box.left - origin.left,
							right: box.right - origin.left,
							top: box.top - origin.top,
							bottom: box.bottom - origin.top,
						}
					: null;
			};
			setLines(
				CONNECTORS.flatMap(([from, to, direction]) => {
					const a = rect(from);
					const b = rect(to);
					if (!a || !b) return [];
					const id = `${from}-${to}`;
					if (direction === 'down') {
						const x = (a.left + a.right) / 2;
						return [{id, x1: x, y1: a.bottom, x2: x, y2: b.top}];
					}
					const y = (a.top + a.bottom) / 2;
					return [{id, x1: a.right, y1: y, x2: b.left, y2: y}];
				}),
			);
		});
		observer.observe(map);
		return () => observer.disconnect();
	}, []);

	const coreNodes = MARKETING_ARCHITECTURE_NODES.filter((node) => node.state !== 'Planned');
	const plannedNodes = MARKETING_ARCHITECTURE_NODES.filter((node) => node.state === 'Planned');

	const mapButton = (node: ArchitectureNode, className?: string) => (
		<button
			key={node.id}
			ref={(element) => {
				if (element) nodeRefs.current.set(node.id, element);
				else nodeRefs.current.delete(node.id);
			}}
			type="button"
			aria-pressed={node.id === activeId}
			aria-controls="architecture-detail"
			onClick={() => setSelectedId(node.id)}
			className={cn(nodeButtonClassName(node, node.id === activeId), className)}
		>
			<NodeSummary node={node} />
		</button>
	);

	return (
		<>
			<div className="hidden gap-8 md:grid lg:grid-cols-[minmax(0,1fr)_20rem]">
				<div
					ref={mapRef}
					className="relative grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] gap-x-8 gap-y-8 rounded-lg border border-border bg-canvas p-6"
				>
					<svg
						role="img"
						aria-labelledby="architecture-map-title architecture-map-desc"
						className="pointer-events-none absolute inset-0 size-full"
					>
						<title id="architecture-map-title">{MARKETING_ARCHITECTURE_MAP.svgTitle}</title>
						<desc id="architecture-map-desc">{MARKETING_ARCHITECTURE_MAP.svgDescription}</desc>
						{lines.map(({id, ...line}) => (
							<line
								key={id}
								{...line}
								className="stroke-border-strong"
								strokeWidth={2}
							/>
						))}
					</svg>
					<p className="col-span-2 row-start-1 -mb-4 text-xs font-medium text-foreground-secondary">
						{MARKETING_ARCHITECTURE_MAP.clientsLabel}
					</p>
					<p className="col-start-3 row-start-1 -mb-4 text-xs font-medium text-foreground-secondary">
						{MARKETING_ARCHITECTURE_GROUPS[1].label}
					</p>
					{coreNodes.map((node) => mapButton(node, cn('relative', PLACEMENT[node.id])))}
					<p className="col-span-3 row-start-5 -mb-4 text-xs font-medium text-foreground-secondary">
						{MARKETING_ARCHITECTURE_GROUPS[2].label}
					</p>
					<div className="relative col-span-3 row-start-6 grid grid-cols-3 gap-8">
						{plannedNodes.map((node) => mapButton(node))}
					</div>
				</div>
				<div
					id="architecture-detail"
					aria-live="polite"
					className="self-start rounded-lg border border-border bg-surface p-6 shadow-sm"
				>
					<div className="flex items-center justify-between gap-2">
						<ActiveIcon aria-hidden className="size-6 text-brand" />
						<Badge tone={marketingStatusTone(activeNode.state)}>{activeNode.state}</Badge>
					</div>
					<h3 className="mt-4 text-lg font-semibold text-foreground">{activeNode.name}</h3>
					<p className="mt-1 text-sm text-foreground-secondary">{activeNode.technical}</p>
					<div className="mt-4">
						<NodeDetailFields node={activeNode} />
					</div>
					<p className="mt-4 text-xs leading-relaxed text-foreground-secondary">
						{MARKETING_ARCHITECTURE_MAP.note}
					</p>
				</div>
			</div>

			<div className="space-y-6 md:hidden">
				{MARKETING_ARCHITECTURE_GROUPS.map((group) => {
					const groupId = `architecture-group-${group.state.toLowerCase()}`;
					return (
						<div key={group.state}>
							<h3 id={groupId} className="text-xs font-medium text-foreground-secondary">
								{group.label}
							</h3>
							<ul aria-labelledby={groupId} className="mt-3 space-y-3">
								{MARKETING_ARCHITECTURE_NODES.filter((node) => node.state === group.state).map(
									(node) => {
										const expanded = node.id === selectedId;
										const panelId = `architecture-list-${node.id}`;
										return (
											<li key={node.id} className="space-y-3">
												<button
													type="button"
													aria-expanded={expanded}
													aria-controls={panelId}
													onClick={() => setSelectedId(expanded ? null : node.id)}
													className={nodeButtonClassName(node, expanded)}
												>
													<NodeSummary node={node} />
												</button>
												<div
													id={panelId}
													hidden={!expanded}
													className="rounded-lg border border-border bg-surface p-4"
												>
													<NodeDetailFields node={node} />
												</div>
											</li>
										);
									},
								)}
							</ul>
						</div>
					);
				})}
				<p className="text-xs leading-relaxed text-foreground-secondary">
					{MARKETING_ARCHITECTURE_MAP.note}
				</p>
			</div>
		</>
	);
}
