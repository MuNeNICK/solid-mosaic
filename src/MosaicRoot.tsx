import { JSX } from 'solid-js';
import { useMosaicContext } from './contextTypes';
import { Split } from './Split';
import { MosaicBranch, MosaicDirection, MosaicKey, MosaicNode, ResizeOptions, TileRenderer } from './types';
import { BoundingBox } from './util/BoundingBox';
import { isParent } from './util/mosaicUtilities';

export interface MosaicRootProps<T extends MosaicKey> {
  root: MosaicNode<T>;
  renderTile: TileRenderer<T>;
  resize?: ResizeOptions;
}

export function MosaicRoot<T extends MosaicKey>(props: MosaicRootProps<T>) {
  const ctx = useMosaicContext();

  function onResize(percentage: number, path: MosaicBranch[], suppressOnRelease: boolean) {
    ctx.mosaicActions.updateTree(
      [
        {
          path,
          spec: {
            splitPercentage: {
              $set: percentage,
            },
          },
        },
      ],
      suppressOnRelease,
    );
  }

  function renderSplit(
    direction: MosaicDirection,
    boundingBox: BoundingBox,
    splitPercentage: number,
    path: MosaicBranch[],
  ): JSX.Element | null {
    if (props.resize !== 'DISABLED') {
      return (
        <Split
          {...(typeof props.resize === 'object' ? props.resize : {})}
          boundingBox={boundingBox}
          splitPercentage={splitPercentage}
          direction={direction}
          onChange={(percentage) => onResize(percentage, path, true)}
          onRelease={(percentage) => onResize(percentage, path, false)}
        />
      );
    }
    return null;
  }

  function renderRecursively(
    node: MosaicNode<T>,
    boundingBox: BoundingBox,
    path: MosaicBranch[],
  ): JSX.Element | JSX.Element[] {
    if (isParent(node)) {
      const splitPercentage = node.splitPercentage == null ? 50 : node.splitPercentage;
      const { first, second } = BoundingBox.split(boundingBox, splitPercentage, node.direction);
      const elements: (JSX.Element | JSX.Element[])[] = [
        renderRecursively(node.first, first, path.concat('first')),
        renderSplit(node.direction, boundingBox, splitPercentage, path),
        renderRecursively(node.second, second, path.concat('second')),
      ].filter((x): x is JSX.Element | JSX.Element[] => x !== null);
      return elements.flat() as JSX.Element[];
    } else {
      return (
        <div class="mosaic-tile" style={{ ...BoundingBox.asStyles(boundingBox) }}>
          {props.renderTile(node, path)}
        </div>
      );
    }
  }

  return <div class="mosaic-root">{renderRecursively(props.root, BoundingBox.empty(), [])}</div>;
}
