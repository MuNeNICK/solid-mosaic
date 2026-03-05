import { createSignal } from 'solid-js';
import { MosaicDragItem, MosaicDropData } from './internalTypes';

const [dragItem, setDragItem] = createSignal<MosaicDragItem | null>(null);
const [dropResult, setDropResult] = createSignal<MosaicDropData | null>(null);

export function getDragItem() {
  return dragItem();
}

export function startDrag(item: MosaicDragItem) {
  setDragItem(item);
  setDropResult(null);
}

export function endDrag() {
  const result = dropResult();
  setDragItem(null);
  setDropResult(null);
  return result;
}

export function drop(data: MosaicDropData) {
  setDropResult(data);
}

export function isDragging() {
  return dragItem() !== null;
}
