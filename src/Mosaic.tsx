import classNames from 'classnames';
import countBy from 'lodash/countBy';
import keys from 'lodash/keys';
import pickBy from 'lodash/pickBy';
import { createSignal, createEffect, JSX } from 'solid-js';
import { v4 as uuid } from 'uuid';

import { MosaicContext, MosaicContextT, MosaicRootActions } from './contextTypes';
import { MosaicRoot } from './MosaicRoot';
import { MosaicZeroState } from './MosaicZeroState';
import { RootDropTargets } from './RootDropTargets';
import { MosaicKey, MosaicNode, MosaicPath, MosaicUpdate, ResizeOptions, TileRenderer } from './types';
import { createExpandUpdate, createHideUpdate, createRemoveUpdate, updateTree } from './util/mosaicUpdates';
import { getLeaves } from './util/mosaicUtilities';

const DEFAULT_EXPAND_PERCENTAGE = 70;

export interface MosaicBaseProps<T extends MosaicKey> {
  renderTile: TileRenderer<T>;
  onChange?: (newNode: MosaicNode<T> | null) => void;
  onRelease?: (newNode: MosaicNode<T> | null) => void;
  className?: string;
  resize?: ResizeOptions;
  zeroStateView?: JSX.Element;
  mosaicId?: string;
  blueprintNamespace?: string;
}

export interface MosaicControlledProps<T extends MosaicKey> extends MosaicBaseProps<T> {
  value: MosaicNode<T> | null;
  onChange: (newNode: MosaicNode<T> | null) => void;
}

export interface MosaicUncontrolledProps<T extends MosaicKey> extends MosaicBaseProps<T> {
  initialValue: MosaicNode<T> | null;
}

export type MosaicProps<T extends MosaicKey> = MosaicControlledProps<T> | MosaicUncontrolledProps<T>;

function isUncontrolled<T extends MosaicKey>(props: MosaicProps<T>): props is MosaicUncontrolledProps<T> {
  return (props as MosaicUncontrolledProps<T>).initialValue != null;
}

function isControlled<T extends MosaicKey>(props: MosaicProps<T>): props is MosaicControlledProps<T> {
  return 'value' in props;
}

export function Mosaic<T extends MosaicKey = string>(props: MosaicProps<T>) {
  const mosaicId = props.mosaicId ?? uuid();
  const className = () => props.className ?? 'mosaic-blueprint-theme';
  const blueprintNamespace = props.blueprintNamespace ?? 'bp3';

  const [internalNode, setInternalNode] = createSignal<MosaicNode<T> | null>(
    isUncontrolled(props) ? props.initialValue : null,
  );

  // Sync uncontrolled initialValue changes
  if (isUncontrolled(props)) {
    createEffect(() => {
      const p = props as MosaicUncontrolledProps<T>;
      setInternalNode(() => p.initialValue);
    });
  }

  function getRoot(): MosaicNode<T> | null {
    if (isControlled(props)) {
      return props.value;
    }
    return internalNode();
  }

  function replaceRoot(currentNode: MosaicNode<T> | null, suppressOnRelease: boolean = false) {
    props.onChange?.(currentNode);
    if (!suppressOnRelease && props.onRelease) {
      props.onRelease(currentNode);
    }
    if (isUncontrolled(props)) {
      setInternalNode(() => currentNode);
    }
  }

  function updateRoot(updates: MosaicUpdate<T>[], suppressOnRelease: boolean = false) {
    const currentNode = getRoot() || ({} as MosaicNode<T>);
    replaceRoot(updateTree(currentNode, updates), suppressOnRelease);
  }

  const actions: MosaicRootActions<T> = {
    updateTree: updateRoot,
    remove: (path: MosaicPath) => {
      if (path.length === 0) {
        replaceRoot(null);
      } else {
        updateRoot([createRemoveUpdate(getRoot(), path)]);
      }
    },
    expand: (path: MosaicPath, percentage: number = DEFAULT_EXPAND_PERCENTAGE) =>
      updateRoot([createExpandUpdate<T>(path, percentage)]),
    getRoot: () => getRoot()!,
    hide: (path: MosaicPath) => updateRoot([createHideUpdate<T>(path)]),
    replaceWith: (path: MosaicPath, newNode: MosaicNode<T>) =>
      updateRoot([
        {
          path,
          spec: {
            $set: newNode,
          },
        },
      ]),
  };

  const childContext: MosaicContextT<T> = {
    mosaicActions: actions,
    mosaicId,
    blueprintNamespace,
  };

  function validateTree(node: MosaicNode<T> | null) {
    if (process.env.NODE_ENV !== 'production') {
      const duplicates = keys(pickBy(countBy(getLeaves(node)), (n) => n > 1));
      if (duplicates.length > 0) {
        throw new Error(
          `Duplicate IDs [${duplicates.join(', ')}] detected. Mosaic does not support leaves with the same ID`,
        );
      }
    }
  }

  function renderTree(): JSX.Element {
    const root = getRoot();
    validateTree(root);
    if (root === null || root === undefined) {
      return props.zeroStateView ?? <MosaicZeroState />;
    }
    return <MosaicRoot root={root} renderTile={props.renderTile} resize={props.resize} />;
  }

  return (
    <MosaicContext.Provider value={childContext as MosaicContextT<any>}>
      <div class={classNames(className(), 'mosaic mosaic-drop-target')}>
        {renderTree()}
        <RootDropTargets />
      </div>
    </MosaicContext.Provider>
  );
}

// Alias for backward compatibility
export const MosaicWithoutDragDropContext = Mosaic;
