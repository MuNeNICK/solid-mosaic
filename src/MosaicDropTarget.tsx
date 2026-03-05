import classNames from 'classnames';
import { createSignal } from 'solid-js';
import { useMosaicContext } from './contextTypes';
import { MosaicDropTargetPosition } from './internalTypes';
import { MosaicPath } from './types';
import { getDragItem, drop as dndDrop } from './dnd';

export interface MosaicDropTargetProps {
  position: MosaicDropTargetPosition;
  path: MosaicPath;
}

export function MosaicDropTarget(props: MosaicDropTargetProps) {
  const ctx = useMosaicContext();
  const [isOver, setIsOver] = createSignal(false);

  function onDragEnter(e: DragEvent) {
    e.preventDefault();
    setIsOver(true);
  }

  function onDragOver(e: DragEvent) {
    e.preventDefault();
  }

  function onDragLeave() {
    setIsOver(false);
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsOver(false);
    const item = getDragItem();
    if (item && ctx.mosaicId === item.mosaicId) {
      dndDrop({ path: props.path, position: props.position });
    }
  }

  return (
    <div
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      class={classNames('drop-target', props.position, {
        'drop-target-hover': isOver() && getDragItem()?.mosaicId === ctx.mosaicId,
      })}
    />
  );
}
