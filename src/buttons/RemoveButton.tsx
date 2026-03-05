import { useMosaicContext, useMosaicWindowContext } from '../contextTypes';
import { DefaultToolbarButton, MosaicButtonProps } from './MosaicButton';

export function RemoveButton(props: MosaicButtonProps) {
  const ctx = useMosaicContext();
  const windowCtx = useMosaicWindowContext();

  function handleClick() {
    ctx.mosaicActions.remove(windowCtx.mosaicWindowActions.getPath());
    props.onClick?.();
  }

  return (
    <DefaultToolbarButton
      title="Close Window"
      className="close-button"
      onClick={handleClick}
    />
  );
}
