import { createContext, useContext } from 'solid-js';
import { MosaicKey, MosaicNode, MosaicPath, MosaicUpdate } from './types';

/**
 * Context provided to everything within Mosaic
 */
export interface MosaicContextT<T extends MosaicKey> {
  mosaicActions: MosaicRootActions<T>;
  mosaicId: string;
  blueprintNamespace: string;
}

/**
 * Context provided to everything within a Mosaic Window
 */
export interface MosaicWindowContextT {
  blueprintNamespace: string;
  mosaicWindowActions: MosaicWindowActions;
}

/**
 * These actions are used to alter the state of the view tree
 */
export interface MosaicRootActions<T extends MosaicKey> {
  expand: (path: MosaicPath, percentage?: number) => void;
  remove: (path: MosaicPath) => void;
  hide: (path: MosaicPath) => void;
  replaceWith: (path: MosaicPath, node: MosaicNode<T>) => void;
  updateTree: (updates: MosaicUpdate<T>[], suppressOnRelease?: boolean) => void;
  getRoot: () => MosaicNode<T> | null;
}

export interface MosaicWindowActions {
  split: (...args: any[]) => Promise<void>;
  replaceWithNew: (...args: any[]) => Promise<void>;
  setAdditionalControlsOpen: (open: boolean | 'toggle') => void;
  getPath: () => MosaicPath;
}

export const MosaicContext = createContext<MosaicContextT<MosaicKey>>();
export const MosaicWindowContext = createContext<MosaicWindowContextT>();

export function useMosaicContext(): MosaicContextT<MosaicKey> {
  const ctx = useContext(MosaicContext);
  if (!ctx) {
    throw new Error('useMosaicContext must be used within a Mosaic component');
  }
  return ctx;
}

export function useMosaicWindowContext(): MosaicWindowContextT {
  const ctx = useContext(MosaicWindowContext);
  if (!ctx) {
    throw new Error('useMosaicWindowContext must be used within a MosaicWindow component');
  }
  return ctx;
}
