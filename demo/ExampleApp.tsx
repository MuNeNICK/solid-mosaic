import { createSignal } from 'solid-js';
import dropRight from 'lodash/dropRight';

import {
  Corner,
  createBalancedTreeFromLeaves,
  getLeaves,
  getNodeAtPath,
  getOtherDirection,
  getPathToCorner,
  Mosaic,
  MosaicBranch,
  MosaicDirection,
  MosaicNode,
  MosaicParent,
  MosaicWindow,
  MosaicZeroState,
  updateTree,
} from '../src';

import './styles.less';

export function ExampleApp() {
  const [currentNode, setCurrentNode] = createSignal<MosaicNode<number> | null>({
    direction: 'row',
    first: 1,
    second: {
      direction: 'column',
      first: 2,
      second: 3,
    },
    splitPercentage: 40,
  });

  function onChange(node: MosaicNode<number> | null) {
    setCurrentNode(node);
  }

  function onRelease(node: MosaicNode<number> | null) {
    console.log('Mosaic.onRelease():', node);
  }

  function autoArrange() {
    const leaves = getLeaves(currentNode());
    setCurrentNode(createBalancedTreeFromLeaves(leaves));
  }

  function addToTopRight() {
    let node = currentNode();
    const totalWindowCount = getLeaves(node).length;
    if (node) {
      const path = getPathToCorner(node, Corner.TOP_RIGHT);
      const parent = getNodeAtPath(node, dropRight(path)) as MosaicParent<number>;
      const destination = getNodeAtPath(node, path) as MosaicNode<number>;
      const direction: MosaicDirection = parent ? getOtherDirection(parent.direction) : 'row';

      let first: MosaicNode<number>;
      let second: MosaicNode<number>;
      if (direction === 'row') {
        first = destination;
        second = totalWindowCount + 1;
      } else {
        first = totalWindowCount + 1;
        second = destination;
      }

      node = updateTree(node, [
        {
          path,
          spec: {
            $set: {
              direction,
              first,
              second,
            },
          },
        },
      ]);
    } else {
      node = totalWindowCount + 1;
    }

    setCurrentNode(node);
  }

  return (
    <div class="solid-mosaic-example-app">
      <div class="example-navbar">
        <span class="navbar-heading">solid-mosaic</span>
        <button onClick={autoArrange}>Auto Arrange</button>
        <button onClick={addToTopRight}>Add Window to Top Right</button>
      </div>
      <Mosaic<number>
        renderTile={(count, path) => {
          const totalWindowCount = getLeaves(currentNode()).length;
          return (
            <MosaicWindow<number>
              title={`Window ${count}`}
              createNode={() => totalWindowCount + 1}
              path={path}
              onDragStart={() => console.log('MosaicWindow.onDragStart')}
              onDragEnd={(type) => console.log('MosaicWindow.onDragEnd', type)}
            >
              <div class="example-window">
                <h1>{`Window ${count}`}</h1>
              </div>
            </MosaicWindow>
          );
        }}
        zeroStateView={<MosaicZeroState createNode={() => getLeaves(currentNode()).length + 1} />}
        value={currentNode()}
        onChange={onChange}
        onRelease={onRelease}
        className="mosaic-blueprint-theme"
        blueprintNamespace="bp4"
      />
    </div>
  );
}
