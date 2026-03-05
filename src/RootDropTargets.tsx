import classNames from 'classnames';
import values from 'lodash/values';
import { createSignal, createEffect, onCleanup, For } from 'solid-js';

import { MosaicDropTargetPosition } from './internalTypes';
import { MosaicDropTarget } from './MosaicDropTarget';
import { isDragging } from './dnd';

export function RootDropTargets() {
  const [delayedIsDragging, setDelayedIsDragging] = createSignal(false);

  createEffect(() => {
    const dragging = isDragging();
    if (!dragging) {
      setDelayedIsDragging(false);
      return;
    }
    const timer = window.setTimeout(() => setDelayedIsDragging(true), 0);
    onCleanup(() => window.clearTimeout(timer));
  });

  return (
    <div
      class={classNames('drop-target-container', {
        '-dragging': delayedIsDragging(),
      })}
    >
      <For each={values<MosaicDropTargetPosition>(MosaicDropTargetPosition)}>
        {(position) => <MosaicDropTarget position={position} path={[]} />}
      </For>
    </div>
  );
}
