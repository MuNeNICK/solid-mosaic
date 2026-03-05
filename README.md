# solid-mosaic

A full-featured SolidJS Tiling Window Manager — a port of [react-mosaic](https://github.com/nomcopter/react-mosaic).

[**Demo**](https://munenick.github.io/solid-mosaic/)

## Installation

```bash
npm install solid-mosaic-component
```

Make sure `solid-mosaic-component.css` is included on your page.

## Usage

### Simple Tiling

```tsx
import { Mosaic } from 'solid-mosaic-component';
import 'solid-mosaic-component/solid-mosaic-component.css';

const ELEMENT_MAP: Record<string, JSX.Element> = {
  a: <div>Left Window</div>,
  b: <div>Top Right Window</div>,
  c: <div>Bottom Right Window</div>,
};

export function App() {
  return (
    <Mosaic<string>
      renderTile={(id) => ELEMENT_MAP[id]}
      initialValue={{
        direction: 'row',
        first: 'a',
        second: {
          direction: 'column',
          first: 'b',
          second: 'c',
        },
        splitPercentage: 40,
      }}
    />
  );
}
```

### Drag, Drop, and Toolbar with `MosaicWindow`

```tsx
import { Mosaic, MosaicWindow } from 'solid-mosaic-component';

type ViewId = 'a' | 'b' | 'c' | 'new';

const TITLE_MAP: Record<ViewId, string> = {
  a: 'Left Window',
  b: 'Top Right Window',
  c: 'Bottom Right Window',
  new: 'New Window',
};

export function App() {
  return (
    <Mosaic<ViewId>
      renderTile={(id, path) => (
        <MosaicWindow<ViewId> path={path} createNode={() => 'new'} title={TITLE_MAP[id]}>
          <h1>{TITLE_MAP[id]}</h1>
        </MosaicWindow>
      )}
      initialValue={{
        direction: 'row',
        first: 'a',
        second: {
          direction: 'column',
          first: 'b',
          second: 'c',
        },
      }}
    />
  );
}
```

### Controlled vs. Uncontrolled

Mosaic supports two modes:

- **Uncontrolled**: Pass `initialValue` and Mosaic manages its own state.
- **Controlled**: Pass `value` and `onChange` to manage state externally.

## API

### `Mosaic` Props

| Prop | Type | Description |
|------|------|-------------|
| `renderTile` | `(id: T, path: MosaicBranch[]) => JSX.Element` | Renders the content for each tile |
| `value` | `MosaicNode<T> \| null` | Controlled tree value |
| `initialValue` | `MosaicNode<T> \| null` | Uncontrolled initial tree value |
| `onChange` | `(newNode: MosaicNode<T> \| null) => void` | Called on any tree change |
| `onRelease` | `(newNode: MosaicNode<T> \| null) => void` | Called when a user completes a change |
| `className` | `string` | Additional CSS class (default: `'mosaic-blueprint-theme'`) |
| `resize` | `ResizeOptions` | Options that control resizing |
| `zeroStateView` | `JSX.Element` | View displayed when value is `null` |
| `mosaicId` | `string` | Override the mosaic instance ID |
| `blueprintNamespace` | `string` | Blueprint CSS class prefix (default: `'bp3'`) |

### `MosaicWindow` Props

| Prop | Type | Description |
|------|------|-------------|
| `title` | `string` | Window title |
| `path` | `MosaicBranch[]` | Path to this window (provided by `renderTile`) |
| `createNode` | `CreateNode<T>` | Factory for new nodes (enables Split/Replace buttons) |
| `toolbarControls` | `JSX.Element` | Custom toolbar controls |
| `additionalControls` | `JSX.Element` | Controls hidden in a drawer beneath the toolbar |
| `additionalControlButtonText` | `string` | Label for the drawer toggle button |
| `draggable` | `boolean` | Whether the window can be dragged (default: `true`) |
| `renderPreview` | `(props) => JSX.Element` | Custom drag preview |
| `renderToolbar` | `(props, draggable) => JSX.Element` | Custom toolbar renderer |
| `onDragStart` | `() => void` | Called when drag begins |
| `onDragEnd` | `(type: 'drop' \| 'reset') => void` | Called when drag ends |

### Context

Use `useMosaicContext()` and `useMosaicWindowContext()` to access mosaic actions from child components.

### Tree Utilities

Utilities for working with the `MosaicNode` tree are available:

- `getLeaves(node)` — Get all leaf IDs
- `createBalancedTreeFromLeaves(leaves)` — Create an evenly distributed tree
- `getPathToCorner(node, corner)` — Get path to a corner of the tree
- `updateTree(node, updates)` — Apply updates to the tree

## Differences from react-mosaic

- Built for **SolidJS** instead of React
- Uses native **HTML5 Drag and Drop API** instead of `react-dnd`
- No `react-dnd` or `DragDropManager` props — DnD is built in
- Blueprint theming is optional (styles are provided via `.less` files)

## Acknowledgements

This project is a SolidJS port of [react-mosaic](https://github.com/nomcopter/react-mosaic) by Kevin Verdieck, originally developed at Palantir Technologies, Inc. The API design, tree data structure, and layout algorithms are derived from the original project.

## License

Apache-2.0 — Originally developed by Kevin Verdieck at Palantir Technologies, Inc.
