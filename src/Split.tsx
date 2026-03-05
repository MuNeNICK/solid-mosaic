import classNames from 'classnames';
import clamp from 'lodash/clamp';
import throttle from 'lodash/throttle';
import { onMount, onCleanup } from 'solid-js';

import { EnabledResizeOptions, MosaicDirection } from './types';
import { BoundingBox } from './util/BoundingBox';

const RESIZE_THROTTLE_MS = 1000 / 30; // 30 fps

const TOUCH_EVENT_OPTIONS = {
  capture: true,
  passive: false,
} as const;

export interface SplitProps extends EnabledResizeOptions {
  direction: MosaicDirection;
  boundingBox: BoundingBox;
  splitPercentage: number;
  onChange?: (percentOfParent: number) => void;
  onRelease?: (percentOfParent: number) => void;
}

export function Split(props: SplitProps) {
  const onChange = () => props.onChange ?? (() => void 0);
  const onRelease = () => props.onRelease ?? (() => void 0);
  const minimumPaneSizePercentage = () => props.minimumPaneSizePercentage ?? 20;

  let rootElement!: HTMLDivElement;
  let listenersBound = false;

  function computeStyle() {
    const { boundingBox, direction, splitPercentage } = props;
    const positionStyle = direction === 'column' ? 'top' : 'left';
    const absolutePercentage = BoundingBox.getAbsoluteSplitPercentage(boundingBox, splitPercentage, direction);
    return {
      ...BoundingBox.asStyles(boundingBox),
      [positionStyle]: `${absolutePercentage}%`,
    };
  }

  function calculateRelativePercentage(event: MouseEvent | TouchEvent): number {
    const parentBBox = rootElement.parentElement!.getBoundingClientRect();
    const location = isTouchEvent(event) ? event.changedTouches[0] : event;

    let absolutePercentage: number;
    if (props.direction === 'column') {
      absolutePercentage = ((location.clientY - parentBBox.top) / parentBBox.height) * 100.0;
    } else {
      absolutePercentage = ((location.clientX - parentBBox.left) / parentBBox.width) * 100.0;
    }

    const relativePercentage = BoundingBox.getRelativeSplitPercentage(
      props.boundingBox,
      absolutePercentage,
      props.direction,
    );

    return clamp(relativePercentage, minimumPaneSizePercentage()!, 100 - minimumPaneSizePercentage()!);
  }

  const throttledUpdatePercentage = throttle((event: MouseEvent | TouchEvent) => {
    const percentage = calculateRelativePercentage(event);
    if (percentage !== props.splitPercentage) {
      onChange()(percentage);
    }
  }, RESIZE_THROTTLE_MS);

  function onMouseMove(event: MouseEvent | TouchEvent) {
    event.preventDefault();
    throttledUpdatePercentage(event);
  }

  function onMouseUp(event: MouseEvent | TouchEvent) {
    unbindListeners();
    const percentage = calculateRelativePercentage(event);
    onRelease()(percentage);
  }

  function bindListeners() {
    if (!listenersBound) {
      const doc = rootElement.ownerDocument!;
      doc.addEventListener('mousemove', onMouseMove, true);
      doc.addEventListener('touchmove', onMouseMove, TOUCH_EVENT_OPTIONS);
      doc.addEventListener('mouseup', onMouseUp, true);
      doc.addEventListener('touchend', onMouseUp, true);
      listenersBound = true;
    }
  }

  function unbindListeners() {
    if (rootElement) {
      const doc = rootElement.ownerDocument!;
      doc.removeEventListener('mousemove', onMouseMove, true);
      doc.removeEventListener('touchmove', onMouseMove, TOUCH_EVENT_OPTIONS);
      doc.removeEventListener('mouseup', onMouseUp, true);
      doc.removeEventListener('touchend', onMouseUp, true);
      listenersBound = false;
    }
  }

  function onMouseDown(event: MouseEvent | TouchEvent) {
    if (!isTouchEvent(event)) {
      if ((event as MouseEvent).button !== 0) {
        return;
      }
    }
    event.preventDefault();
    bindListeners();
  }

  onMount(() => {
    rootElement.addEventListener('touchstart', onMouseDown, TOUCH_EVENT_OPTIONS);
  });

  onCleanup(() => {
    unbindListeners();
    if (rootElement) {
      rootElement.removeEventListener('touchstart', onMouseDown, TOUCH_EVENT_OPTIONS);
    }
  });

  return (
    <div
      class={classNames('mosaic-split', {
        '-row': props.direction === 'row',
        '-column': props.direction === 'column',
      })}
      ref={rootElement}
      onMouseDown={onMouseDown}
      style={computeStyle()}
    >
      <div class="mosaic-split-line" />
    </div>
  );
}

function isTouchEvent(event: MouseEvent | TouchEvent): event is TouchEvent {
  return (event as TouchEvent).changedTouches != null;
}
