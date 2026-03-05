import classNames from 'classnames';
import { JSX } from 'solid-js';
import { useMosaicContext } from '../contextTypes';
import { OptionalBlueprint } from '../util/OptionalBlueprint';

export const DefaultToolbarButton = (props: {
  title: string;
  className: string;
  onClick: (event: MouseEvent) => any;
  text?: string;
}) => {
  const ctx = useMosaicContext();
  return (
    <button
      title={props.title}
      onClick={props.onClick}
      class={classNames(
        'mosaic-default-control',
        OptionalBlueprint.getClasses(ctx.blueprintNamespace, 'BUTTON', 'MINIMAL'),
        props.className,
      )}
    >
      {props.text && <span class="control-text">{props.text}</span>}
    </button>
  );
};

/**
 * @deprecated: see @DefaultToolbarButton
 */
export const createDefaultToolbarButton = (
  title: string,
  className: string,
  onClick: (event: MouseEvent) => any,
  text?: string,
): JSX.Element => <DefaultToolbarButton title={title} className={className} onClick={onClick} text={text} />;

export interface MosaicButtonProps {
  onClick?: () => void;
}
