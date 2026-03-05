import noop from 'lodash/noop';
import { useMosaicWindowContext } from '../contextTypes';
import { DefaultToolbarButton, MosaicButtonProps } from './MosaicButton';

export function SplitButton(props: MosaicButtonProps) {
  const windowCtx = useMosaicWindowContext();

  function handleClick() {
    windowCtx.mosaicWindowActions
      .split()
      .then(() => {
        props.onClick?.();
      })
      .catch(noop);
  }

  return (
    <DefaultToolbarButton
      title="Split Window"
      className="split-button"
      onClick={handleClick}
    />
  );
}
