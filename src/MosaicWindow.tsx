import classNames from 'classnames';
import defer from 'lodash/defer';
import dropRight from 'lodash/dropRight';
import isEmpty from 'lodash/isEmpty';
import isEqual from 'lodash/isEqual';
import values from 'lodash/values';
import { createSignal, JSX, Show, For } from 'solid-js';

import { DEFAULT_CONTROLS_WITHOUT_CREATION, DEFAULT_CONTROLS_WITH_CREATION } from './buttons/defaultToolbarControls';
import { Separator } from './buttons/Separator';
import {
  MosaicWindowContext,
  MosaicWindowContextT,
  useMosaicContext,
} from './contextTypes';
import { MosaicDropTargetPosition } from './internalTypes';
import { MosaicDropTarget } from './MosaicDropTarget';
import { CreateNode, MosaicBranch, MosaicDirection, MosaicKey } from './types';
import { createDragToUpdates } from './util/mosaicUpdates';
import { getAndAssertNodeAtPathExists } from './util/mosaicUtilities';
import { OptionalBlueprint } from './util/OptionalBlueprint';
import { startDrag, endDrag, getDragItem } from './dnd';

export interface MosaicWindowProps<T extends MosaicKey> {
  title: string;
  path: MosaicBranch[];
  children?: JSX.Element;
  className?: string;
  toolbarControls?: JSX.Element;
  additionalControls?: JSX.Element;
  additionalControlButtonText?: string;
  onAdditionalControlsToggle?: (toggle: boolean) => void;
  disableAdditionalControlsOverlay?: boolean;
  draggable?: boolean;
  createNode?: CreateNode<T>;
  renderPreview?: (props: MosaicWindowProps<T>) => JSX.Element;
  renderToolbar?: ((props: MosaicWindowProps<T>, draggable: boolean | undefined) => JSX.Element) | null;
  onDragStart?: () => void;
  onDragEnd?: (type: 'drop' | 'reset') => void;
}

export function MosaicWindow<T extends MosaicKey = string>(props: MosaicWindowProps<T>) {
  const ctx = useMosaicContext();
  const [additionalControlsOpen, setAdditionalControlsOpen] = createSignal(false);
  // Counter-based dragenter/dragleave tracking (handles child element transitions)
  let dragEnterCount = 0;
  const [isOver, setIsOver] = createSignal(false);
  let rootElement: HTMLDivElement | undefined;
  let previewElement: HTMLDivElement | undefined;

  const draggable = () => props.draggable ?? true;
  const additionalControlButtonText = () => props.additionalControlButtonText ?? 'More';

  function renderPreview(windowProps: MosaicWindowProps<T>): JSX.Element {
    return (
      <div class="mosaic-preview">
        <div class="mosaic-window-toolbar">
          <div class="mosaic-window-title">{windowProps.title}</div>
        </div>
        <div class="mosaic-window-body">
          <h4>{windowProps.title}</h4>
          <OptionalBlueprint.Icon className="default-preview-icon" size="large" icon="APPLICATION" />
        </div>
      </div>
    );
  }

  function checkCreateNode() {
    if (props.createNode == null) {
      throw new Error('Operation invalid unless `createNode` is defined');
    }
  }

  function split(...args: any[]) {
    checkCreateNode();
    const { createNode, path } = props;
    const { mosaicActions } = ctx;
    const root = mosaicActions.getRoot();

    const direction: MosaicDirection =
      rootElement!.offsetWidth > rootElement!.offsetHeight ? 'row' : 'column';

    return Promise.resolve(createNode!(...args)).then((second) =>
      mosaicActions.replaceWith(path, {
        direction,
        second,
        first: getAndAssertNodeAtPathExists(root, path),
      }),
    );
  }

  function swap(...args: any[]) {
    checkCreateNode();
    const { mosaicActions } = ctx;
    const { createNode, path } = props;
    return Promise.resolve(createNode!(...args)).then((node) => mosaicActions.replaceWith(path, node));
  }

  function handleSetAdditionalControlsOpen(openOption: boolean | 'toggle') {
    const open = openOption === 'toggle' ? !additionalControlsOpen() : openOption;
    setAdditionalControlsOpen(open);
    props.onAdditionalControlsToggle?.(open);
  }

  const windowActions: MosaicWindowContextT = {
    blueprintNamespace: ctx.blueprintNamespace,
    mosaicWindowActions: {
      split,
      replaceWithNew: swap,
      setAdditionalControlsOpen: handleSetAdditionalControlsOpen,
      getPath: () => props.path,
    },
  };

  function getToolbarControls(): JSX.Element {
    if (props.toolbarControls) {
      return props.toolbarControls;
    } else if (props.createNode) {
      return <DEFAULT_CONTROLS_WITH_CREATION />;
    } else {
      return <DEFAULT_CONTROLS_WITHOUT_CREATION />;
    }
  }

  // ─── Native HTML5 DnD handlers (matching react-dnd behavior) ───

  function handleDragStart(e: DragEvent) {
    if (!draggable() || props.path.length === 0) {
      e.preventDefault();
      return;
    }
    props.onDragStart?.();
    // The defer is necessary as the element must be present on start for HTML DnD to not cry
    const hideTimer = defer(() => ctx.mosaicActions.hide(props.path));
    startDrag({ mosaicId: ctx.mosaicId, hideTimer });

    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', '');
      // Use the preview element as the drag ghost (like react-dnd connectDragPreview)
      if (previewElement) {
        e.dataTransfer.setDragImage(previewElement, 0, 0);
      }
    }
  }

  function handleDragEnd() {
    const item = getDragItem();
    if (!item) return;

    window.clearTimeout(item.hideTimer);
    const result = endDrag();
    const ownPath = props.path;

    if (result && result.position != null && result.path != null && !isEqual(result.path, ownPath)) {
      ctx.mosaicActions.updateTree(
        createDragToUpdates(ctx.mosaicActions.getRoot()!, ownPath, result.path, result.position),
      );
      props.onDragEnd?.('drop');
    } else {
      ctx.mosaicActions.updateTree([
        {
          path: dropRight(ownPath),
          spec: {
            splitPercentage: {
              $set: undefined,
            },
          },
        },
      ]);
      props.onDragEnd?.('reset');
    }
  }

  // ─── Window-level drop target (shows drop zones on hover, matching react-dnd useDrop) ───

  function handleWindowDragOver(e: DragEvent) {
    e.preventDefault();
  }

  function handleWindowDragEnter() {
    dragEnterCount++;
    if (dragEnterCount === 1) {
      setIsOver(true);
    }
  }

  function handleWindowDragLeave() {
    dragEnterCount--;
    if (dragEnterCount === 0) {
      setIsOver(false);
    }
  }

  function handleWindowDrop(e: DragEvent) {
    e.preventDefault();
    dragEnterCount = 0;
    setIsOver(false);
  }

  function renderToolbar() {
    const { title, additionalControls, path, renderToolbar: customRenderToolbar } = props;
    const toolbarControls = getToolbarControls();
    const draggableAndNotRoot = draggable() && path.length > 0;

    if (customRenderToolbar) {
      const toolbar = customRenderToolbar(props, draggable());
      return (
        <div
          class={classNames('mosaic-window-toolbar', { draggable: draggableAndNotRoot })}
          draggable={draggableAndNotRoot}
          onDragStart={handleDragStart}
        >
          {toolbar}
        </div>
      );
    }

    const hasAdditionalControls = !isEmpty(additionalControls);

    return (
      <div class={classNames('mosaic-window-toolbar', { draggable: draggableAndNotRoot })}>
        <div
          title={title}
          class="mosaic-window-title"
          draggable={draggableAndNotRoot}
          onDragStart={handleDragStart}
        >
          {title}
        </div>
        <div class={classNames('mosaic-window-controls', OptionalBlueprint.getClasses(ctx.blueprintNamespace, 'BUTTON_GROUP'))}>
          <Show when={hasAdditionalControls}>
            <button
              onClick={() => handleSetAdditionalControlsOpen(!additionalControlsOpen())}
              class={classNames(
                OptionalBlueprint.getClasses(ctx.blueprintNamespace, 'BUTTON', 'MINIMAL'),
                OptionalBlueprint.getIconClass(ctx.blueprintNamespace, 'MORE'),
                {
                  [OptionalBlueprint.getClasses(ctx.blueprintNamespace, 'ACTIVE')]: additionalControlsOpen(),
                },
              )}
            >
              <span class="control-text">{additionalControlButtonText()}</span>
            </button>
            <Separator />
          </Show>
          {toolbarControls}
        </div>
      </div>
    );
  }

  const doRenderPreview = props.renderPreview ?? renderPreview;

  return (
    <MosaicWindowContext.Provider value={windowActions}>
      <div
        class={classNames('mosaic-window mosaic-drop-target', props.className, {
          'drop-target-hover': isOver() && getDragItem()?.mosaicId === ctx.mosaicId,
          'additional-controls-open': additionalControlsOpen(),
        })}
        ref={rootElement}
        onDragOver={handleWindowDragOver}
        onDragEnter={handleWindowDragEnter}
        onDragLeave={handleWindowDragLeave}
        onDrop={handleWindowDrop}
        onDragEnd={handleDragEnd}
      >
        {renderToolbar()}
        <div class="mosaic-window-body">{props.children}</div>
        <Show when={!props.disableAdditionalControlsOverlay}>
          <div
            class="mosaic-window-body-overlay"
            onClick={() => handleSetAdditionalControlsOpen(false)}
          />
        </Show>
        <div class="mosaic-window-additional-actions-bar">{props.additionalControls}</div>
        <div ref={previewElement}>
          {doRenderPreview(props)}
        </div>
        <div class="drop-target-container">
          <For each={values<MosaicDropTargetPosition>(MosaicDropTargetPosition)}>
            {(position) => <MosaicDropTarget position={position} path={props.path} />}
          </For>
        </div>
      </div>
    </MosaicWindowContext.Provider>
  );
}
