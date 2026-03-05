import { useMosaicContext, useMosaicWindowContext } from '../contextTypes';
import { DefaultToolbarButton, MosaicButtonProps } from './MosaicButton';

export function ExpandButton(props: MosaicButtonProps) {
  const ctx = useMosaicContext();
  const windowCtx = useMosaicWindowContext();

  function handleClick() {
    ctx.mosaicActions.expand(windowCtx.mosaicWindowActions.getPath());
    props.onClick?.();
  }

  return (
    <DefaultToolbarButton
      title="Expand"
      className="expand-button"
      onClick={handleClick}
    />
  );
}
