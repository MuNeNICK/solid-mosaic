import classNames from 'classnames';
import noop from 'lodash/noop';

import { useMosaicContext } from './contextTypes';
import { CreateNode, MosaicKey } from './types';
import { OptionalBlueprint } from './util/OptionalBlueprint';

export interface MosaicZeroStateProps<T extends MosaicKey> {
  createNode?: CreateNode<T>;
}

export function MosaicZeroState<T extends MosaicKey>(props: MosaicZeroStateProps<T>) {
  const ctx = useMosaicContext();

  function replace() {
    Promise.resolve(props.createNode!())
      .then((node) => ctx.mosaicActions.replaceWith([], node))
      .catch(noop);
  }

  return (
    <div
      class={classNames(
        'mosaic-zero-state',
        OptionalBlueprint.getClasses(ctx.blueprintNamespace, 'NON_IDEAL_STATE'),
      )}
    >
      <div class={OptionalBlueprint.getClasses(ctx.blueprintNamespace, 'NON_IDEAL_STATE_VISUAL')}>
        <OptionalBlueprint.Icon className="default-zero-state-icon" size="large" icon="APPLICATIONS" />
      </div>
      <h4 class={OptionalBlueprint.getClasses(ctx.blueprintNamespace, 'HEADING')}>No Windows Present</h4>
      <div>
        {props.createNode && (
          <button
            class={classNames(
              OptionalBlueprint.getClasses(ctx.blueprintNamespace, 'BUTTON'),
              OptionalBlueprint.getIconClass(ctx.blueprintNamespace, 'ADD'),
            )}
            onClick={replace}
          >
            Add New Window
          </button>
        )}
      </div>
    </div>
  );
}
