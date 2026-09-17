'use client';

import dynamic from 'next/dynamic';
import * as React from 'react';

import { Button } from '@/components/ui/button';

export type RoomCanvasState = 'loading' | 'ready' | 'webgl-unavailable' | 'error';

const StaticRoomCanvas = dynamic(
  () => import('./static-room-canvas').then((module) => module.StaticRoomCanvas),
  { ssr: false },
);

function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

function RoomCanvasMessage({
  state,
  onRetry,
}: Readonly<{
  state: Exclude<RoomCanvasState, 'ready'>;
  onRetry?: () => void;
}>) {
  const content = {
    loading: ['Loading room preview', 'Preparing the interactive room canvas.'],
    'webgl-unavailable': ['3D preview unavailable', 'This browser does not support WebGL. The editor remains available.'],
    error: ['Room preview could not start', 'Try loading the 3D preview again.'],
  } as const;
  const [title, description] = content[state];

  return (
    <div
      className="flex min-h-[22rem] flex-col items-center justify-center rounded-2xl border border-dashed border-sky-400/25 bg-slate-900/70 p-6 text-center"
      role={state === 'error' ? 'alert' : 'status'}
      aria-live="polite"
    >
      <h3 className="text-base font-semibold text-white">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">{description}</p>
      {state === 'error' && onRetry ? (
        <Button type="button" variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          Retry 3D preview
        </Button>
      ) : null}
    </div>
  );
}

class CanvasErrorBoundary extends React.Component<
  Readonly<{ children: React.ReactNode; onError: () => void }>,
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch() {
    this.props.onError();
  }

  render() {
    return this.state.hasError ? null : this.props.children;
  }
}

export function RoomCanvasBoundary({
  initialState,
}: Readonly<{
  initialState?: RoomCanvasState;
}>) {
  const [state, setState] = React.useState<RoomCanvasState>(initialState ?? 'loading');
  const resetCameraRef = React.useRef<() => void>(() => undefined);
  const [canvasKey, setCanvasKey] = React.useState(0);

  React.useEffect(() => {
    if (!initialState) {
      setState(supportsWebGL() ? 'loading' : 'webgl-unavailable');
    }
  }, [initialState]);

  const retry = () => {
    if (!supportsWebGL()) {
      setState('webgl-unavailable');
      return;
    }

    setCanvasKey((key) => key + 1);
    setState('loading');
  };

  const showCanvas = state === 'loading' || state === 'ready';

  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70">
      <p id="room-canvas-description" className="sr-only">
        Interactive 3D preview of a static living room with a floor and fixed room boundaries. Use pointer controls to orbit, pan, and zoom the camera.
      </p>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
        <p className="text-sm text-slate-200">Static room preview</p>
        <Button type="button" variant="outline" size="sm" onClick={() => resetCameraRef.current()}>
          Reset camera
        </Button>
      </div>
      <div className="relative h-[22rem] w-full overflow-hidden sm:h-[28rem]" aria-describedby="room-canvas-description">
        {showCanvas ? (
          <CanvasErrorBoundary key={canvasKey} onError={() => setState('error')}>
            <StaticRoomCanvas
              resetCameraRef={resetCameraRef}
              onReady={() => setState('ready')}
            />
          </CanvasErrorBoundary>
        ) : null}
        {state === 'loading' ? (
          <div className="pointer-events-none absolute inset-0 grid place-items-center bg-slate-900/55" aria-live="polite">
            <span className="rounded-full bg-slate-950/85 px-3 py-2 text-sm text-slate-200">Loading room preview</span>
          </div>
        ) : null}
        {state === 'webgl-unavailable' || state === 'error' ? <RoomCanvasMessage state={state} onRetry={retry} /> : null}
      </div>
    </div>
  );
}
