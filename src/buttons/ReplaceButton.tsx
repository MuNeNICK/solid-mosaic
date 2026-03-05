import noop from 'lodash/noop';
import { useMosaicWindowContext } from '../contextTypes';
import { DefaultToolbarButton, MosaicButtonProps } from './MosaicButton';

export function ReplaceButton(props: MosaicButtonProps) {
  const windowCtx = useMosaicWindowContext();

  function handleClick() {
    windowCtx.mosaicWindowActions
      .replaceWithNew()
      .then(() => {
        props.onClick?.();
      })
      .catch(noop);
  }

  return (
    <DefaultToolbarButton
      title="Replace Window"
      className="replace-button"
      onClick={handleClick}
    />
  );
}
